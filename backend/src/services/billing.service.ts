/** Billing / subscriptions (§2, §10 /billing/*, §12 Stripe security). */
import type Stripe from 'stripe';
import { stripe, requireStripe } from '../config/stripe.js';
import { env } from '../config/env.js';
import { listPublicPlans, getPlanByCode, getPlanById } from '../repositories/plan.repository.js';
import {
  getSubscription,
  setStripeCustomer,
  getSubscriptionByStripeId,
  upsertFromStripe,
} from '../repositories/subscription.repository.js';
import { writeAudit } from '../repositories/audit.repository.js';
import { badRequest, notFound, serviceUnavailable } from '../utils/errors.js';

export async function plans() {
  return listPublicPlans();
}

export async function currentSubscription(userId: string, orgId: string) {
  const sub = await getSubscription(userId, orgId);
  if (!sub) throw notFound('No subscription found');
  return sub;
}

/**
 * Start a checkout for a paid plan. Creates/reuses the Stripe customer, then a
 * Checkout Session in subscription mode. Returns the URL to redirect to.
 */
export async function subscribe(input: {
  userId: string;
  orgId: string;
  email: string;
  planCode: string;
  interval: 'monthly' | 'annual';
  successUrl: string;
  cancelUrl: string;
}) {
  const s = requireStripe();
  const plan = await getPlanByCode(input.planCode);
  if (!plan) throw notFound('Plan not found');
  const priceId =
    input.interval === 'annual' ? plan.stripe_price_id_annual : plan.stripe_price_id_monthly;
  if (!priceId) {
    throw serviceUnavailable(
      `Plan "${plan.code}" has no Stripe price configured for ${input.interval} billing`,
    );
  }

  const sub = await getSubscription(input.userId, input.orgId);
  let customerId = sub?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await s.customers.create({
      email: input.email,
      metadata: { organization_id: input.orgId },
    });
    customerId = customer.id;
    await setStripeCustomer(input.orgId, customerId);
  }

  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { organization_id: input.orgId, plan_id: plan.id },
    subscription_data: { metadata: { organization_id: input.orgId, plan_id: plan.id } },
  });

  await writeAudit({
    orgId: input.orgId,
    actorId: input.userId,
    action: 'billing.checkout_started',
    metadata: { plan: plan.code, interval: input.interval },
  });
  return { url: session.url, sessionId: session.id };
}

export async function cancel(userId: string, orgId: string) {
  const s = requireStripe();
  const sub = await getSubscription(userId, orgId);
  if (!sub?.stripe_subscription_id) throw badRequest('No active subscription to cancel');
  const updated = await s.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: true,
  });
  await writeAudit({ orgId, actorId: userId, action: 'billing.cancel' });
  return { cancelAtPeriodEnd: updated.cancel_at_period_end };
}

// ── Webhook processing (§12 signature verification) ──────────────────────────
export function constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
  const s = requireStripe();
  if (!env.STRIPE_WEBHOOK_SECRET) throw serviceUnavailable('Webhook secret not configured');
  return s.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}

export async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = (sub.metadata?.organization_id as string) ?? null;
      const planIdMeta = (sub.metadata?.plan_id as string) ?? null;
      if (!orgId) break;

      const statusMap: Record<string, 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused'> = {
        trialing: 'trialing',
        active: 'active',
        past_due: 'past_due',
        unpaid: 'past_due',
        canceled: 'canceled',
        paused: 'paused',
        incomplete: 'past_due',
        incomplete_expired: 'canceled',
      };

      const planId = planIdMeta && (await getPlanById(planIdMeta)) ? planIdMeta : null;
      // Period fields moved from the subscription to its items across API
      // versions; read whichever the installed version exposes.
      const periods = extractPeriods(sub);
      await upsertFromStripe({
        orgId,
        stripeCustomerId: String(sub.customer),
        stripeSubscriptionId: sub.id,
        planId,
        status: statusMap[sub.status] ?? 'past_due',
        periodStart: periods.start ? new Date(periods.start * 1000) : null,
        periodEnd: periods.end ? new Date(periods.end * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      });
      await writeAudit({ orgId, action: `stripe.${event.type}`, metadata: { subscription: sub.id } });
      break;
    }
    default:
      // Ignore unhandled event types (still ack 200 so Stripe stops retrying).
      break;
  }
}

export const billingEnabled = (): boolean => stripe !== null;

export async function subscriptionByStripeId(id: string) {
  return getSubscriptionByStripeId(id);
}

/** Read period bounds from either the subscription or its first item (API-version safe). */
function extractPeriods(sub: Stripe.Subscription): { start?: number; end?: number } {
  const anySub = sub as unknown as {
    current_period_start?: number;
    current_period_end?: number;
    items?: { data?: Array<{ current_period_start?: number; current_period_end?: number }> };
  };
  const item = anySub.items?.data?.[0];
  return {
    start: anySub.current_period_start ?? item?.current_period_start,
    end: anySub.current_period_end ?? item?.current_period_end,
  };
}
