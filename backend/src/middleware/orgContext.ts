/**
 * Tenant-context middleware (§9 "Tenant Context Middleware").
 * Resolves the target organization and the caller's role in it, then attaches
 * req.org = { id, role }. Membership is verified in service context; all
 * subsequent data access uses asUser() so RLS re-checks isolation at the DB.
 */
import type { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { forbidden, unauthorized } from '../utils/errors.js';
import { getMembership } from '../repositories/membership.repository.js';
import type { Role } from '../types/index.js';

interface Options {
  /** Where to read the org id from. Default: X-Org-Id header. */
  param?: string;
}

export function requireOrg(opts: Options = {}) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw unauthorized();

    const orgId = opts.param
      ? (req.params[opts.param] as string | undefined)
      : req.header('x-org-id');

    if (!orgId) {
      throw forbidden('Organization not specified (send X-Org-Id header or org id in path)');
    }

    const membership = await getMembership(orgId, req.user.id);
    if (!membership) {
      // Do not leak org existence to non-members.
      throw forbidden('You are not a member of this organization');
    }

    req.org = { id: orgId, role: membership.role as Role };
    next();
  });
}
