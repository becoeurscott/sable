/** Stripe SDK init (§9 config/stripe.ts). Null when unconfigured so the app
 *  still boots; billing endpoints then return 503 with a clear message. */
import Stripe from 'stripe';
import { env, stripeEnabled } from './env.js';

export const stripe: Stripe | null = stripeEnabled
  ? new Stripe(env.STRIPE_SECRET_KEY!) // use the account's default API version
  : null;

export function requireStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe is not configured (set STRIPE_SECRET_KEY)');
  }
  return stripe;
}
