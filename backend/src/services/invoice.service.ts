/** Invoice business logic (§10 /invoices/*). */
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  nextInvoiceNumber,
  type InvoiceFilter,
  type LineItem,
} from '../repositories/invoice.repository.js';
import { incrementUsage } from '../repositories/usage.repository.js';
import { writeAudit } from '../repositories/audit.repository.js';
import { getOrganization } from '../repositories/organization.repository.js';
import { assertWithinQuota } from './quota.service.js';
import { sendEmail, invoiceEmailHtml } from './email.service.js';
import { computeInvoiceTotals } from '../utils/money.js';
import { renderInvoicePdf } from '../utils/pdf.js';
import { badRequest, notFound } from '../utils/errors.js';

export async function list(
  userId: string,
  orgId: string,
  filter: InvoiceFilter,
  limit: number,
  offset: number,
) {
  return listInvoices(userId, orgId, filter, limit, offset);
}

export async function getOne(userId: string, id: string) {
  const inv = await getInvoice(userId, id);
  if (!inv) throw notFound('Invoice not found');
  return inv;
}

export async function create(input: {
  userId: string;
  orgId: string;
  clientName: string;
  clientEmail?: string;
  lineItems: LineItem[];
  taxRate?: number;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  ip?: string;
}) {
  if (input.lineItems.length === 0) throw badRequest('An invoice needs at least one line item');
  await assertWithinQuota(input.userId, input.orgId, 'invoices');

  const taxRate = input.taxRate ?? 0;
  const totals = computeInvoiceTotals(input.lineItems, taxRate);
  const invoiceNumber = await nextInvoiceNumber(input.userId, input.orgId);

  const invoice = await createInvoice(input.userId, input.orgId, {
    invoiceNumber,
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    lineItems: input.lineItems,
    subtotal: totals.subtotal,
    taxRate,
    taxAmount: totals.taxAmount,
    total: totals.total,
    currency: input.currency ?? 'USD',
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    notes: input.notes,
  });

  await incrementUsage(input.orgId, 'invoices', 1);
  await writeAudit({
    orgId: input.orgId,
    actorId: input.userId,
    action: 'invoice.create',
    resourceType: 'invoice',
    resourceId: invoice.id,
    metadata: { number: invoiceNumber, total: totals.total },
    ip: input.ip,
  });
  return invoice;
}

export async function update(userId: string, id: string, patch: Record<string, unknown>, ip?: string) {
  // Recompute totals if line items or tax changed.
  if (patch.line_items || patch.tax_rate != null) {
    const current = await getInvoice(userId, id);
    if (!current) throw notFound('Invoice not found');
    const lineItems = (patch.line_items as LineItem[] | undefined) ?? current.line_items;
    const taxRate = (patch.tax_rate as number | undefined) ?? Number(current.tax_rate);
    const totals = computeInvoiceTotals(lineItems, taxRate);
    patch.subtotal = totals.subtotal;
    patch.tax_amount = totals.taxAmount;
    patch.total = totals.total;
    patch.tax_rate = taxRate;
  }
  const updated = await updateInvoice(userId, id, patch);
  if (!updated) throw notFound('Invoice not found');
  await writeAudit({
    orgId: updated.organization_id,
    actorId: userId,
    action: 'invoice.update',
    resourceType: 'invoice',
    resourceId: id,
    ip,
  });
  return updated;
}

export async function send(userId: string, id: string, ip?: string) {
  const inv = await getInvoice(userId, id);
  if (!inv) throw notFound('Invoice not found');
  if (inv.status === 'paid') throw badRequest('Invoice is already paid');

  const updated = await updateInvoice(userId, id, { status: 'sent' });

  // Email the client with the PDF attached (no-op if Resend unconfigured).
  let emailed = false;
  if (inv.client_email) {
    const org = await getOrganization(userId, inv.organization_id);
    const orgName = org?.name ?? 'FinanceAI';
    const pdf = await renderInvoicePdf(updated!, orgName);
    const result = await sendEmail({
      to: inv.client_email,
      subject: `Invoice ${inv.invoice_number} from ${orgName}`,
      html: invoiceEmailHtml({
        orgName,
        invoiceNumber: inv.invoice_number,
        clientName: inv.client_name,
        total: Number(inv.total).toFixed(2),
        currency: inv.currency,
        dueDate: inv.due_date,
      }),
      attachments: [{ filename: `${inv.invoice_number}.pdf`, content: pdf.toString('base64') }],
    });
    emailed = result.sent;
  }

  await writeAudit({
    orgId: inv.organization_id,
    actorId: userId,
    action: 'invoice.send',
    resourceType: 'invoice',
    resourceId: id,
    metadata: { to: inv.client_email, emailed },
    ip,
  });
  return updated!;
}

export async function markPaid(userId: string, id: string, ip?: string) {
  const inv = await getInvoice(userId, id);
  if (!inv) throw notFound('Invoice not found');
  const updated = await updateInvoice(userId, id, { status: 'paid', paid_at: new Date() });
  await writeAudit({
    orgId: inv.organization_id,
    actorId: userId,
    action: 'invoice.mark_paid',
    resourceType: 'invoice',
    resourceId: id,
    ip,
  });
  return updated!;
}

export async function pdf(userId: string, id: string, orgName: string): Promise<Buffer> {
  const inv = await getInvoice(userId, id);
  if (!inv) throw notFound('Invoice not found');
  return renderInvoicePdf(inv, orgName);
}

export async function remove(userId: string, orgId: string, id: string, ip?: string) {
  const deleted = await deleteInvoice(userId, id);
  if (!deleted) throw notFound('Invoice not found');
  await writeAudit({ orgId, actorId: userId, action: 'invoice.delete', resourceType: 'invoice', resourceId: id, ip });
}
