/**
 * Feature — Business health score (§5 #6). The 0–100 score is computed
 * deterministically from real metrics; Gemma only writes the plain-English
 * explanation (and only if available).
 */
import { generate, isGemmaAvailable } from './gemma.js';
import type { DashboardKpis } from '../repositories/report.repository.js';

export interface HealthScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: Record<string, number>;
  narrative: string;
}

export async function computeHealthScore(kpis: DashboardKpis): Promise<HealthScore> {
  const revenue = Number(kpis.total_revenue);
  const expenses = Number(kpis.total_expenses);
  const net = kpis.net_profit;
  const margin = revenue > 0 ? net / revenue : net >= 0 ? 0 : -1;

  const factors = {
    profitability: clamp(50 + margin * 100, 0, 40), // up to 40 pts
    positiveCashflow: net >= 0 ? 25 : 0, // 25 pts
    collections: kpis.overdue_count === 0 ? 20 : clamp(20 - kpis.overdue_count * 4, 0, 20), // up to 20
    activity: kpis.invoice_count + kpis.expense_count > 0 ? 15 : 0, // 15 pts
  };
  const score = Math.round(clamp(Object.values(factors).reduce((a, b) => a + b, 0), 0, 100));
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';

  let narrative = defaultNarrative(score, net, kpis.overdue_count, margin);
  if (isGemmaAvailable()) {
    try {
      narrative = await generate(
        `Write a 2-sentence plain-English explanation of a business health score of ${score}/100.
Net profit: ${net}. Overdue invoices: ${kpis.overdue_count}. Profit margin: ${(margin * 100).toFixed(0)}%.
Be direct, no jargon.`,
      );
    } catch {
      /* keep default */
    }
  }
  return { score, grade, factors, narrative };
}

function defaultNarrative(score: number, net: number, overdue: number, margin: number): string {
  const health = score >= 70 ? 'healthy' : score >= 40 ? 'mixed' : 'strained';
  const profit = net >= 0 ? `a positive net of ${net.toFixed(0)}` : `a shortfall of ${Math.abs(net).toFixed(0)}`;
  const collect = overdue > 0 ? ` ${overdue} invoice(s) are overdue and dragging the score down.` : '';
  return `Your finances look ${health} at ${score}/100, with ${profit} and a ${(margin * 100).toFixed(0)}% margin.${collect}`;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
