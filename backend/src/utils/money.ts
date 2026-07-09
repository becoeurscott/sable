import type { LineItem } from '../repositories/invoice.repository.js';

/** Round to 2 decimals, avoiding binary float drift. */
export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export interface InvoiceTotals {
  subtotal: number;
  taxAmount: number;
  total: number;
}

/** Deterministic invoice math — never delegated to AI (§3). */
export function computeInvoiceTotals(lineItems: LineItem[], taxRate: number): InvoiceTotals {
  const subtotal = round2(
    lineItems.reduce((sum, li) => sum + (Number(li.quantity) || 0) * (Number(li.unitPrice) || 0), 0),
  );
  const taxAmount = round2(subtotal * (taxRate / 100));
  const total = round2(subtotal + taxAmount);
  return { subtotal, taxAmount, total };
}
