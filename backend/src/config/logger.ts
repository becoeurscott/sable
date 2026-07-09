/**
 * Structured logging (§9, §14) — Pino. Every request logs userId, orgId,
 * route, duration, status via pino-http (wired in app.ts).
 */
import { pino } from 'pino';
import { env, isProd } from './env.js';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  base: { service: 'financeai-api' },
  redact: {
    // Never log secrets or PII in the clear (§12).
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'password_hash',
      '*.password_hash',
      'token',
      '*.token',
    ],
    remove: true,
  },
  transport: isProd
    ? undefined
    : { target: 'pino/file', options: { destination: 1 } }, // stdout, dev-friendly
});

void env; // ensure env validated before logger use
