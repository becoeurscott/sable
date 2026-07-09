/** JWT validation middleware (§9 middleware/auth.ts, §12). */
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifySupabaseToken } from '../utils/tokens.js';
import { authMode } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { unauthorized } from '../utils/errors.js';

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) throw unauthorized('Missing bearer token');
  const token = header.slice('Bearer '.length).trim();
  try {
    // In supabase mode the client sends a Supabase Auth JWT (verified via JWKS);
    // otherwise our own HS256 token.
    req.user = authMode === 'supabase' ? await verifySupabaseToken(token) : verifyAccessToken(token);
  } catch {
    throw unauthorized('Invalid or expired token');
  }
  next();
});
