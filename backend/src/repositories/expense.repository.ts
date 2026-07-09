import { asUser } from '../config/db.js';

export interface ExpenseRow {
  id: string;
  organization_id: string;
  amount: string;
  currency: string;
  category: string;
  vendor: string | null;
  description: string | null;
  raw_description: string | null;
  ai_categorized: boolean;
  ai_confidence: 'high' | 'medium' | 'low' | null;
  expense_date: string;
  receipt_url: string | null;
  is_billable: boolean;
  is_reimbursable: boolean;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseFilter {
  category?: string;
  status?: string;
  vendor?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

/** Build a parameterized WHERE from a filter object (never string-concats input). */
function buildFilter(orgId: string, f: ExpenseFilter): { where: string; params: unknown[] } {
  const clauses = ['organization_id = $1'];
  const params: unknown[] = [orgId];
  const add = (sql: string, val: unknown) => {
    params.push(val);
    clauses.push(sql.replace('$?', `$${params.length}`));
  };
  if (f.category) add('category = $?', f.category);
  if (f.status) add('status = $?', f.status);
  if (f.vendor) add('vendor ILIKE $?', `%${f.vendor}%`);
  if (f.dateFrom) add('expense_date >= $?', f.dateFrom);
  if (f.dateTo) add('expense_date <= $?', f.dateTo);
  if (f.amountMin != null) add('amount >= $?', f.amountMin);
  if (f.amountMax != null) add('amount <= $?', f.amountMax);
  return { where: clauses.join(' AND '), params };
}

export async function listExpenses(
  userId: string,
  orgId: string,
  filter: ExpenseFilter,
  limit: number,
  offset: number,
): Promise<{ rows: ExpenseRow[]; total: number }> {
  return asUser(userId, async (c) => {
    const { where, params } = buildFilter(orgId, filter);
    const rows = (
      await c.query<ExpenseRow>(
        `SELECT * FROM public.expenses WHERE ${where}
          ORDER BY expense_date DESC, created_at DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      )
    ).rows;
    const total = Number(
      (await c.query<{ count: string }>(`SELECT count(*) FROM public.expenses WHERE ${where}`, params))
        .rows[0]!.count,
    );
    return { rows, total };
  });
}

export async function getExpense(userId: string, id: string): Promise<ExpenseRow | null> {
  return asUser(userId, async (c) => {
    const res = await c.query<ExpenseRow>(`SELECT * FROM public.expenses WHERE id = $1`, [id]);
    return res.rows[0] ?? null;
  });
}

export async function createExpense(
  userId: string,
  orgId: string,
  input: {
    amount: number;
    currency: string;
    category: string;
    vendor?: string;
    description?: string;
    rawDescription?: string;
    aiCategorized?: boolean;
    aiConfidence?: 'high' | 'medium' | 'low';
    expenseDate?: string;
    receiptUrl?: string;
    isBillable?: boolean;
    isReimbursable?: boolean;
  },
): Promise<ExpenseRow> {
  return asUser(userId, async (c) => {
    const res = await c.query<ExpenseRow>(
      `INSERT INTO public.expenses
        (organization_id, amount, currency, category, vendor, description, raw_description,
         ai_categorized, ai_confidence, expense_date, receipt_url, is_billable, is_reimbursable, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10, CURRENT_DATE),$11,$12,$13,$14)
       RETURNING *`,
      [
        orgId,
        input.amount,
        input.currency,
        input.category,
        input.vendor ?? null,
        input.description ?? null,
        input.rawDescription ?? null,
        input.aiCategorized ?? false,
        input.aiConfidence ?? null,
        input.expenseDate ?? null,
        input.receiptUrl ?? null,
        input.isBillable ?? false,
        input.isReimbursable ?? false,
        userId,
      ],
    );
    return res.rows[0]!;
  });
}

export async function updateExpense(
  userId: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<ExpenseRow | null> {
  const fields = Object.keys(patch);
  if (fields.length === 0) return getExpense(userId, id);
  const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  return asUser(userId, async (c) => {
    const res = await c.query<ExpenseRow>(
      `UPDATE public.expenses SET ${sets} WHERE id = $1 RETURNING *`,
      [id, ...fields.map((f) => patch[f])],
    );
    return res.rows[0] ?? null;
  });
}

export async function approveExpense(
  userId: string,
  id: string,
  decision: 'approved' | 'rejected',
): Promise<ExpenseRow | null> {
  return asUser(userId, async (c) => {
    const res = await c.query<ExpenseRow>(
      `UPDATE public.expenses SET status = $2, approved_by = $3 WHERE id = $1 RETURNING *`,
      [id, decision, userId],
    );
    return res.rows[0] ?? null;
  });
}

export async function deleteExpense(userId: string, id: string): Promise<number> {
  return asUser(userId, async (c) => {
    const res = await c.query(`DELETE FROM public.expenses WHERE id = $1`, [id]);
    return res.rowCount ?? 0;
  });
}
