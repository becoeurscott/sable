/** User + refresh-token persistence (service context — pre-tenant/auth flows). */
import { query, serviceTxn } from '../config/db.js';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  language: string;
  created_at: string;
}

const PUBLIC_COLS = 'id, email, full_name, avatar_url, timezone, language, created_at';

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await query<UserRow>(
    `SELECT id, email, password_hash, full_name, avatar_url, timezone, language, created_at
       FROM public.users WHERE lower(email) = lower($1)`,
    [email],
  );
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<Omit<UserRow, 'password_hash'> | null> {
  const rows = await query<Omit<UserRow, 'password_hash'>>(
    `SELECT ${PUBLIC_COLS} FROM public.users WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

/**
 * Ensure a profile row exists for an externally-authenticated user (Supabase
 * Auth). Idempotent — used on /auth/me so downstream FKs (memberships, created_by)
 * always resolve, even if the auth.users→public.users trigger hasn't fired.
 */
export async function upsertProfile(
  id: string,
  email: string,
  fullName?: string,
): Promise<Omit<UserRow, 'password_hash'>> {
  const rows = await query<Omit<UserRow, 'password_hash'>>(
    `INSERT INTO public.users (id, email, full_name)
     VALUES ($1, lower($2), $3)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
     RETURNING ${PUBLIC_COLS}`,
    [id, email, fullName ?? null],
  );
  return rows[0]!;
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  fullName?: string;
}): Promise<Omit<UserRow, 'password_hash'>> {
  const rows = await query<Omit<UserRow, 'password_hash'>>(
    `INSERT INTO public.users (email, password_hash, full_name)
     VALUES (lower($1), $2, $3)
     RETURNING ${PUBLIC_COLS}`,
    [input.email, input.passwordHash, input.fullName ?? null],
  );
  return rows[0]!;
}

// ── Refresh tokens (rotating) ────────────────────────────────────────────────
export async function storeRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await query(
    `INSERT INTO public.refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  );
}

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  expires_at: string;
  revoked_at: string | null;
}

export async function findRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
  const rows = await query<RefreshTokenRow>(
    `SELECT id, user_id, expires_at, revoked_at
       FROM public.refresh_tokens WHERE token_hash = $1`,
    [tokenHash],
  );
  return rows[0] ?? null;
}

/** Atomically revoke the old token and issue the rotated one. */
export async function rotateRefreshToken(
  oldHash: string,
  userId: string,
  newHash: string,
  expiresAt: Date,
): Promise<void> {
  await serviceTxn(async (c) => {
    await c.query(`UPDATE public.refresh_tokens SET revoked_at = now() WHERE token_hash = $1`, [
      oldHash,
    ]);
    await c.query(
      `INSERT INTO public.refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, newHash, expiresAt],
    );
  });
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await query(`UPDATE public.refresh_tokens SET revoked_at = now() WHERE token_hash = $1`, [
    tokenHash,
  ]);
}
