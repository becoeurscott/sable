/**
 * Cross-tenant queries for the platform-admin dashboard.
 * All of these run in the SERVICE context (RLS bypassed) — they are reachable
 * only through requirePlatformAdmin. Never interpolate user input into SQL.
 */
import { query } from '../config/db.js';

const CURRENT_PERIOD = `to_char(now(), 'YYYY-MM')`;

// ── Overview ─────────────────────────────────────────────────────────────────

export async function overviewCounts() {
  const [row] = await query<Record<string, string>>(
    `SELECT
       (SELECT count(*) FROM public.users)                                        AS users,
       (SELECT count(*) FROM public.users WHERE created_at > now() - interval '30 days') AS users_30d,
       (SELECT count(*) FROM public.organizations)                                AS orgs,
       (SELECT count(*) FROM public.subscriptions WHERE status = 'active')        AS subs_active,
       (SELECT count(*) FROM public.subscriptions WHERE status = 'trialing')      AS subs_trialing,
       (SELECT count(*) FROM public.subscriptions WHERE status = 'past_due')      AS subs_past_due,
       (SELECT count(*) FROM public.subscriptions WHERE status = 'canceled')      AS subs_canceled,
       (SELECT count(*) FROM public.invoices)                                     AS invoices,
       (SELECT count(*) FROM public.expenses)                                     AS expenses,
       (SELECT count(*) FROM public.revenues)                                     AS revenues,
       (SELECT count(*) FROM public.api_keys WHERE revoked_at IS NULL)            AS api_keys_active,
       (SELECT coalesce(sum(p.price_monthly), 0)
          FROM public.subscriptions s JOIN public.plans p ON p.id = s.plan_id
         WHERE s.status = 'active')                                               AS mrr_cents,
       (SELECT coalesce(sum(used), 0) FROM public.usage_metrics
         WHERE metric = 'ai_credits' AND period = ${CURRENT_PERIOD})              AS ai_credits_month`,
  );
  return row;
}

export async function signupSeries(months = 12) {
  return query<{ month: string; users: string; orgs: string }>(
    `WITH m AS (
       SELECT to_char(date_trunc('month', now()) - (i || ' months')::interval, 'YYYY-MM') AS month
       FROM generate_series($1::int - 1, 0, -1) AS i
     )
     SELECT m.month,
            coalesce(u.n, 0)::text AS users,
            coalesce(o.n, 0)::text AS orgs
     FROM m
     LEFT JOIN (SELECT to_char(created_at, 'YYYY-MM') mo, count(*) n FROM public.users GROUP BY 1) u ON u.mo = m.month
     LEFT JOIN (SELECT to_char(created_at, 'YYYY-MM') mo, count(*) n FROM public.organizations GROUP BY 1) o ON o.mo = m.month
     ORDER BY m.month`,
    [months],
  );
}

export async function planDistribution() {
  return query<{ code: string; name: string; orgs: string }>(
    `SELECT p.code, p.name, count(s.id)::text AS orgs
     FROM public.plans p
     LEFT JOIN public.subscriptions s ON s.plan_id = p.id AND s.status IN ('active','trialing')
     GROUP BY p.id ORDER BY p.sort_order`,
  );
}

export async function recentSignups(limit = 8) {
  return query(
    `SELECT u.id, u.email, u.full_name, u.created_at,
            (SELECT o.name FROM public.memberships m
              JOIN public.organizations o ON o.id = m.organization_id
             WHERE m.user_id = u.id ORDER BY m.joined_at LIMIT 1) AS org_name
     FROM public.users u ORDER BY u.created_at DESC LIMIT $1`,
    [limit],
  );
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(opts: { q?: string; limit: number; offset: number }) {
  const where = opts.q ? `WHERE u.email ILIKE $3 OR u.full_name ILIKE $3` : '';
  const params: unknown[] = [opts.limit, opts.offset];
  if (opts.q) params.push(`%${opts.q}%`);
  const rows = await query(
    `SELECT u.id, u.email, u.full_name, u.is_platform_admin, u.created_at,
            count(m.id)::int AS org_count,
            count(*) OVER()::int AS total
     FROM public.users u
     LEFT JOIN public.memberships m ON m.user_id = u.id
     ${where}
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT $1 OFFSET $2`,
    params,
  );
  const total = rows.length > 0 ? (rows[0] as { total: number }).total : 0;
  return { rows: rows.map(({ total: _t, ...r }) => r), total };
}

export async function setPlatformAdmin(userId: string, isAdmin: boolean) {
  const rows = await query(
    `UPDATE public.users SET is_platform_admin = $2 WHERE id = $1
     RETURNING id, email, full_name, is_platform_admin`,
    [userId, isAdmin],
  );
  return rows[0] ?? null;
}

export async function deleteUser(userId: string) {
  const owns = await query<{ n: string }>(
    'SELECT count(*) AS n FROM public.organizations WHERE owner_id = $1',
    [userId],
  );
  if (Number(owns[0]?.n ?? 0) > 0) return { ok: false as const, reason: 'owns_org' as const };
  const rows = await query('DELETE FROM public.users WHERE id = $1 RETURNING id', [userId]);
  return { ok: rows.length > 0 } as const;
}

// ── Organizations ────────────────────────────────────────────────────────────

export async function listOrgs(opts: { q?: string; limit: number; offset: number }) {
  const where = opts.q ? `WHERE o.name ILIKE $3 OR o.slug ILIKE $3 OR u.email ILIKE $3` : '';
  const params: unknown[] = [opts.limit, opts.offset];
  if (opts.q) params.push(`%${opts.q}%`);
  const rows = await query(
    `SELECT o.id, o.name, o.slug, o.currency, o.created_at,
            u.email AS owner_email,
            p.name AS plan_name, p.code AS plan_code,
            s.status AS subscription_status,
            (SELECT count(*) FROM public.memberships m WHERE m.organization_id = o.id)::int AS member_count,
            (SELECT count(*) FROM public.invoices i WHERE i.organization_id = o.id)::int AS invoice_count,
            (SELECT count(*) FROM public.expenses e WHERE e.organization_id = o.id)::int AS expense_count,
            count(*) OVER()::int AS total
     FROM public.organizations o
     JOIN public.users u ON u.id = o.owner_id
     LEFT JOIN public.subscriptions s ON s.organization_id = o.id
     LEFT JOIN public.plans p ON p.id = s.plan_id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT $1 OFFSET $2`,
    params,
  );
  const total = rows.length > 0 ? (rows[0] as { total: number }).total : 0;
  return { rows: rows.map(({ total: _t, ...r }) => r), total };
}

export async function orgDetail(orgId: string) {
  const [org] = await query(
    `SELECT o.*, u.email AS owner_email, u.full_name AS owner_name
     FROM public.organizations o JOIN public.users u ON u.id = o.owner_id
     WHERE o.id = $1`,
    [orgId],
  );
  if (!org) return null;
  const [members, subscription, usage, counts, audit] = await Promise.all([
    query(
      `SELECT m.id, m.user_id, m.role, m.joined_at, u.email, u.full_name
       FROM public.memberships m JOIN public.users u ON u.id = m.user_id
       WHERE m.organization_id = $1 ORDER BY m.joined_at`,
      [orgId],
    ),
    query(
      `SELECT s.*, p.name AS plan_name, p.code AS plan_code, p.price_monthly
       FROM public.subscriptions s LEFT JOIN public.plans p ON p.id = s.plan_id
       WHERE s.organization_id = $1`,
      [orgId],
    ).then((r) => r[0] ?? null),
    query(
      `SELECT metric, used FROM public.usage_metrics
       WHERE organization_id = $1 AND period = ${CURRENT_PERIOD} ORDER BY metric`,
      [orgId],
    ),
    query<Record<string, string>>(
      `SELECT
         (SELECT count(*) FROM public.invoices WHERE organization_id = $1)  AS invoices,
         (SELECT count(*) FROM public.expenses WHERE organization_id = $1)  AS expenses,
         (SELECT count(*) FROM public.revenues WHERE organization_id = $1)  AS revenues,
         (SELECT count(*) FROM public.api_keys WHERE organization_id = $1 AND revoked_at IS NULL) AS api_keys,
         (SELECT coalesce(sum(total),0) FROM public.invoices WHERE organization_id = $1 AND status = 'paid') AS invoiced_paid,
         (SELECT coalesce(sum(amount),0) FROM public.revenues WHERE organization_id = $1) AS revenue_total,
         (SELECT coalesce(sum(amount),0) FROM public.expenses WHERE organization_id = $1) AS expense_total`,
      [orgId],
    ).then((r) => r[0]),
    query(
      `SELECT a.id, a.action, a.resource_type, a.created_at, u.email AS actor_email
       FROM public.audit_logs a LEFT JOIN public.users u ON u.id = a.actor_id
       WHERE a.organization_id = $1 ORDER BY a.created_at DESC LIMIT 15`,
      [orgId],
    ),
  ]);
  return { org, members, subscription, usage, counts, audit };
}

/** Comp / change / cancel a subscription directly (admin override). */
export async function updateOrgSubscription(
  orgId: string,
  patch: { planCode?: string; status?: string },
) {
  let planId: string | null | undefined;
  if (patch.planCode) {
    const [plan] = await query<{ id: string }>('SELECT id FROM public.plans WHERE code = $1', [
      patch.planCode,
    ]);
    if (!plan) return null;
    planId = plan.id;
  }
  const rows = await query(
    `INSERT INTO public.subscriptions (organization_id, plan_id, status)
     VALUES ($1, $2, coalesce($3, 'active'))
     ON CONFLICT (organization_id) DO UPDATE SET
       plan_id = coalesce($2, public.subscriptions.plan_id),
       status  = coalesce($3, public.subscriptions.status)
     RETURNING *`,
    [orgId, planId ?? null, patch.status ?? null],
  );
  if (planId) {
    await query('UPDATE public.organizations SET plan_id = $2 WHERE id = $1', [orgId, planId]);
  }
  return rows[0];
}

// ── Plans ────────────────────────────────────────────────────────────────────

export async function listPlans() {
  return query(
    `SELECT p.*,
            (SELECT count(*) FROM public.subscriptions s
              WHERE s.plan_id = p.id AND s.status IN ('active','trialing'))::int AS active_orgs
     FROM public.plans p ORDER BY p.sort_order`,
  );
}

export async function updatePlan(
  planId: string,
  patch: {
    name?: string;
    priceMonthly?: number;
    priceAnnual?: number | null;
    quotas?: Record<string, unknown>;
    features?: Record<string, unknown>;
    isPublic?: boolean;
  },
) {
  const rows = await query(
    `UPDATE public.plans SET
       name          = coalesce($2, name),
       price_monthly = coalesce($3, price_monthly),
       price_annual  = coalesce($4, price_annual),
       quotas        = coalesce($5, quotas),
       features      = coalesce($6, features),
       is_public     = coalesce($7, is_public)
     WHERE id = $1 RETURNING *`,
    [
      planId,
      patch.name ?? null,
      patch.priceMonthly ?? null,
      patch.priceAnnual === undefined ? null : patch.priceAnnual,
      patch.quotas ? JSON.stringify(patch.quotas) : null,
      patch.features ? JSON.stringify(patch.features) : null,
      patch.isPublic ?? null,
    ],
  );
  return rows[0] ?? null;
}

// ── Usage ────────────────────────────────────────────────────────────────────

export async function usageSummary() {
  const [byMetric, topOrgs] = await Promise.all([
    query(
      `SELECT metric, sum(used) AS used, count(DISTINCT organization_id)::int AS orgs
       FROM public.usage_metrics WHERE period = ${CURRENT_PERIOD}
       GROUP BY metric ORDER BY metric`,
    ),
    query(
      `SELECT o.id, o.name, um.used AS ai_credits,
              p.name AS plan_name, (p.quotas->>'ai_credits_mo')::numeric AS ai_limit
       FROM public.usage_metrics um
       JOIN public.organizations o ON o.id = um.organization_id
       LEFT JOIN public.subscriptions s ON s.organization_id = o.id
       LEFT JOIN public.plans p ON p.id = s.plan_id
       WHERE um.metric = 'ai_credits' AND um.period = ${CURRENT_PERIOD}
       ORDER BY um.used DESC LIMIT 20`,
    ),
  ]);
  return { byMetric, topOrgs };
}

// ── Audit ────────────────────────────────────────────────────────────────────

export async function listAudit(opts: {
  orgId?: string;
  action?: string;
  limit: number;
  offset: number;
}) {
  const conds: string[] = [];
  const params: unknown[] = [opts.limit, opts.offset];
  if (opts.orgId) {
    params.push(opts.orgId);
    conds.push(`a.organization_id = $${params.length}`);
  }
  if (opts.action) {
    params.push(`%${opts.action}%`);
    conds.push(`a.action ILIKE $${params.length}`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const rows = await query(
    `SELECT a.id, a.action, a.resource_type, a.resource_id, a.metadata, a.ip, a.created_at,
            u.email AS actor_email, o.name AS org_name,
            count(*) OVER()::int AS total
     FROM public.audit_logs a
     LEFT JOIN public.users u ON u.id = a.actor_id
     LEFT JOIN public.organizations o ON o.id = a.organization_id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    params,
  );
  const total = rows.length > 0 ? (rows[0] as { total: number }).total : 0;
  return { rows: rows.map(({ total: _t, ...r }) => r), total };
}
