/** JWT validation middleware (§9 middleware/auth.ts, §12). */
import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken, verifySupabaseToken } from '../utils/tokens.js';
import { authMode } from '../config/env.js';
import { unauthorized } from '../utils/errors.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    throw unauthorized('Missing bearer token');
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    // In supabase mode the client sends a Supabase Auth JWT; otherwise our own.
    req.user = authMode === 'supabase' ? verifySupabaseToken(token) : verifyAccessToken(token);
    next();
  } catch {
    throw unauthorized('Invalid or expired token');
  }
}
