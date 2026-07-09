/** Revenue business logic (§10 /revenues, §11 /app/revenue). */
import {
  listRevenues,
  getRevenue,
  createRevenue,
  updateRevenue,
  deleteRevenue,
} from '../repositories/revenue.repository.js';
import { writeAudit } from '../repositories/audit.repository.js';
import { notFound } from '../utils/errors.js';

export async function list(
  userId: string,
  orgId: string,
  filter: { source?: string; dateFrom?: string; dateTo?: string },
  limit: number,
  offset: number,
) {
  return listRevenues(userId, orgId, filter, limit, offset);
}

export async function getOne(userId: string, id: string) {
  const rev = await getRevenue(userId, id);
  if (!rev) throw notFound('Revenue not found');
  return rev;
}

export async function create(input: {
  userId: string;
  orgId: string;
  amount: number;
  currency?: string;
  source: string;
  description?: string;
  invoiceId?: string;
  revenueDate?: string;
  ip?: string;
}) {
  const rev = await createRevenue(input.userId, input.orgId, {
    amount: input.amount,
    currency: input.currency ?? 'USD',
    source: input.source,
    description: input.description,
    invoiceId: input.invoiceId,
    revenueDate: input.revenueDate,
  });
  await writeAudit({
    orgId: input.orgId,
    actorId: input.userId,
    action: 'revenue.create',
    resourceType: 'revenue',
    resourceId: rev.id,
    metadata: { amount: input.amount, source: input.source },
    ip: input.ip,
  });
  return rev;
}

export async function update(userId: string, id: string, patch: Record<string, unknown>, ip?: string) {
  const updated = await updateRevenue(userId, id, patch);
  if (!updated) throw notFound('Revenue not found');
  await writeAudit({
    orgId: updated.organization_id,
    actorId: userId,
    action: 'revenue.update',
    resourceType: 'revenue',
    resourceId: id,
    ip,
  });
  return updated;
}

export async function remove(userId: string, orgId: string, id: string, ip?: string) {
  const deleted = await deleteRevenue(userId, id);
  if (!deleted) throw notFound('Revenue not found');
  await writeAudit({ orgId, actorId: userId, action: 'revenue.delete', resourceType: 'revenue', resourceId: id, ip });
}
