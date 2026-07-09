import { describe, it, expect } from 'vitest';
import { computeInvoiceTotals, round2 } from '../src/utils/money.js';

describe('money', () => {
  it('rounds to 2 decimals without float drift', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(1.005)).toBe(1.01); // epsilon nudge gives half-up rounding
    expect(round2(2.5)).toBe(2.5);
  });

  it('computes invoice totals deterministically', () => {
    const totals = computeInvoiceTotals(
      [
        { description: 'Design', quantity: 2, unitPrice: 100 },
        { description: 'Hosting', quantity: 1, unitPrice: 49.5 },
      ],
      10, // 10% tax
    );
    expect(totals.subtotal).toBe(249.5);
    expect(totals.taxAmount).toBe(24.95);
    expect(totals.total).toBe(274.45);
  });

  it('handles empty line items', () => {
    expect(computeInvoiceTotals([], 20)).toEqual({ subtotal: 0, taxAmount: 0, total: 0 });
  });
});
