import { asUser, query } from '../config/db.js';
import type { Role } from '../types/index.js';

export interface ApiKeyRow {
  id: string;
  organization_id: string;
  name: string;
  prefix: string;
  role: Role;
  read_only: boolean;
  created_by: string | null;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

/** Service-context lookup for authentication (runs before any tenant context). */
export async function findByHash(keyHash: string): Promise<ApiKeyRow | null> {
  const rows = await query<ApiKeyRow>(
    `SELECT * FROM public.api_keys WHERE key_hash = $1`,
    [keyHash],
  );
  return rows[0] ?? null;
}

export async function touchLastUsed(id: string): Promise<void> {
  await query(`UPDATE public.api_keys SET last_used_at = now() WHERE id = $1`, [id]);
}

/** Create a key (tenant context → RLS enforces admin+). Stores only the hash. */
export async function createApiKey(
  actorId: string,
  orgId: string,
  input: { name: string; prefix: string; keyHash: string; role: Role; readOnly: boolean; expiresAt?: string },
): Promise<ApiKeyRow> {
  return asUser(actorId, async (c) => {
    const res = await c.query<ApiKeyRow>(
      `INSERT INTO public.api_keys
         (organization_id, name, prefix, key_hash, role, read_only, created_by, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [orgId, input.name, input.prefix, input.keyHash, input.role, input.readOnly, actorId, input.expiresAt ?? null],
    );
    return res.rows[0]!;
  });
}

/** List keys (metadata only — never the hash). */
export async function listApiKeys(actorId: string, orgId: string): Promise<Omit<ApiKeyRow, 'key_hash'>[]> {
  return asUser(actorId, async (c) => {
    const res = await c.query<Omit<ApiKeyRow, 'key_hash'>>(
      `SELECT id, organization_id, name, prefix, role, read_only, created_by,
              last_used_at, expires_at, revoked_at, created_at
         FROM public.api_keys WHERE organization_id = $1
        ORDER BY created_at DESC`,
      [orgId],
    );
    return res.rows;
  });
}

export async function revokeApiKey(actorId: string, orgId: string, id: string): Promise<number> {
  return asUser(actorId, async (c) => {
    const res = await c.query(
      `UPDATE public.api_keys SET revoked_at = now()
        WHERE id = $1 AND organization_id = $2 AND revoked_at IS NULL`,
      [id, orgId],
    );
    return res.rowCount ?? 0;
  });
}
