/** Zod request schemas (§9 validate, §11 "same schemas as backend"). */
import { z } from 'zod';
import { ROLES } from '../types/index.js';

export const uuid = z.string().uuid();
export const idParam = z.object({ id: uuid });

const email = z.string().email().max(320);
const money = z.coerce.number().finite().nonnegative();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

// ── Auth ─────────────────────────────────────────────────────────────────────
export const signupSchema = z.object({
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  fullName: z.string().trim().min(1).max(120).optional(),
});
export const loginSchema = z.object({ email, password: z.string().min(1).max(200) });
export const refreshSchema = z.object({ refreshToken: z.string().min(10) });

// ── Organizations ────────────────────────────────────────────────────────────
export const createOrgSchema = z.object({
  name: z.string().trim().min(2).max(120),
  currency: z.string().length(3).toUpperCase().default('USD'),
  country: z.string().length(2).toUpperCase().optional(),
});
export const updateOrgSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    logo_url: z.string().url().max(2048).optional(),
    currency: z.string().length(3).toUpperCase().optional(),
    fiscal_year_end: z.coerce.number().int().min(1).max(12).optional(),
    tax_id: z.string().max(64).optional(),
    country: z.string().length(2).toUpperCase().optional(),
    chart_of_accounts: z.array(z.string().min(1).max(80)).max(200).optional(),
  })
  .strict();
export const inviteSchema = z.object({ email, role: z.enum(ROLES) });
export const memberParam = z.object({ id: uuid, userId: uuid });

// ── API keys ─────────────────────────────────────────────────────────────────
export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
  role: z.enum(['admin', 'accountant', 'manager', 'employee']).default('accountant'),
  readOnly: z.boolean().default(false),
  expiresAt: isoDate.optional(),
});
export const apiKeyParam = z.object({ id: uuid, keyId: uuid });

// ── Expenses ─────────────────────────────────────────────────────────────────
export const createExpenseSchema = z.object({
  amount: money,
  currency: z.string().length(3).toUpperCase().default('USD'),
  category: z.string().min(1).max(80).optional(),
  vendor: z.string().max(160).optional(),
  description: z.string().max(1000).optional(),
  rawDescription: z.string().max(1000).optional(),
  expenseDate: isoDate.optional(),
  receiptUrl: z.string().url().max(2048).optional(),
  isBillable: z.boolean().optional(),
  isReimbursable: z.boolean().optional(),
  autoCategorize: z.boolean().optional(),
});
export const updateExpenseSchema = z
  .object({
    amount: money.optional(),
    category: z.string().min(1).max(80).optional(),
    vendor: z.string().max(160).optional(),
    description: z.string().max(1000).optional(),
    expense_date: isoDate.optional(),
    is_billable: z.boolean().optional(),
    is_reimbursable: z.boolean().optional(),
  })
  .strict();
export const approveSchema = z.object({ decision: z.enum(['approved', 'rejected']) });
export const listExpenseQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  category: z.string().max(80).optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  vendor: z.string().max(160).optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
});

// ── Invoices ─────────────────────────────────────────────────────────────────
export const lineItemSchema = z.object({
  description: z.string().min(1).max(300),
  quantity: z.coerce.number().finite().positive(),
  unitPrice: z.coerce.number().finite().nonnegative(),
});
export const createInvoiceSchema = z.object({
  clientName: z.string().min(1).max(200),
  clientEmail: email.optional(),
  lineItems: z.array(lineItemSchema).min(1).max(100),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  currency: z.string().length(3).toUpperCase().default('USD'),
  issueDate: isoDate.optional(),
  dueDate: isoDate.optional(),
  notes: z.string().max(2000).optional(),
});
export const updateInvoiceSchema = z
  .object({
    client_name: z.string().min(1).max(200).optional(),
    client_email: email.optional(),
    line_items: z.array(lineItemSchema).min(1).max(100).optional(),
    tax_rate: z.coerce.number().min(0).max(100).optional(),
    due_date: isoDate.optional(),
    notes: z.string().max(2000).optional(),
    status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']).optional(),
  })
  .strict();
export const listInvoiceQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']).optional(),
  client: z.string().max(200).optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
});

// ── Revenues ─────────────────────────────────────────────────────────────────
export const createRevenueSchema = z.object({
  amount: money,
  currency: z.string().length(3).toUpperCase().default('USD'),
  source: z.string().min(1).max(160),
  description: z.string().max(1000).optional(),
  invoiceId: uuid.optional(),
  revenueDate: isoDate.optional(),
});
export const updateRevenueSchema = z
  .object({
    amount: money.optional(),
    source: z.string().min(1).max(160).optional(),
    description: z.string().max(1000).optional(),
    revenue_date: isoDate.optional(),
  })
  .strict();
export const listRevenueQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  source: z.string().max(160).optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
});

// ── Reports ──────────────────────────────────────────────────────────────────
export const reportRangeQuery = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  months: z.coerce.number().int().min(1).max(36).optional(),
});

// ── AI ───────────────────────────────────────────────────────────────────────
export const categorizeSchema = z.object({ rawDescription: z.string().min(1).max(500) });
export const parseReceiptSchema = z.object({ rawText: z.string().min(1).max(8000) });
export const chatSchema = z.object({
  question: z.string().min(1).max(2000),
  conversationId: uuid.optional(),
});
export const nlSearchSchema = z.object({ query: z.string().min(1).max(500) });

// ── Billing ──────────────────────────────────────────────────────────────────
export const subscribeSchema = z.object({
  planCode: z.enum(['starter', 'growth', 'professional', 'enterprise']),
  interval: z.enum(['monthly', 'annual']).default('monthly'),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});
