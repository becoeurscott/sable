import { describe, it, expect } from 'vitest';
import { sendEmail, invoiceEmailHtml } from '../src/services/email.service.js';

describe('email service', () => {
  it('no-ops (does not throw / does not send) when RESEND_API_KEY is unset', async () => {
    const res = await sendEmail({ to: 'a@b.co', subject: 'Hi', html: '<p>hi</p>' });
    expect(res.sent).toBe(false);
  });

  it('escapes HTML in the invoice email to prevent injection', () => {
    const html = invoiceEmailHtml({
      orgName: 'Acme <script>alert(1)</script>',
      invoiceNumber: 'INV-0001',
      clientName: 'Bob & Co',
      total: '100.00',
      currency: 'USD',
      dueDate: '2026-08-01',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Bob &amp; Co');
    expect(html).toContain('USD 100.00');
  });
});
