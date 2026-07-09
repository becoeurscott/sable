/** Subscription state. Reads run in tenant context (RLS); writes are service
 *  context only — they originate from Stripe webhooks / billing service. */
import { asUser, query } from '../config/db.js';

export interface SubscriptionRow {
  id: string;
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_id: string | null;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export async function getSubscription(userId: string, orgId: string): Promise<SubscriptionRow | null> {
  return asUser(userId, async (c) => {
    const res = await c.query<SubscriptionRow>(
      `SELECT * FROM public.subscriptions WHERE organization_id = $1`,
      [orgId],
    );
    return res.rows[0] ?? null;
  });
}

/** Service context (webhook / billing). */
export async function getSubscriptionByStripeId(
  stripeSubId: string,
): Promise<SubscriptionRow | null> {
  const rows = await query<SubscriptionRow>(
    `SELECT * FROM public.subscriptions WHERE stripe_subscription_id = $1`,
    [stripeSubId],
  );
  return rows[0] ?? null;
}

export async function setStripeCustomer(orgId: string, customerId: string): Promise<void> {
  await query(`UPDATE public.subscriptions SET stripe_customer_id = $2 WHERE organization_id = $1`, [
    orgId,
    customerId,
  ]);
}

export async function upsertFromStripe(input: {
  orgId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planId: string | null;
  status: SubscriptionRow['status'];
  periodStart: Date | null;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}): Promise<void> {
  await query(
    `UPDATE public.subscriptions SET
        stripe_customer_id = $2,
        stripe_subscription_id = $3,
        plan_id = COALESCE($4, plan_id),
        status = $5,
        current_period_start = $6,
        current_period_end = $7,
        cancel_at_period_end = $8
      WHERE organization_id = $1`,
    [
      input.orgId,
      input.stripeCustomerId,
      input.stripeSubscriptionId,
      input.planId,
      input.status,
      input.periodStart,
      input.periodEnd,
      input.cancelAtPeriodEnd,
    ],
  );
  // Keep the org's active plan in sync for quota checks.
  if (input.planId) {
    await query(`UPDATE public.organizations SET plan_id = $2 WHERE id = $1`, [
      input.orgId,
      input.planId,
    ]);
  }
}
