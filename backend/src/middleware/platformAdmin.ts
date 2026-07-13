/**
 * Platform-admin guard — the SaaS operator role, distinct from per-org RBAC.
 * Grants access when the caller is authenticated AND one of:
 *   1. the master dev key (req.master),
 *   2. an email in PLATFORM_ADMIN_EMAILS,
 *   3. a user flagged is_platform_admin in the database.
 * Run after requireAuth. Admin routes are cross-tenant by design and use the
 * service DB context, so this is the single gate protecting them.
 */
import type { NextFunction, Request, Response } from 'express';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { forbidden, unauthorized } from '../utils/errors.js';

export async function isPlatformAdmin(req: Request): Promise<boolean> {
  if (req.master) return true;
  if (!req.user) return false;
  if (req.apiKey) return false; // org-scoped API keys never get platform access
  if (env.PLATFORM_ADMIN_EMAILS.includes(req.user.email.toLowerCase())) return true;
  const rows = await query<{ is_platform_admin: boolean }>(
    'SELECT is_platform_admin FROM public.users WHERE id = $1',
    [req.user.id],
  );
  return rows[0]?.is_platform_admin === true;
}

export const requirePlatformAdmin = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw unauthorized();
    if (!(await isPlatformAdmin(req))) throw forbidden('Platform admin access required');
    next();
  },
);
