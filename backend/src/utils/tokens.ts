/** JWT + refresh-token helpers (§12 JWT auth: 1h access + rotating refresh). */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthUser } from '../types/index.js';

interface AccessClaims {
  sub: string;
  email: string;
}

export function signAccessToken(user: AuthUser): string {
  const payload: AccessClaims = { sub: user.id, email: user.email };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as AccessClaims;
  return { id: decoded.sub, email: decoded.email };
}

interface SupabaseClaims {
  sub: string;
  email?: string;
  user_metadata?: { email?: string };
}

/** Verify a Supabase Auth access token (HS256, signed with the project JWT secret). */
export function verifySupabaseToken(token: string): AuthUser {
  if (!env.SUPABASE_JWT_SECRET) throw new Error('SUPABASE_JWT_SECRET not set');
  const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET, {
    algorithms: ['HS256'],
    audience: 'authenticated',
  }) as SupabaseClaims;
  return { id: decoded.sub, email: decoded.email ?? decoded.user_metadata?.email ?? '' };
}

/** Opaque refresh token: random secret returned to client, only its hash stored. */
export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(48).toString('base64url');
  const hash = hashToken(token);
  return { token, hash };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
