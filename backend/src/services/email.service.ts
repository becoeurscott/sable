/**
 * Transactional email via Resend (§13, §14). No SDK — Resend has a simple REST
 * API, so we POST directly. Degrades gracefully: with no RESEND_API_KEY the send
 * is logged and skipped, so invoice flows still work locally.
 */
import { env, emailEnabled } from '../config/env.js';
import { logger } from '../config/logger.js';

export interface Attachment {
  filename: string;
  content: string; // base64
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}): Promise<{ sent: boolean; id?: string }> {
  if (!emailEnabled) {
    logger.info({ to: input.to, subject: input.subject }, 'Email disabled — set RESEND_API_KEY to send');
    return { sent: false };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        attachments: input.attachments,
      }),
    });
    if (!res.ok) {
      logger.error({ status: res.status, body: await res.text().catch(() => '') }, 'Resend send failed');
      return { sent: false };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { sent: true, id: data.id };
  } catch (err) {
    logger.error({ err }, 'Resend send threw');
    return { sent: false };
  }
}

/** Minimal, safe HTML for an invoice email (values escaped). */
export function invoiceEmailHtml(input: {
  orgName: string;
  invoiceNumber: string;
  clientName: string;
  total: string;
  currency: string;
  dueDate: string | null;
}): string {
  const e = escapeHtml;
  return `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0B1220">
    <h2 style="margin:0 0 8px">Invoice ${e(input.invoiceNumber)}</h2>
    <p style="color:#5A6472;margin:0 0 16px">From ${e(input.orgName)}</p>
    <p>Hi ${e(input.clientName)},</p>
    <p>Please find your invoice attached. Amount due: <b>${e(input.currency)} ${e(input.total)}</b>${
      input.dueDate ? `, due <b>${e(input.dueDate)}</b>` : ''
    }.</p>
    <p style="color:#8A93A3;font-size:13px;margin-top:24px">Sent via FinanceAI.</p>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
