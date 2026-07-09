/** Usage metering (§2 quotas, §5). Writes in service context (metering is a
 *  cross-cutting concern, not user-authorized data). */
import { query } from '../config/db.js';

export type Metric = 'ai_credits' | 'ocr' | 'invoices' | 'expenses' | 'api_calls' | 'storage_mb';

function currentPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function getUsage(orgId: string, metric: Metric, period = currentPeriod()): Promise<number> {
  const rows = await query<{ used: string }>(
    `SELECT used FROM public.usage_metrics WHERE organization_id = $1 AND period = $2 AND metric = $3`,
    [orgId, period, metric],
  );
  return rows[0] ? Number(rows[0].used) : 0;
}

export async function incrementUsage(
  orgId: string,
  metric: Metric,
  by = 1,
  period = currentPeriod(),
): Promise<number> {
  const rows = await query<{ used: string }>(
    `INSERT INTO public.usage_metrics (organization_id, period, metric, used)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (organization_id, period, metric)
     DO UPDATE SET used = public.usage_metrics.used + EXCLUDED.used, updated_at = now()
     RETURNING used`,
    [orgId, period, metric, by],
  );
  return Number(rows[0]!.used);
}

export async function getAllUsage(
  orgId: string,
  period = currentPeriod(),
): Promise<Record<string, number>> {
  const rows = await query<{ metric: string; used: string }>(
    `SELECT metric, used FROM public.usage_metrics WHERE organization_id = $1 AND period = $2`,
    [orgId, period],
  );
  return Object.fromEntries(rows.map((r) => [r.metric, Number(r.used)]));
}
