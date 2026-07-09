/**
 * Plan-quota enforcement (§2 quotas, §5 upsell triggers).
 * Reads the org's active plan and current-period usage, and blocks the action
 * with 402 Payment Required when a metered limit is hit. A null quota == unlimited.
 */
import { getPlanById } from '../repositories/plan.repository.js';
import { getOrganization } from '../repositories/organization.repository.js';
import { getUsage, type Metric } from '../repositories/usage.repository.js';
import { paymentRequired } from '../utils/errors.js';

const METRIC_TO_QUOTA: Partial<Record<Metric, string>> = {
  invoices: 'invoices_mo',
  expenses: 'expenses_mo',
  ai_credits: 'ai_credits_mo',
  ocr: 'ocr_mo',
};

/** Throws 402 if adding `by` to the metric would exceed the plan quota. */
export async function assertWithinQuota(
  userId: string,
  orgId: string,
  metric: Metric,
  by = 1,
): Promise<void> {
  const org = await getOrganization(userId, orgId);
  if (!org?.plan_id) return; // no plan on record → do not block MVP flows
  const plan = await getPlanById(org.plan_id);
  const quotaKey = METRIC_TO_QUOTA[metric];
  if (!plan || !quotaKey) return;

  const limit = plan.quotas[quotaKey];
  if (limit == null) return; // unlimited

  const used = await getUsage(orgId, metric);
  if (used + by > limit) {
    throw paymentRequired(
      `You have reached your ${plan.name} plan limit for ${metric.replace('_', ' ')} (${limit}/mo). Upgrade to continue.`,
      { metric, limit, used, plan: plan.code },
    );
  }
}
