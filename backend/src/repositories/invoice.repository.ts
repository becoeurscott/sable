import { asUser } from '../config/db.js';

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceRow {
  id: string;
  organization_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  line_items: LineItem[];
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  currency: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  pdf_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceFilter {
  status?: string;
  client?: string;
  dateFrom?: string;
  dateTo?: string;
}

function buildFilter(orgId: string, f: InvoiceFilter): { where: string; params: unknown[] } {
  const clauses = ['organization_id = $1'];
  const params: unknown[] = [orgId];
  const add = (sql: string, val: unknown) => {
    params.push(val);
    clauses.push(sql.replace('$?', `$${params.length}`));
  };
  if (f.status) add('status = $?', f.status);
  if (f.client) add('client_name ILIKE $?', `%${f.client}%`);
  if (f.dateFrom) add('issue_date >= $?', f.dateFrom);
  if (f.dateTo) add('issue_date <= $?', f.dateTo);
  return { where: clauses.join(' AND '), params };
}

export async function listInvoices(
  userId: string,
  orgId: string,
  filter: InvoiceFilter,
  limit: number,
  offset: number,
): Promise<{ rows: InvoiceRow[]; total: number }> {
  return asUser(userId, async (c) => {
    const { where, params } = buildFilter(orgId, filter);
    const rows = (
      await c.query<InvoiceRow>(
        `SELECT * FROM public.invoices WHERE ${where}
          ORDER BY issue_date DESC, created_at DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      )
    ).rows;
    const total = Number(
      (await c.query<{ count: string }>(`SELECT count(*) FROM public.invoices WHERE ${where}`, params))
        .rows[0]!.count,
    );
    return { rows, total };
  });
}

export async function getInvoice(userId: string, id: string): Promise<InvoiceRow | null> {
  return asUser(userId, async (c) => {
    const res = await c.query<InvoiceRow>(`SELECT * FROM public.invoices WHERE id = $1`, [id]);
    return res.rows[0] ?? null;
  });
}

/** Next sequential invoice number for the org, e.g. INV-0007. */
export async function nextInvoiceNumber(userId: string, orgId: string): Promise<string> {
  return asUser(userId, async (c) => {
    const res = await c.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM public.invoices WHERE organization_id = $1`,
      [orgId],
    );
    return `INV-${String((res.rows[0]!.n ?? 0) + 1).padStart(4, '0')}`;
  });
}

export async function createInvoice(
  userId: string,
  orgId: string,
  input: {
    invoiceNumber: string;
    clientName: string;
    clientEmail?: string;
    lineItems: LineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    currency: string;
    issueDate?: string;
    dueDate?: string;
    notes?: string;
  },
): Promise<InvoiceRow> {
  return asUser(userId, async (c) => {
    const res = await c.query<InvoiceRow>(
      `INSERT INTO public.invoices
        (organization_id, invoice_number, client_name, client_email, line_items,
         subtotal, tax_rate, tax_amount, total, currency, issue_date, due_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,COALESCE($11,CURRENT_DATE),$12,$13,$14)
       RETURNING *`,
      [
        orgId,
        input.invoiceNumber,
        input.clientName,
        input.clientEmail ?? null,
        JSON.stringify(input.lineItems),
        input.subtotal,
        input.taxRate,
        input.taxAmount,
        input.total,
        input.currency,
        input.issueDate ?? null,
        input.dueDate ?? null,
        input.notes ?? null,
        userId,
      ],
    );
    return res.rows[0]!;
  });
}

export async function updateInvoice(
  userId: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<InvoiceRow | null> {
  const fields = Object.keys(patch);
  if (fields.length === 0) return getInvoice(userId, id);
  const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const values = fields.map((f) => (f === 'line_items' ? JSON.stringify(patch[f]) : patch[f]));
  return asUser(userId, async (c) => {
    const res = await c.query<InvoiceRow>(
      `UPDATE public.invoices SET ${sets} WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    return res.rows[0] ?? null;
  });
}

export async function deleteInvoice(userId: string, id: string): Promise<number> {
  return asUser(userId, async (c) => {
    const res = await c.query(`DELETE FROM public.invoices WHERE id = $1`, [id]);
    return res.rowCount ?? 0;
  });
}
