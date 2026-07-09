import { query } from '../config/db.js';

export interface PlanRow {
  id: string;
  code: string;
  name: string;
  price_monthly: number;
  price_annual: number | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
  quotas: Record<string, number | null>;
  features: Record<string, unknown>;
  sort_order: number;
  is_public: boolean;
}

export async function listPublicPlans(): Promise<PlanRow[]> {
  return query<PlanRow>(
    `SELECT * FROM public.plans WHERE is_public = TRUE ORDER BY sort_order ASC`,
  );
}

export async function getPlanByCode(code: string): Promise<PlanRow | null> {
  const rows = await query<PlanRow>(`SELECT * FROM public.plans WHERE code = $1`, [code]);
  return rows[0] ?? null;
}

export async function getPlanById(id: string): Promise<PlanRow | null> {
  const rows = await query<PlanRow>(`SELECT * FROM public.plans WHERE id = $1`, [id]);
  return rows[0] ?? null;
}
