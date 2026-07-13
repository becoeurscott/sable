/** Platform-admin dashboard endpoints (cross-tenant, service DB context). */
import type { Request, Response } from 'express';
import os from 'node:os';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import { parsePage, paginated } from '../utils/pagination.js';
import * as repo from '../repositories/admin.repository.js';
import { isPlatformAdmin } from '../middleware/platformAdmin.js';
import { query } from '../config/db.js';
import {
  env,
  authMode,
  aiProvider,
  gemmaEnabled,
  stripeEnabled,
  emailEnabled,
  masterKeyEnabled,
} from '../config/env.js';

/** Lightweight capability probe — 200 for ANY authed user (drives the UI link). */
export const access = asyncHandler(async (req: Request, res: Response) => {
  res.json({ isAdmin: await isPlatformAdmin(req) });
});

export const overview = asyncHandler(async (_req: Request, res: Response) => {
  const [counts, signups, plans, recent] = await Promise.all([
    repo.overviewCounts(),
    repo.signupSeries(12),
    repo.planDistribution(),
    repo.recentSignups(8),
  ]);
  res.json({ counts, signups, plans, recent });
});

// ── Users ────────────────────────────────────────────────────────────────────

export const users = asyncHandler(async (req: Request, res: Response) => {
  const page = parsePage(req, 25, 100);
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const { rows, total } = await repo.listUsers({ q, ...page });
  res.json(paginated(rows, total, page));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { isPlatformAdmin: flag } = req.body as { isPlatformAdmin?: boolean };
  if (typeof flag !== 'boolean') throw badRequest('isPlatformAdmin (boolean) is required');
  if (req.user!.id === req.params.id! && !flag) {
    throw conflict('You cannot remove your own platform-admin access');
  }
  const user = await repo.setPlatformAdmin(req.params.id!, flag);
  if (!user) throw notFound('User not found');
  res.json({ user });
});

export const removeUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.id === req.params.id!) throw conflict('You cannot delete your own account here');
  try {
    const out = await repo.deleteUser(req.params.id!);
    if (!out.ok) {
      throw 'reason' in out && out.reason === 'owns_org'
        ? conflict('User owns one or more organizations — transfer or delete those first')
        : notFound('User not found');
    }
  } catch (err) {
    // FK violation: the user authored records (expenses, invoices, …).
    if ((err as { code?: string }).code === '23503') {
      throw conflict('User has authored records in an organization and cannot be hard-deleted');
    }
    throw err;
  }
  res.status(204).end();
});

// ── Organizations ────────────────────────────────────────────────────────────

export const orgs = asyncHandler(async (req: Request, res: Response) => {
  const page = parsePage(req, 25, 100);
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const { rows, total } = await repo.listOrgs({ q, ...page });
  res.json(paginated(rows, total, page));
});

export const orgDetail = asyncHandler(async (req: Request, res: Response) => {
  const detail = await repo.orgDetail(req.params.id!);
  if (!detail) throw notFound('Organization not found');
  res.json(detail);
});

const SUB_STATUSES = ['trialing', 'active', 'past_due', 'canceled', 'paused'];

export const updateOrgSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { planCode, status } = req.body as { planCode?: string; status?: string };
  if (!planCode && !status) throw badRequest('Provide planCode and/or status');
  if (status && !SUB_STATUSES.includes(status)) {
    throw badRequest(`status must be one of: ${SUB_STATUSES.join(', ')}`);
  }
  const subscription = await repo.updateOrgSubscription(req.params.id!, { planCode, status });
  if (!subscription) throw notFound('Plan not found');
  res.json({ subscription });
});

// ── Plans ────────────────────────────────────────────────────────────────────

export const plans = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ plans: await repo.listPlans() });
});

export const updatePlan = asyncHandler(async (req: Request, res: Response) => {
  const { name, priceMonthly, priceAnnual, quotas, features, isPublic } = req.body as Record<
    string,
    never
  >;
  const plan = await repo.updatePlan(req.params.id!, {
    name,
    priceMonthly,
    priceAnnual,
    quotas,
    features,
    isPublic,
  });
  if (!plan) throw notFound('Plan not found');
  res.json({ plan });
});

// ── Usage / audit / system ───────────────────────────────────────────────────

export const usage = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await repo.usageSummary());
});

export const audit = asyncHandler(async (req: Request, res: Response) => {
  const page = parsePage(req, 50, 200);
  const orgId = typeof req.query.orgId === 'string' ? req.query.orgId : undefined;
  const action = typeof req.query.action === 'string' ? req.query.action : undefined;
  const { rows, total } = await repo.listAudit({ orgId, action, ...page });
  res.json(paginated(rows, total, page));
});

export const system = asyncHandler(async (_req: Request, res: Response) => {
  let dbOk = true;
  let dbLatencyMs: number | null = null;
  try {
    const t0 = Date.now();
    await query('SELECT 1');
    dbLatencyMs = Date.now() - t0;
  } catch {
    dbOk = false;
  }
  res.json({
    status: dbOk ? 'ok' : 'degraded',
    db: { ok: dbOk, latencyMs: dbLatencyMs },
    integrations: {
      authMode,
      aiProvider,
      gemma: gemmaEnabled,
      stripe: stripeEnabled,
      email: emailEnabled,
      masterKey: masterKeyEnabled,
      rateLimitStore: env.RATE_LIMIT_STORE,
    },
    runtime: {
      node: process.version,
      env: env.NODE_ENV,
      uptimeSec: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      host: os.hostname(),
    },
  });
});
