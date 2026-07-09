/** Shared domain + request-context types. */

export const ROLES = ['owner', 'admin', 'accountant', 'manager', 'employee'] as const;
export type Role = (typeof ROLES)[number];

/** Role hierarchy rank — higher number = more privilege (§7/§8 ordering). */
export const ROLE_RANK: Record<Role, number> = {
  owner: 5,
  admin: 4,
  accountant: 3,
  manager: 2,
  employee: 1,
};

export interface AuthUser {
  id: string;
  email: string;
}

export interface OrgContext {
  id: string;
  role: Role;
}

// Augment Express Request with authenticated user + resolved org context.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      org?: OrgContext;
      apiKey?: { id: string; orgId: string; role: Role; readOnly: boolean; createdBy: string };
      requestId?: string;
    }
  }
}
