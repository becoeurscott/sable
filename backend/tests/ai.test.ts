import { describe, it, expect } from 'vitest';
import { categorizeTransaction } from '../src/ai/categorizer.js';
import { computeHealthScore } from '../src/ai/healthScore.js';
import { parseReceiptText } from '../src/ai/ocrParser.js';
import type { DashboardKpis } from '../src/repositories/report.repository.js';

describe('categorizer heuristic fallback (no GEMMA_API_KEY)', () => {
  it('maps known merchants to categories', async () => {
    const cats = ['Software Subscriptions', 'Travel', 'Uncategorized'];
    const adobe = await categorizeTransaction('ADOBE *SYSTEMS INC', cats);
    expect(adobe.category).toBe('Software Subscriptions');
    expect(adobe.source).toBe('heuristic');

    const uber = await categorizeTransaction('UBER *TRIP 8Q2K', cats);
    expect(uber.category).toBe('Travel');
  });

  it('falls back to Uncategorized for unknown merchants', async () => {
    const res = await categorizeTransaction('ZZZ UNKNOWN MERCHANT 999', ['Uncategorized']);
    expect(res.category).toBe('Uncategorized');
    expect(res.confidence).toBe('low');
  });
});

describe('health score', () => {
  it('rewards profitability and penalizes overdue invoices', async () => {
    const healthy: DashboardKpis = {
      total_revenue: '10000',
      total_expenses: '6000',
      net_profit: 4000,
      outstanding: '0',
      invoice_count: 5,
      expense_count: 12,
      overdue_count: 0,
    };
    const strained: DashboardKpis = {
      total_revenue: '3000',
      total_expenses: '5000',
      net_profit: -2000,
      outstanding: '4000',
      invoice_count: 3,
      expense_count: 20,
      overdue_count: 4,
    };
    const a = await computeHealthScore(healthy);
    const b = await computeHealthScore(strained);
    expect(a.score).toBeGreaterThan(b.score);
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
  });
});

describe('receipt OCR heuristic parser (no GEMMA_API_KEY)', () => {
  it('extracts vendor, total, tax and date from raw OCR text', async () => {
    const raw = [
      'THE COFFEE BEAN',
      '123 Market St',
      '07/02/2026',
      'Latte        4.50',
      'SUBTOTAL     16.80',
      'TAX           1.60',
      'TOTAL        18.40',
    ].join('\n');
    const r = await parseReceiptText(raw);
    expect(r.source).toBe('heuristic');
    expect(r.total).toBe(18.4);
    expect(r.taxAmount).toBe(1.6);
    expect(r.subtotal).toBe(16.8);
    expect(r.date).toBe('2026-07-02');
    expect(r.vendor).toBe('THE COFFEE BEAN');
    expect(r.receiptType).toBe('restaurant');
  });

  it('falls back to the largest amount when no TOTAL label exists', async () => {
    const r = await parseReceiptText('SHOP\n9.99\n42.00\n3.50');
    expect(r.total).toBe(42);
  });
});
