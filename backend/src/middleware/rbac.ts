/** Role-based guard factory (§9 middleware/rbac.ts, §7 permissions matrix). */
import type { NextFunction, Request, Response } from 'express';
import { forbidden } from '../utils/errors.js';
import { ROLE_RANK, type Role } from '../types/index.js';

/** Require at least `minRole` in the resolved org. Run after requireOrg. */
export function requireRole(minRole: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.org) throw forbidden('Organization context missing');
    if (ROLE_RANK[req.org.role] < ROLE_RANK[minRole]) {
      throw forbidden(`Requires ${minRole} role or higher`);
    }
    next();
  };
}
