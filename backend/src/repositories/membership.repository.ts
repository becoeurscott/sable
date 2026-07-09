import type { PoolClient } from 'pg';
import { query, asUser } from '../config/db.js';
import type { Role } from '../types/index.js';

export interface Membership {
  id: string;
  organization_id: string;
  user_id: string;
  role: Role;
  joined_at: string;
}

export interface MemberRow extends Membership {
  email: string;
  full_name: string | null;
}

/**
 * Service-context membership lookup — used by the org-context middleware BEFORE
 * a tenant context exists. Reads only the (org,user) row, never cross-tenant.
 */
export async function getMembership(orgId: string, userId: string): Promise<Membership | null> {
  const rows = await query<Membership>(
    `SELECT id, organization_id, user_id, role, joined_at
       FROM public.memberships
      WHERE organization_id = $1 AND user_id = $2`,
    [orgId, userId],
  );
  return rows[0] ?? null;
}

export async function listMembers(userId: string, orgId: string): Promise<MemberRow[]> {
  return asUser(userId, async (c: PoolClient) => {
    const res = await c.query<MemberRow>(
      `SELECT m.id, m.organization_id, m.user_id, m.role, m.joined_at,
              u.email, u.full_name
         FROM public.memberships m
         JOIN public.users u ON u.id = m.user_id
        WHERE m.organization_id = $1
        ORDER BY m.joined_at ASC`,
      [orgId],
    );
    return res.rows;
  });
}

/** Add/replace a membership (admin action). Runs in tenant context so the
 *  memberships write policy (admin+) is enforced by RLS. */
export async function upsertMembership(
  actorId: string,
  orgId: string,
  targetUserId: string,
  role: Role,
): Promise<Membership> {
  return asUser(actorId, async (c: PoolClient) => {
    const res = await c.query<Membership>(
      `INSERT INTO public.memberships (organization_id, user_id, role, invited_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role
       RETURNING id, organization_id, user_id, role, joined_at`,
      [orgId, targetUserId, role, actorId],
    );
    return res.rows[0]!;
  });
}

export async function removeMembership(
  actorId: string,
  orgId: string,
  targetUserId: string,
): Promise<number> {
  return asUser(actorId, async (c: PoolClient) => {
    const res = await c.query(
      `DELETE FROM public.memberships WHERE organization_id = $1 AND user_id = $2`,
      [orgId, targetUserId],
    );
    return res.rowCount ?? 0;
  });
}
