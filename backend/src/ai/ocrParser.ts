/**
 * Feature C — Receipt OCR post-processing (§4, §5 #3).
 * The client runs OCR (Tesseract) in the browser and sends the raw text here.
 * Gemma structures it into clean expense fields; when Gemma is unavailable a
 * deterministic regex parser fills in the same shape. Gemma NEVER auto-submits —
 * the frontend pre-fills the form and the user confirms (§4).
 */
import { generateJson, isGemmaAvailable } from './gemma.js';

export interface ReceiptData {
  vendor: string | null;
  date: string | null; // YYYY-MM-DD
  subtotal: number | null;
  taxAmount: number | null;
  total: number | null;
  currency: string;
  receiptType: 'restaurant' | 'travel' | 'software' | 'office' | 'other';
  lineItems: Array<{ description: string; amount: number }>;
  source: 'gemma' | 'heuristic';
}

const AMOUNT = /(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})|\d+\.\d{2})/;

function toNumber(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s.replace(/[,\s]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Find the amount on the first line matching any of the given labels. */
function amountForLabel(lines: string[], labels: RegExp): number | null {
  for (const line of lines) {
    if (labels.test(line)) {
      const m = line.match(AMOUNT);
      if (m) return toNumber(m[1]);
    }
  }
  return null;
}

function heuristic(rawText: string): ReceiptData {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const total =
    amountForLabel(lines, /\b(total|amount due|balance due|grand total)\b/i) ??
    // else the largest amount on the receipt
    lines
      .flatMap((l) => Array.from(l.matchAll(new RegExp(AMOUNT, 'g'))).map((m) => toNumber(m[1])))
      .filter((n): n is number => n != null)
      .sort((a, b) => b - a)[0] ??
    null;

  const taxAmount = amountForLabel(lines, /\b(tax|vat|gst|hst)\b/i);
  const subtotal = amountForLabel(lines, /\b(sub[\s-]?total)\b/i);

  const dateMatch = rawText.match(
    /(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{2,4})|(\d{1,2}[-.]\d{1,2}[-.]\d{2,4})/,
  );
  const date = dateMatch ? normalizeDate(dateMatch[0]) : null;

  // Vendor: first line that is mostly letters (skip pure amounts / addresses).
  const vendor =
    lines.find((l) => /[a-z]/i.test(l) && !AMOUNT.test(l) && l.length > 2 && l.length < 40) ?? null;

  const lower = rawText.toLowerCase();
  const receiptType: ReceiptData['receiptType'] = /restaurant|cafe|coffee|grill|bar\b/.test(lower)
    ? 'restaurant'
    : /hotel|flight|uber|lyft|taxi|airline/.test(lower)
      ? 'travel'
      : /software|subscription|saas|license/.test(lower)
        ? 'software'
        : /office|supplies|staples/.test(lower)
          ? 'office'
          : 'other';

  const currency = /€/.test(rawText) ? 'EUR' : /£/.test(rawText) ? 'GBP' : 'USD';

  return { vendor, date, subtotal, taxAmount, total, currency, receiptType, lineItems: [], source: 'heuristic' };
}

function normalizeDate(s: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parts = s.split(/[/.-]/).map((p) => p.trim());
  if (parts.length !== 3) return null;
  let [a, b, c] = parts;
  if (c!.length === 2) c = `20${c}`;
  // Assume MM/DD/YYYY (US receipts); clamp to valid ranges.
  const mm = String(Math.min(12, Math.max(1, Number(a)))).padStart(2, '0');
  const dd = String(Math.min(31, Math.max(1, Number(b)))).padStart(2, '0');
  return `${c}-${mm}-${dd}`;
}

export async function parseReceiptText(rawText: string): Promise<ReceiptData> {
  if (!isGemmaAvailable()) return heuristic(rawText);

  const prompt = `Extract structured data from this receipt OCR text.
RAW TEXT:
${rawText.slice(0, 4000)}

Return ONLY valid JSON:
{"vendor":"string or null","date":"YYYY-MM-DD or null","subtotal":number or null,"taxAmount":number or null,"total":number,"currency":"USD","lineItems":[{"description":"string","amount":number}],"receiptType":"restaurant|travel|software|office|other"}`;

  try {
    const out = await generateJson<Omit<ReceiptData, 'source'>>(prompt);
    return { ...out, source: 'gemma' };
  } catch {
    return heuristic(rawText);
  }
}
