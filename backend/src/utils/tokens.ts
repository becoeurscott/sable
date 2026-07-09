/** JWT + refresh-token helpers (§12 JWT auth: 1h access + rotating refresh). */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
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

// Supabase user access tokens are signed with the project's asymmetric JWT
// signing keys (ES256/RS256) and published at the JWKS endpoint. Newer projects
// use this; older ones sign with the HS256 shared secret. We support both.
const jwks = env.SUPABASE_URL
  ? createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
  : null;

function toUser(payload: JWTPayload): AuthUser {
  const meta = payload.user_metadata as { email?: string } | undefined;
  return { id: String(payload.sub), email: (payload.email as string) ?? meta?.email ?? '' };
}

/** Verify a Supabase Auth access token (async — may fetch/cache JWKS). */
export async function verifySupabaseToken(token: string): Promise<AuthUser> {
  const opts = { audience: 'authenticated' } as const;
  // Prefer asymmetric verification via JWKS (ES256/RS256).
  if (jwks) {
    try {
      const { payload } = await jwtVerify(token, jwks, opts);
      return toUser(payload);
    } catch (err) {
      if (!env.SUPABASE_JWT_SECRET) throw err;
      // fall through to legacy HS256
    }
  }
  // Legacy HS256 shared-secret verification.
  if (env.SUPABASE_JWT_SECRET) {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(env.SUPABASE_JWT_SECRET), opts);
    return toUser(payload);
  }
  throw new Error('No Supabase token verification method configured (set SUPABASE_URL)');
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
