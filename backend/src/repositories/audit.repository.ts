/** Immutable audit log (§12). Append-only; written in service context so it can
 *  never be suppressed by a caller's RLS, and has no update/delete path. */
import { query } from '../config/db.js';

export interface AuditEntry {
  orgId?: string;
  actorId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  await query(
    `INSERT INTO public.audit_logs
       (organization_id, actor_id, action, resource_type, resource_id, metadata, ip)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      entry.orgId ?? null,
      entry.actorId ?? null,
      entry.action,
      entry.resourceType ?? null,
      entry.resourceId ?? null,
      JSON.stringify(entry.metadata ?? {}),
      entry.ip ?? null,
    ],
  );
}
