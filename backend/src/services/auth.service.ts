/** Authentication business logic (§10 /auth/*, §12). */
import {
  createUser,
  findUserByEmail,
  findUserById,
  upsertProfile,
  storeRefreshToken,
  findRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from '../repositories/user.repository.js';
import { authMode } from '../config/env.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
} from '../utils/tokens.js';
import { writeAudit } from '../repositories/audit.repository.js';
import { env } from '../config/env.js';
import { badRequest, conflict, unauthorized } from '../utils/errors.js';
import type { AuthUser } from '../types/index.js';

export interface AuthResult {
  user: { id: string; email: string; full_name: string | null };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

async function issueSession(user: AuthUser & { full_name?: string | null }): Promise<AuthResult> {
  const accessToken = signAccessToken(user);
  const { token, hash } = generateRefreshToken();
  await storeRefreshToken(user.id, hash, new Date(Date.now() + env.JWT_REFRESH_TTL * 1000));
  return {
    user: { id: user.id, email: user.email, full_name: user.full_name ?? null },
    accessToken,
    refreshToken: token,
    expiresIn: env.JWT_ACCESS_TTL,
  };
}

const SUPABASE_HANDLES_AUTH = 'Authentication is handled by Supabase in this deployment';

export async function signup(input: {
  email: string;
  password: string;
  fullName?: string;
  ip?: string;
}): Promise<AuthResult> {
  if (authMode === 'supabase') throw badRequest(SUPABASE_HANDLES_AUTH);
  const existing = await findUserByEmail(input.email);
  if (existing) throw conflict('An account with that email already exists');

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    email: input.email,
    passwordHash,
    fullName: input.fullName,
  });
  await writeAudit({ actorId: user.id, action: 'auth.signup', ip: input.ip, metadata: { email: user.email } });
  return issueSession(user);
}

export async function login(input: {
  email: string;
  password: string;
  ip?: string;
}): Promise<AuthResult> {
  if (authMode === 'supabase') throw badRequest(SUPABASE_HANDLES_AUTH);
  const user = await findUserByEmail(input.email);
  // Constant-ish response: run a hash compare even on missing user to blunt timing.
  const ok = user?.password_hash
    ? await verifyPassword(input.password, user.password_hash)
    : await verifyPassword(input.password, '$2a$12$'.padEnd(60, '.'));
  if (!user || !ok) throw unauthorized('Invalid email or password');

  await writeAudit({ actorId: user.id, action: 'auth.login', ip: input.ip });
  return issueSession(user);
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
  if (authMode === 'supabase') throw badRequest(SUPABASE_HANDLES_AUTH);
  const hash = hashToken(refreshToken);
  const record = await findRefreshToken(hash);
  if (!record || record.revoked_at || new Date(record.expires_at) < new Date()) {
    throw unauthorized('Invalid or expired refresh token');
  }
  const user = await findUserById(record.user_id);
  if (!user) throw unauthorized('User no longer exists');

  // Rotate: revoke old, issue new (refresh-token reuse detection foundation).
  const accessToken = signAccessToken({ id: user.id, email: user.email });
  const { token, hash: newHash } = generateRefreshToken();
  await rotateRefreshToken(hash, user.id, newHash, new Date(Date.now() + env.JWT_REFRESH_TTL * 1000));

  return {
    user: { id: user.id, email: user.email, full_name: user.full_name },
    accessToken,
    refreshToken: token,
    expiresIn: env.JWT_ACCESS_TTL,
  };
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;
  await revokeRefreshToken(hashToken(refreshToken));
}

export async function me(user: AuthUser) {
  // In Supabase mode the profile row may not exist yet (first login) — create it
  // so downstream FKs (memberships, created_by) always resolve.
  if (authMode === 'supabase') return upsertProfile(user.id, user.email);
  const found = await findUserById(user.id);
  if (!found) throw badRequest('User not found');
  return found;
}
