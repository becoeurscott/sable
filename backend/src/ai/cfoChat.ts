/**
 * AI CFO chat (§10 /ai/chat, §5). Gemma answers financial questions grounded in
 * the org's *aggregated* KPIs (never raw ledgers — cost + privacy, §4). When
 * Gemma is unavailable, returns a deterministic summary of the same numbers.
 */
import { generate, isGemmaAvailable } from './gemma.js';
import type { DashboardKpis } from '../repositories/report.repository.js';

export async function answerCfoQuestion(
  question: string,
  context: { orgName: string; kpis: DashboardKpis; period: string },
): Promise<string> {
  const { kpis } = context;
  if (!isGemmaAvailable()) {
    return (
      `AI narration is not configured, but here are your numbers for ${context.period}: ` +
      `revenue ${kpis.total_revenue}, expenses ${kpis.total_expenses}, ` +
      `net ${kpis.net_profit.toFixed(2)}, outstanding invoices ${kpis.outstanding} ` +
      `(${kpis.overdue_count} overdue). Set GEMMA_API_KEY to enable conversational answers.`
    );
  }

  const prompt = `You are the AI CFO for ${context.orgName}. Answer the user's question using ONLY the data below.
Do not invent numbers. If the data cannot answer it, say so plainly.

FINANCIAL DATA (${context.period}):
- Revenue: ${kpis.total_revenue}
- Expenses: ${kpis.total_expenses}
- Net profit: ${kpis.net_profit}
- Outstanding invoices: ${kpis.outstanding} (${kpis.overdue_count} overdue)
- Invoice count: ${kpis.invoice_count}, Expense count: ${kpis.expense_count}

QUESTION: ${question}

Answer in 2-4 sentences, plain English, no jargon.`;

  return generate(prompt);
}
