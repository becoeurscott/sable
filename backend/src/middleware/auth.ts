/** JWT validation middleware (§9 middleware/auth.ts, §12). */
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifySupabaseToken } from '../utils/tokens.js';
import { authMode } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { forbidden, unauthorized } from '../utils/errors.js';
import { looksLikeApiKey, verify as verifyApiKey } from '../services/apiKey.service.js';

/**
 * Authenticates a request via EITHER an API key (`Authorization: Bearer sbl_…`
 * or `X-API-Key`) OR a user JWT (Supabase in supabase mode, else our own).
 * For API keys it also pins the org + role (see requireOrg) and enforces the
 * read-only flag.
 */
export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const apiKeyHeader = req.header('x-api-key');
  const header = req.header('authorization');
  const bearer = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : undefined;
  const presentedKey = apiKeyHeader ?? (bearer && looksLikeApiKey(bearer) ? bearer : undefined);

  // ── API key path ──
  if (presentedKey) {
    const key = await verifyApiKey(presentedKey);
    if (!key) throw unauthorized('Invalid or revoked API key');
    if (key.readOnly && req.method !== 'GET') {
      throw forbidden('This API key is read-only');
    }
    req.apiKey = key;
    req.user = { id: key.createdBy, email: `apikey:${key.id}` };
    return next();
  }

  // ── User JWT path ──
  if (!bearer) throw unauthorized('Missing bearer token');
  try {
    req.user = authMode === 'supabase' ? await verifySupabaseToken(bearer) : verifyAccessToken(bearer);
  } catch {
    throw unauthorized('Invalid or expired token');
  }
  next();
});
