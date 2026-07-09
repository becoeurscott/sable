/** Read-only financial aggregations (§10 dashboard + reports). Pure SQL — the
 *  numbers must be exact, so Gemma is never in this path (§3). */
import { asUser } from '../config/db.js';

export interface DashboardKpis {
  total_revenue: string;
  total_expenses: string;
  net_profit: number;
  outstanding: string;
  invoice_count: number;
  expense_count: number;
  overdue_count: number;
}

export async function dashboardKpis(
  userId: string,
  orgId: string,
  from: string,
  to: string,
): Promise<DashboardKpis> {
  return asUser(userId, async (c) => {
    const rev = (
      await c.query<{ sum: string }>(
        `SELECT COALESCE(SUM(amount),0) AS sum FROM public.revenues
          WHERE organization_id = $1 AND revenue_date BETWEEN $2 AND $3`,
        [orgId, from, to],
      )
    ).rows[0]!.sum;
    const exp = (
      await c.query<{ sum: string; n: string }>(
        `SELECT COALESCE(SUM(amount),0) AS sum, count(*) AS n FROM public.expenses
          WHERE organization_id = $1 AND expense_date BETWEEN $2 AND $3 AND status <> 'rejected'`,
        [orgId, from, to],
      )
    ).rows[0]!;
    const inv = (
      await c.query<{ outstanding: string; total: string; overdue: string }>(
        `SELECT
            COALESCE(SUM(total) FILTER (WHERE status IN ('sent','viewed','overdue')),0) AS outstanding,
            count(*) AS total,
            count(*) FILTER (WHERE status = 'overdue' OR (status IN ('sent','viewed') AND due_date < CURRENT_DATE)) AS overdue
           FROM public.invoices WHERE organization_id = $1`,
        [orgId],
      )
    ).rows[0]!;

    return {
      total_revenue: rev,
      total_expenses: exp.sum,
      net_profit: Number(rev) - Number(exp.sum),
      outstanding: inv.outstanding,
      invoice_count: Number(inv.total),
      expense_count: Number(exp.n),
      overdue_count: Number(inv.overdue),
    };
  });
}

export interface MonthlyPoint {
  month: string;
  revenue: string;
  expenses: string;
}

export async function cashflowByMonth(
  userId: string,
  orgId: string,
  months: number,
): Promise<MonthlyPoint[]> {
  return asUser(userId, async (c) => {
    const res = await c.query<MonthlyPoint>(
      `WITH series AS (
         SELECT to_char(date_trunc('month', CURRENT_DATE) - (g || ' months')::interval, 'YYYY-MM') AS month
           FROM generate_series(0, $2 - 1) g
       )
       SELECT s.month,
              COALESCE(r.revenue, 0)  AS revenue,
              COALESCE(e.expenses, 0) AS expenses
         FROM series s
         LEFT JOIN (
           SELECT to_char(revenue_date, 'YYYY-MM') AS m, SUM(amount) AS revenue
             FROM public.revenues WHERE organization_id = $1 GROUP BY 1
         ) r ON r.m = s.month
         LEFT JOIN (
           SELECT to_char(expense_date, 'YYYY-MM') AS m, SUM(amount) AS expenses
             FROM public.expenses WHERE organization_id = $1 AND status <> 'rejected' GROUP BY 1
         ) e ON e.m = s.month
        ORDER BY s.month ASC`,
      [orgId, months],
    );
    return res.rows;
  });
}

export interface CategoryTotal {
  category: string;
  total: string;
}

export async function expensesByCategory(
  userId: string,
  orgId: string,
  from: string,
  to: string,
): Promise<CategoryTotal[]> {
  return asUser(userId, async (c) => {
    const res = await c.query<CategoryTotal>(
      `SELECT category, SUM(amount) AS total FROM public.expenses
        WHERE organization_id = $1 AND expense_date BETWEEN $2 AND $3 AND status <> 'rejected'
        GROUP BY category ORDER BY total DESC`,
      [orgId, from, to],
    );
    return res.rows;
  });
}
