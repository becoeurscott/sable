import type { Request, Response } from 'express';
import * as billing from '../services/billing.service.js';
import { logger } from '../config/logger.js';

/**
 * Stripe webhook receiver (§10 POST /webhooks/stripe, §12).
 * Verifies the signature against the raw body before trusting anything.
 * Mounted with express.raw() so req.body is a Buffer.
 */
export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.header('stripe-signature');
  if (!signature) {
    res.status(400).json({ error: { code: 'bad_request', message: 'Missing stripe-signature' } });
    return;
  }
  let event;
  try {
    event = billing.constructEvent(req.body as Buffer, signature);
  } catch (err) {
    logger.warn({ err }, 'Stripe signature verification failed');
    res.status(400).json({ error: { code: 'bad_request', message: 'Invalid signature' } });
    return;
  }
  try {
    await billing.handleEvent(event);
  } catch (err) {
    // Log but still 200 — we accepted the event; reprocessing is idempotent.
    logger.error({ err, type: event.type }, 'Error handling Stripe event');
  }
  res.json({ received: true });
}
