/**
 * AI credit costs per operation (§2 AI Credits, §5 credit-exhaustion upsell).
 * One AI "call" deducts these credits from the org's monthly plan allowance.
 * Tune freely — heavier operations (chat, summaries) cost more than a single
 * categorization. Credits are charged ONLY when the real model runs; the
 * heuristic fallback (no AI key) is free.
 */
export type AiOp =
  | 'categorize'
  | 'nl_search'
  | 'parse_receipt'
  | 'health_score'
  | 'chat'
  | 'cfo_summary';

export const AI_CREDIT_COST: Record<AiOp, number> = {
  categorize: 1,
  nl_search: 1,
  parse_receipt: 2,
  health_score: 2,
  chat: 3,
  cfo_summary: 5,
};
