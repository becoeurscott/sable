/** API-key business logic (§2 API Access). */
import crypto from 'node:crypto';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  findByHash,
  touchLastUsed,
  type ApiKeyRow,
} from '../repositories/apiKey.repository.js';
import { hashToken } from '../utils/tokens.js';
import { writeAudit } from '../repositories/audit.repository.js';
import { notFound } from '../utils/errors.js';
import type { Role } from '../types/index.js';

const KEY_PREFIX = 'sbl_';

/** Generate a new key, store its hash, and return the plaintext ONCE. */
export async function create(input: {
  actorId: string;
  orgId: string;
  name: string;
  role: Role;
  readOnly: boolean;
  expiresAt?: string;
  ip?: string;
}) {
  const secret = crypto.randomBytes(24).toString('hex'); // 48 hex chars
  const fullKey = `${KEY_PREFIX}${secret}`;
  const prefix = fullKey.slice(0, 12); // e.g. sbl_a1b2c3d4 — safe to display
  const keyHash = hashToken(fullKey);

  const row = await createApiKey(input.actorId, input.orgId, {
    name: input.name,
    prefix,
    keyHash,
    role: input.role,
    readOnly: input.readOnly,
    expiresAt: input.expiresAt,
  });

  await writeAudit({
    orgId: input.orgId,
    actorId: input.actorId,
    action: 'api_key.create',
    resourceType: 'api_key',
    resourceId: row.id,
    metadata: { name: input.name, role: input.role, readOnly: input.readOnly },
    ip: input.ip,
  });

  // fullKey is returned here and never stored or shown again.
  return { key: fullKey, apiKey: publicView(row) };
}

export async function list(actorId: string, orgId: string) {
  return (await listApiKeys(actorId, orgId)).map(publicView);
}

export async function revoke(actorId: string, orgId: string, id: string, ip?: string) {
  const n = await revokeApiKey(actorId, orgId, id);
  if (!n) throw notFound('API key not found or already revoked');
  await writeAudit({ orgId, actorId, action: 'api_key.revoke', resourceType: 'api_key', resourceId: id, ip });
}

export interface VerifiedKey {
  id: string;
  orgId: string;
  role: Role;
  readOnly: boolean;
  createdBy: string;
}

/** Verify a presented key string. Returns null when absent/invalid/revoked/expired. */
export async function verify(presented: string): Promise<VerifiedKey | null> {
  if (!presented.startsWith(KEY_PREFIX)) return null;
  const row = await findByHash(hashToken(presented));
  if (!row) return null;
  if (row.revoked_at) return null;
  if (row.expires_at && new Date(row.expires_at) < new Date()) return null;
  if (!row.created_by) return null; // must map to a member for RLS

  void touchLastUsed(row.id); // fire-and-forget
  return {
    id: row.id,
    orgId: row.organization_id,
    role: row.role,
    readOnly: row.read_only,
    createdBy: row.created_by,
  };
}

export const looksLikeApiKey = (token: string): boolean => token.startsWith(KEY_PREFIX);

function publicView(row: Omit<ApiKeyRow, 'key_hash'>) {
  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    role: row.role,
    readOnly: row.read_only,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}
