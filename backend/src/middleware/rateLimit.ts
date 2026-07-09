/**
 * Rate limiting (§9 middleware/rateLimit.ts, §12).
 * Keyed by authenticated user id when present, else client IP — plus the route,
 * so per-endpoint budgets from the §10 API table apply independently.
 * Memory store by default; swap in a Redis store for multi-node (§15).
 */
import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import type { Request } from 'express';
import { tooManyRequests } from '../utils/errors.js';

/** Build a limiter allowing `perMinute` requests per (user|ip, route) window. */
export function limit(perMinute: number): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 60_000,
    limit: perMinute,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const who = req.user?.id ?? req.ip ?? 'anon';
      return `${who}:${req.method}:${req.baseUrl}${req.route?.path ?? req.path}`;
    },
    handler: () => {
      throw tooManyRequests();
    },
  });
}
