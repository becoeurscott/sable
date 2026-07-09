/**
 * Feature A — Automated expense categorization (§4, §5 #1).
 * Gemma cleans messy bank descriptions into the org's chart-of-accounts
 * categories. Falls back to a keyword heuristic when Gemma is unavailable, so
 * the endpoint always returns something usable.
 */
import { generateJson, isGemmaAvailable } from './gemma.js';

export interface CategoryResult {
  category: string;
  cleanName: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'gemma' | 'heuristic';
}

const HEURISTICS: Array<[RegExp, string]> = [
  [/uber|lyft|taxi|delta|united air|airbnb|hotel|flight/i, 'Travel'],
  [/adobe|figma|notion|github|slack|zoom|aws|google.*cloud|openai|vercel/i, 'Software Subscriptions'],
  [/starbucks|coffee|restaurant|cafe|doordash|grubhub|mcdonald/i, 'Meals & Entertainment'],
  [/staples|office|paper|ink|amzn|amazon/i, 'Office Supplies'],
  [/facebook|meta|google ads|linkedin|twitter|x corp/i, 'Advertising'],
  [/comcast|verizon|at&t|internet|phone/i, 'Utilities'],
  [/payroll|gusto|adp|salary|wage/i, 'Payroll'],
];

function heuristic(raw: string, orgCategories: string[]): CategoryResult {
  for (const [re, cat] of HEURISTICS) {
    if (re.test(raw) && (orgCategories.length === 0 || orgCategories.includes(cat))) {
      return { category: cat, cleanName: titleCase(raw), confidence: 'medium', source: 'heuristic' };
    }
  }
  const fallback = orgCategories.includes('Uncategorized')
    ? 'Uncategorized'
    : orgCategories[0] ?? 'Uncategorized';
  return { category: fallback, cleanName: titleCase(raw), confidence: 'low', source: 'heuristic' };
}

function titleCase(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export async function categorizeTransaction(
  rawDescription: string,
  orgCategories: string[],
  recentExamples: Array<{ description: string; category: string }> = [],
): Promise<CategoryResult> {
  if (!isGemmaAvailable()) return heuristic(rawDescription, orgCategories);

  const examples = recentExamples
    .slice(0, 5)
    .map((e) => `"${e.description}" -> ${e.category}`)
    .join('\n');

  const prompt = `You are an accounting assistant. Categorize this bank transaction.
ORGANIZATION CATEGORIES: ${orgCategories.join(', ') || '(none provided — infer a sensible category)'}
RECENT EXAMPLES FROM THIS ORG:
${examples || '(none)'}
TRANSACTION TO CATEGORIZE: "${rawDescription}"

Respond in JSON only:
{"category":"","cleanName":"","confidence":"high|medium|low"}`;

  try {
    const out = await generateJson<Omit<CategoryResult, 'source'>>(prompt);
    return { ...out, source: 'gemma' };
  } catch {
    // Never fail the request on a model hiccup — degrade to heuristic.
    return heuristic(rawDescription, orgCategories);
  }
}
