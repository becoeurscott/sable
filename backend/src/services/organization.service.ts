/** Organization + membership business logic (§10 /organizations/*). */
import {
  createOrganization,
  getOrganization,
  listUserOrganizations,
  updateOrganization,
  deleteOrganization,
  slugExists,
} from '../repositories/organization.repository.js';
import {
  listMembers,
  upsertMembership,
  removeMembership,
} from '../repositories/membership.repository.js';
import { getPlanByCode } from '../repositories/plan.repository.js';
import { findUserByEmail } from '../repositories/user.repository.js';
import { writeAudit } from '../repositories/audit.repository.js';
import { slugify, withSuffix } from '../utils/slug.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';
import type { Role } from '../types/index.js';

export const DEFAULT_CHART_OF_ACCOUNTS = [
  'Software Subscriptions',
  'Office Supplies',
  'Travel',
  'Meals & Entertainment',
  'Advertising',
  'Utilities',
  'Payroll',
  'Professional Services',
  'Rent',
  'Uncategorized',
];

export async function create(input: {
  ownerId: string;
  name: string;
  currency: string;
  country?: string;
  ip?: string;
}) {
  let slug = slugify(input.name);
  if (await slugExists(slug)) slug = withSuffix(slug);

  const trial = await getPlanByCode('free_trial');
  const trialDays = Number((trial?.quotas as Record<string, number | null>)?.trial_days ?? 14);

  const org = await createOrganization({
    ownerId: input.ownerId,
    name: input.name,
    slug,
    currency: input.currency,
    country: input.country,
    trialPlanId: trial?.id ?? null,
    trialDays,
  });

  // Seed a starter chart of accounts.
  await updateOrganization(input.ownerId, org.id, {
    chart_of_accounts: DEFAULT_CHART_OF_ACCOUNTS,
  });

  await writeAudit({
    orgId: org.id,
    actorId: input.ownerId,
    action: 'organization.create',
    resourceType: 'organization',
    resourceId: org.id,
    ip: input.ip,
  });
  return { ...org, chart_of_accounts: DEFAULT_CHART_OF_ACCOUNTS };
}

export async function get(userId: string, orgId: string) {
  const org = await getOrganization(userId, orgId);
  if (!org) throw notFound('Organization not found');
  return org;
}

export async function listForUser(userId: string) {
  return listUserOrganizations(userId);
}

export async function update(
  userId: string,
  orgId: string,
  patch: Record<string, unknown>,
  ip?: string,
) {
  const org = await updateOrganization(userId, orgId, patch);
  if (!org) throw notFound('Organization not found');
  await writeAudit({
    orgId,
    actorId: userId,
    action: 'organization.update',
    resourceType: 'organization',
    resourceId: orgId,
    metadata: { fields: Object.keys(patch) },
    ip,
  });
  return org;
}

export async function remove(userId: string, orgId: string, ip?: string) {
  const deleted = await deleteOrganization(userId, orgId);
  if (!deleted) throw forbidden('Only the owner can delete the organization');
  await writeAudit({ orgId, actorId: userId, action: 'organization.delete', ip });
}

export async function members(userId: string, orgId: string) {
  return listMembers(userId, orgId);
}

export async function invite(input: {
  actorId: string;
  orgId: string;
  email: string;
  role: Role;
  ip?: string;
}) {
  if (input.role === 'owner') throw badRequest('Cannot invite another owner');
  const invited = await findUserByEmail(input.email);
  if (!invited) {
    throw notFound('No FinanceAI account with that email — ask them to sign up first, then invite');
  }
  const membership = await upsertMembership(input.actorId, input.orgId, invited.id, input.role);
  await writeAudit({
    orgId: input.orgId,
    actorId: input.actorId,
    action: 'organization.invite',
    resourceType: 'membership',
    resourceId: membership.id,
    metadata: { email: input.email, role: input.role },
    ip: input.ip,
  });
  return membership;
}

export async function removeMember(input: {
  actorId: string;
  orgId: string;
  targetUserId: string;
  ip?: string;
}) {
  const org = await getOrganization(input.actorId, input.orgId);
  if (org?.owner_id === input.targetUserId) throw badRequest('Cannot remove the organization owner');
  const removed = await removeMembership(input.actorId, input.orgId, input.targetUserId);
  if (!removed) throw notFound('Member not found');
  await writeAudit({
    orgId: input.orgId,
    actorId: input.actorId,
    action: 'organization.remove_member',
    metadata: { targetUserId: input.targetUserId },
    ip: input.ip,
  });
}
