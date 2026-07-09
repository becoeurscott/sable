import type { PoolClient } from 'pg';
import { query, asUser, serviceTxn } from '../config/db.js';
import type { Role } from '../types/index.js';

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan_id: string | null;
  logo_url: string | null;
  currency: string;
  fiscal_year_end: number;
  tax_id: string | null;
  country: string | null;
  chart_of_accounts: unknown;
  created_at: string;
  updated_at: string;
}

/**
 * Create org + owner membership + trial subscription atomically.
 * Runs in service context: no membership exists yet, so this is legitimately a
 * pre-tenant bootstrap. Every row is stamped with the caller as owner.
 */
export async function createOrganization(input: {
  ownerId: string;
  name: string;
  slug: string;
  currency: string;
  country?: string;
  trialPlanId: string | null;
  trialDays: number;
}): Promise<OrganizationRow> {
  return serviceTxn(async (c: PoolClient) => {
    const org = (
      await c.query<OrganizationRow>(
        `INSERT INTO public.organizations (name, slug, owner_id, plan_id, currency, country)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [input.name, input.slug, input.ownerId, input.trialPlanId, input.currency, input.country ?? null],
      )
    ).rows[0]!;

    await c.query(
      `INSERT INTO public.memberships (organization_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [org.id, input.ownerId],
    );

    await c.query(
      `INSERT INTO public.subscriptions (organization_id, plan_id, status, trial_ends_at)
       VALUES ($1, $2, 'trialing', now() + ($3 || ' days')::interval)`,
      [org.id, input.trialPlanId, String(input.trialDays)],
    );

    return org;
  });
}

export async function slugExists(slug: string): Promise<boolean> {
  const rows = await query(`SELECT 1 FROM public.organizations WHERE slug = $1`, [slug]);
  return rows.length > 0;
}

/** Service-context owner lookup — used by the master key to impersonate for RLS. */
export async function getOrgOwnerId(orgId: string): Promise<string | null> {
  const rows = await query<{ owner_id: string }>(
    `SELECT owner_id FROM public.organizations WHERE id = $1`,
    [orgId],
  );
  return rows[0]?.owner_id ?? null;
}

export async function getOrganization(userId: string, orgId: string): Promise<OrganizationRow | null> {
  return asUser(userId, async (c) => {
    const res = await c.query<OrganizationRow>(`SELECT * FROM public.organizations WHERE id = $1`, [
      orgId,
    ]);
    return res.rows[0] ?? null;
  });
}

/** Orgs the user belongs to, with their role. Service context, scoped to user. */
export async function listUserOrganizations(
  userId: string,
): Promise<Array<OrganizationRow & { role: Role }>> {
  return query<OrganizationRow & { role: Role }>(
    `SELECT o.*, m.role
       FROM public.organizations o
       JOIN public.memberships m ON m.organization_id = o.id
      WHERE m.user_id = $1
      ORDER BY o.created_at DESC`,
    [userId],
  );
}

export async function updateOrganization(
  userId: string,
  orgId: string,
  patch: Partial<
    Pick<
      OrganizationRow,
      'name' | 'logo_url' | 'currency' | 'fiscal_year_end' | 'tax_id' | 'country' | 'chart_of_accounts'
    >
  >,
): Promise<OrganizationRow | null> {
  const fields = Object.keys(patch);
  if (fields.length === 0) return getOrganization(userId, orgId);

  const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const values = fields.map((f) => {
    const v = (patch as Record<string, unknown>)[f];
    return f === 'chart_of_accounts' ? JSON.stringify(v) : v;
  });

  return asUser(userId, async (c) => {
    const res = await c.query<OrganizationRow>(
      `UPDATE public.organizations SET ${sets} WHERE id = $1 RETURNING *`,
      [orgId, ...values],
    );
    return res.rows[0] ?? null;
  });
}

export async function deleteOrganization(userId: string, orgId: string): Promise<number> {
  return asUser(userId, async (c) => {
    const res = await c.query(`DELETE FROM public.organizations WHERE id = $1`, [orgId]);
    return res.rowCount ?? 0;
  });
}
