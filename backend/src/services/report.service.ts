/** Reporting + dashboard aggregation (§10 /dashboard, /reports/*). Exact SQL. */
import dayjs from 'dayjs';
import {
  dashboardKpis,
  cashflowByMonth,
  expensesByCategory,
} from '../repositories/report.repository.js';

export interface DateRange {
  from: string;
  to: string;
}

/** Default range = current fiscal year-to-date if none supplied. */
export function resolveRange(from?: string, to?: string): DateRange {
  return {
    from: from ?? dayjs().startOf('year').format('YYYY-MM-DD'),
    to: to ?? dayjs().format('YYYY-MM-DD'),
  };
}

export async function dashboard(userId: string, orgId: string, range: DateRange) {
  const kpis = await dashboardKpis(userId, orgId, range.from, range.to);
  return { range, kpis };
}

export async function cashflow(userId: string, orgId: string, months: number) {
  const points = await cashflowByMonth(userId, orgId, Math.min(Math.max(months, 1), 36));
  return { months, series: points };
}

export async function profitAndLoss(userId: string, orgId: string, range: DateRange) {
  const [kpis, byCategory] = await Promise.all([
    dashboardKpis(userId, orgId, range.from, range.to),
    expensesByCategory(userId, orgId, range.from, range.to),
  ]);
  return {
    range,
    revenue: Number(kpis.total_revenue),
    expenses: Number(kpis.total_expenses),
    netProfit: kpis.net_profit,
    expensesByCategory: byCategory.map((c) => ({ category: c.category, total: Number(c.total) })),
  };
}

export async function cashflowStatement(userId: string, orgId: string, months: number) {
  const points = await cashflowByMonth(userId, orgId, months);
  return {
    months,
    statement: points.map((p) => ({
      month: p.month,
      inflow: Number(p.revenue),
      outflow: Number(p.expenses),
      net: Number(p.revenue) - Number(p.expenses),
    })),
  };
}

/** Simplified tax summary — estimated liability at a flat rate (MVP). */
export async function taxSummary(userId: string, orgId: string, range: DateRange, rate = 0.21) {
  const kpis = await dashboardKpis(userId, orgId, range.from, range.to);
  const taxable = Math.max(0, kpis.net_profit);
  return {
    range,
    taxableIncome: taxable,
    estimatedRate: rate,
    estimatedTax: Math.round(taxable * rate * 100) / 100,
    disclaimer: 'Estimate only. Not tax advice — consult a licensed CPA.',
  };
}

/** CSV export of a P&L (§10 /reports/export). */
export async function exportPlCsv(userId: string, orgId: string, range: DateRange): Promise<string> {
  const pl = await profitAndLoss(userId, orgId, range);
  const lines = [
    'Section,Category,Amount',
    `Summary,Revenue,${pl.revenue.toFixed(2)}`,
    `Summary,Expenses,${pl.expenses.toFixed(2)}`,
    `Summary,Net Profit,${pl.netProfit.toFixed(2)}`,
    ...pl.expensesByCategory.map((c) => `Expenses,${csv(c.category)},${c.total.toFixed(2)}`),
  ];
  return lines.join('\n');
}

const csv = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
