/** Invoice PDF generation (§9 utils/pdf.ts). Deterministic — no AI (§3). */
import PDFDocument from 'pdfkit';
import type { InvoiceRow } from '../repositories/invoice.repository.js';

export function renderInvoicePdf(inv: InvoiceRow, orgName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const money = (n: number | string) => `${inv.currency} ${Number(n).toFixed(2)}`;

    doc.fontSize(20).text(orgName, { continued: false });
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor('#4f46e5').text('INVOICE');
    doc.fillColor('#000');
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Invoice #: ${inv.invoice_number}`);
    doc.text(`Issue date: ${inv.issue_date}`);
    if (inv.due_date) doc.text(`Due date: ${inv.due_date}`);
    doc.text(`Status: ${inv.status.toUpperCase()}`);
    doc.moveDown();

    doc.text(`Bill to: ${inv.client_name}`);
    if (inv.client_email) doc.text(inv.client_email);
    doc.moveDown();

    // Line items
    doc.font('Helvetica-Bold');
    doc.text('Description', 50, doc.y, { continued: true, width: 260 });
    doc.text('Qty', 320, doc.y, { continued: true, width: 60 });
    doc.text('Unit', 380, doc.y, { continued: true, width: 80 });
    doc.text('Amount', 470, doc.y);
    doc.font('Helvetica');
    doc.moveDown(0.3);

    for (const li of inv.line_items) {
      const amount = (Number(li.quantity) || 0) * (Number(li.unitPrice) || 0);
      const y = doc.y;
      doc.text(li.description, 50, y, { continued: true, width: 260 });
      doc.text(String(li.quantity), 320, y, { continued: true, width: 60 });
      doc.text(money(li.unitPrice), 380, y, { continued: true, width: 80 });
      doc.text(money(amount), 470, y);
    }

    doc.moveDown();
    doc.text(`Subtotal: ${money(inv.subtotal)}`, { align: 'right' });
    doc.text(`Tax (${Number(inv.tax_rate).toFixed(2)}%): ${money(inv.tax_amount)}`, { align: 'right' });
    doc.font('Helvetica-Bold').text(`Total: ${money(inv.total)}`, { align: 'right' });
    doc.font('Helvetica');

    if (inv.notes) {
      doc.moveDown();
      doc.fontSize(9).fillColor('#555').text(inv.notes);
    }

    doc.end();
  });
}
