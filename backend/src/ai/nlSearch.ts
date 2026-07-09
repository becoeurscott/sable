/**
 * Feature B — Natural-language data retrieval (§4, §5 #2).
 * Gemma converts a plain-English query into a *structured JSON filter*, never
 * raw SQL. The backend then builds a parameterized query from the whitelisted
 * fields, so there is no injection surface (§12).
 */
import { generateJson, isGemmaAvailable } from './gemma.js';

export type NlTable = 'expenses' | 'invoices' | 'revenues';

export interface NlQuery {
  table: NlTable;
  filters: {
    dateFrom: string | null;
    dateTo: string | null;
    amountMin: number | null;
    amountMax: number | null;
    category: string | null;
    status: string | null;
  };
  orderBy: string | null;
  limit: number;
}

const TABLES: NlTable[] = ['expenses', 'invoices', 'revenues'];

function heuristic(query: string): NlQuery {
  const q = query.toLowerCase();
  const table: NlTable = /invoice/.test(q)
    ? 'invoices'
    : /revenue|income|sales|earned/.test(q)
      ? 'revenues'
      : 'expenses';
  return {
    table,
    filters: { dateFrom: null, dateTo: null, amountMin: null, amountMax: null, category: null, status: null },
    orderBy: null,
    limit: 50,
  };
}

export async function parseNlQuery(userQuery: string): Promise<NlQuery> {
  if (!isGemmaAvailable()) return heuristic(userQuery);

  const prompt = `You convert accounting queries into JSON filter objects.
SCHEMA:
  expenses(amount, category, vendor, expense_date, status)
  invoices(total, client_name, status, due_date, paid_at)
  revenues(amount, source, revenue_date)
USER QUERY: "${userQuery}"

Return ONLY valid JSON (no prose):
{"table":"expenses|invoices|revenues","filters":{"dateFrom":"YYYY-MM-DD or null","dateTo":"YYYY-MM-DD or null","amountMin":null,"amountMax":null,"category":null,"status":null},"orderBy":null,"limit":50}`;

  try {
    const out = await generateJson<NlQuery>(prompt);
    // Validate the table against the whitelist — defense in depth.
    if (!TABLES.includes(out.table)) out.table = 'expenses';
    out.limit = Math.min(Math.max(1, Number(out.limit) || 50), 200);
    return out;
  } catch {
    return heuristic(userQuery);
  }
}
