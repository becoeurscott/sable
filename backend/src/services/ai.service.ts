/** AI CFO orchestration (§10 /ai/*). Gemma augments; DB is the source of truth. */
import dayjs from 'dayjs';
import { getOrganization } from '../repositories/organization.repository.js';
import { dashboardKpis, cashflowByMonth } from '../repositories/report.repository.js';
import { listExpenses } from '../repositories/expense.repository.js';
import { listInvoices } from '../repositories/invoice.repository.js';
import { listRevenues } from '../repositories/revenue.repository.js';
import { incrementUsage } from '../repositories/usage.repository.js';
import {
  getOrCreateConversation,
  addMessage,
  listConversations,
  listMessages,
} from '../repositories/ai.repository.js';
import { assertWithinQuota } from './quota.service.js';
import { categorizeTransaction } from '../ai/categorizer.js';
import { parseReceiptText } from '../ai/ocrParser.js';
import { parseNlQuery } from '../ai/nlSearch.js';
import { answerCfoQuestion } from '../ai/cfoChat.js';
import { computeHealthScore } from '../ai/healthScore.js';
import { isGemmaAvailable } from '../ai/gemma.js';
import { AI_CREDIT_COST } from '../ai/credits.js';
import { notFound } from '../utils/errors.js';

const ytd = () => ({ from: dayjs().startOf('year').format('YYYY-MM-DD'), to: dayjs().format('YYYY-MM-DD') });

export async function categorize(userId: string, orgId: string, rawDescription: string) {
  const cost = AI_CREDIT_COST.categorize;
  if (isGemmaAvailable()) await assertWithinQuota(userId, orgId, 'ai_credits', cost);
  const org = await getOrganization(userId, orgId);
  const cats = (org?.chart_of_accounts as string[] | undefined) ?? [];
  const result = await categorizeTransaction(rawDescription, cats);
  if (result.source === 'gemma') await incrementUsage(orgId, 'ai_credits', cost);
  return result;
}

/** Structure raw receipt OCR text into expense fields (§4 Feature C). */
export async function parseReceipt(userId: string, orgId: string, rawText: string) {
  const cost = AI_CREDIT_COST.parse_receipt;
  await assertWithinQuota(userId, orgId, 'ocr'); // OCR is its own metered quota (§2)
  if (isGemmaAvailable()) await assertWithinQuota(userId, orgId, 'ai_credits', cost);
  const result = await parseReceiptText(rawText);
  if (result.source === 'gemma') await incrementUsage(orgId, 'ai_credits', cost);
  await incrementUsage(orgId, 'ocr', 1);
  return result;
}

export async function chat(input: {
  userId: string;
  orgId: string;
  question: string;
  conversationId?: string;
}) {
  const cost = AI_CREDIT_COST.chat;
  if (isGemmaAvailable()) await assertWithinQuota(input.userId, input.orgId, 'ai_credits', cost);
  const org = await getOrganization(input.userId, input.orgId);
  const range = ytd();
  const kpis = await dashboardKpis(input.userId, input.orgId, range.from, range.to);

  const conversation = await getOrCreateConversation(
    input.userId,
    input.orgId,
    input.conversationId,
    input.question,
  );
  await addMessage(input.userId, input.orgId, conversation.id, 'user', input.question);

  const answer = await answerCfoQuestion(input.question, {
    orgName: org?.name ?? 'your business',
    kpis,
    period: `${range.from} → ${range.to}`,
  });

  await addMessage(input.userId, input.orgId, conversation.id, 'assistant', answer);
  if (isGemmaAvailable()) await incrementUsage(input.orgId, 'ai_credits', cost);

  return { conversationId: conversation.id, answer };
}

export async function history(userId: string, orgId: string) {
  return listConversations(userId, orgId);
}

export async function messages(userId: string, conversationId: string) {
  const msgs = await listMessages(userId, conversationId);
  if (msgs.length === 0) throw notFound('Conversation not found or empty');
  return msgs;
}

/** NL search → structured filter → parameterized query (§4 Feature B). */
export async function nlSearch(userId: string, orgId: string, query: string) {
  const cost = AI_CREDIT_COST.nl_search;
  if (isGemmaAvailable()) await assertWithinQuota(userId, orgId, 'ai_credits', cost);
  const parsed = await parseNlQuery(query);
  if (isGemmaAvailable()) await incrementUsage(orgId, 'ai_credits', cost);

  const f = parsed.filters;
  const limit = parsed.limit;

  if (parsed.table === 'invoices') {
    const { rows, total } = await listInvoices(
      userId,
      orgId,
      { status: f.status ?? undefined, dateFrom: f.dateFrom ?? undefined, dateTo: f.dateTo ?? undefined },
      limit,
      0,
    );
    return { table: parsed.table, interpreted: parsed, total, results: rows };
  }
  if (parsed.table === 'revenues') {
    const { rows, total } = await listRevenues(
      userId,
      orgId,
      { dateFrom: f.dateFrom ?? undefined, dateTo: f.dateTo ?? undefined },
      limit,
      0,
    );
    return { table: parsed.table, interpreted: parsed, total, results: rows };
  }
  const { rows, total } = await listExpenses(
    userId,
    orgId,
    {
      category: f.category ?? undefined,
      status: f.status ?? undefined,
      dateFrom: f.dateFrom ?? undefined,
      dateTo: f.dateTo ?? undefined,
      amountMin: f.amountMin ?? undefined,
      amountMax: f.amountMax ?? undefined,
    },
    limit,
    0,
  );
  return { table: parsed.table, interpreted: parsed, total, results: rows };
}

export async function healthScore(userId: string, orgId: string) {
  const cost = AI_CREDIT_COST.health_score;
  if (isGemmaAvailable()) await assertWithinQuota(userId, orgId, 'ai_credits', cost);
  const range = ytd();
  const kpis = await dashboardKpis(userId, orgId, range.from, range.to);
  const result = await computeHealthScore(kpis);
  if (isGemmaAvailable()) await incrementUsage(orgId, 'ai_credits', cost);
  return result;
}

/** 90-day cash forecast: linear trend over recent net cashflow (statistical). */
export async function forecast(userId: string, orgId: string) {
  const history = await cashflowByMonth(userId, orgId, 6);
  const nets = history.map((p) => Number(p.revenue) - Number(p.expenses));
  const avg = nets.length ? nets.reduce((a, b) => a + b, 0) / nets.length : 0;

  // Simple linear slope over the observed months.
  const n = nets.length;
  const slope =
    n > 1
      ? nets.reduce((acc, y, i) => acc + (i - (n - 1) / 2) * (y - avg), 0) /
        nets.reduce((acc, _y, i) => acc + (i - (n - 1) / 2) ** 2, 0)
      : 0;

  const projection = [1, 2, 3].map((m) => ({
    month: dayjs().add(m, 'month').format('YYYY-MM'),
    projectedNet: Math.round((avg + slope * (n - 1 + m)) * 100) / 100,
  }));

  return {
    basis: history,
    averageMonthlyNet: Math.round(avg * 100) / 100,
    trend: slope > 0 ? 'improving' : slope < 0 ? 'declining' : 'flat',
    projection,
    note: 'Statistical projection from the last 6 months. Not a guarantee.',
  };
}
