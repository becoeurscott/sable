import { asUser } from '../config/db.js';

export interface RevenueRow {
  id: string;
  organization_id: string;
  amount: string;
  currency: string;
  source: string;
  description: string | null;
  invoice_id: string | null;
  revenue_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export async function listRevenues(
  userId: string,
  orgId: string,
  filter: { source?: string; dateFrom?: string; dateTo?: string },
  limit: number,
  offset: number,
): Promise<{ rows: RevenueRow[]; total: number }> {
  return asUser(userId, async (c) => {
    const clauses = ['organization_id = $1'];
    const params: unknown[] = [orgId];
    const add = (sql: string, val: unknown) => {
      params.push(val);
      clauses.push(sql.replace('$?', `$${params.length}`));
    };
    if (filter.source) add('source ILIKE $?', `%${filter.source}%`);
    if (filter.dateFrom) add('revenue_date >= $?', filter.dateFrom);
    if (filter.dateTo) add('revenue_date <= $?', filter.dateTo);
    const where = clauses.join(' AND ');

    const rows = (
      await c.query<RevenueRow>(
        `SELECT * FROM public.revenues WHERE ${where}
          ORDER BY revenue_date DESC, created_at DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      )
    ).rows;
    const total = Number(
      (await c.query<{ count: string }>(`SELECT count(*) FROM public.revenues WHERE ${where}`, params))
        .rows[0]!.count,
    );
    return { rows, total };
  });
}

export async function getRevenue(userId: string, id: string): Promise<RevenueRow | null> {
  return asUser(userId, async (c) => {
    const res = await c.query<RevenueRow>(`SELECT * FROM public.revenues WHERE id = $1`, [id]);
    return res.rows[0] ?? null;
  });
}

export async function createRevenue(
  userId: string,
  orgId: string,
  input: {
    amount: number;
    currency: string;
    source: string;
    description?: string;
    invoiceId?: string;
    revenueDate?: string;
  },
): Promise<RevenueRow> {
  return asUser(userId, async (c) => {
    const res = await c.query<RevenueRow>(
      `INSERT INTO public.revenues
        (organization_id, amount, currency, source, description, invoice_id, revenue_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,CURRENT_DATE),$8) RETURNING *`,
      [
        orgId,
        input.amount,
        input.currency,
        input.source,
        input.description ?? null,
        input.invoiceId ?? null,
        input.revenueDate ?? null,
        userId,
      ],
    );
    return res.rows[0]!;
  });
}

export async function updateRevenue(
  userId: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<RevenueRow | null> {
  const fields = Object.keys(patch);
  if (fields.length === 0) return getRevenue(userId, id);
  const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  return asUser(userId, async (c) => {
    const res = await c.query<RevenueRow>(
      `UPDATE public.revenues SET ${sets} WHERE id = $1 RETURNING *`,
      [id, ...fields.map((f) => patch[f])],
    );
    return res.rows[0] ?? null;
  });
}

export async function deleteRevenue(userId: string, id: string): Promise<number> {
  return asUser(userId, async (c) => {
    const res = await c.query(`DELETE FROM public.revenues WHERE id = $1`, [id]);
    return res.rowCount ?? 0;
  });
}
