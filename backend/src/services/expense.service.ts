/** Expense business logic (§10 /expenses/*). */
import {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  approveExpense,
  deleteExpense,
  type ExpenseFilter,
} from '../repositories/expense.repository.js';
import { getOrganization } from '../repositories/organization.repository.js';
import { incrementUsage } from '../repositories/usage.repository.js';
import { writeAudit } from '../repositories/audit.repository.js';
import { assertWithinQuota } from './quota.service.js';
import { categorizeTransaction } from '../ai/categorizer.js';
import { notFound } from '../utils/errors.js';
import type { OrgContext } from '../types/index.js';

export async function list(
  userId: string,
  orgId: string,
  filter: ExpenseFilter,
  limit: number,
  offset: number,
) {
  return listExpenses(userId, orgId, filter, limit, offset);
}

export async function getOne(userId: string, id: string) {
  const exp = await getExpense(userId, id);
  if (!exp) throw notFound('Expense not found');
  return exp;
}

export async function create(input: {
  userId: string;
  orgId: string;
  amount: number;
  currency?: string;
  category?: string;
  vendor?: string;
  description?: string;
  rawDescription?: string;
  expenseDate?: string;
  receiptUrl?: string;
  isBillable?: boolean;
  isReimbursable?: boolean;
  autoCategorize?: boolean;
  ip?: string;
}) {
  await assertWithinQuota(input.userId, input.orgId, 'expenses');

  let category = input.category;
  let aiCategorized = false;
  let aiConfidence: 'high' | 'medium' | 'low' | undefined;

  // Auto-categorize when no category was supplied but we have a description.
  if (!category && (input.autoCategorize ?? true)) {
    const org = await getOrganization(input.userId, input.orgId);
    const cats = (org?.chart_of_accounts as string[] | undefined) ?? [];
    const source = input.rawDescription ?? input.vendor ?? input.description ?? '';
    if (source) {
      const result = await categorizeTransaction(source, cats);
      category = result.category;
      aiCategorized = result.source === 'gemma';
      aiConfidence = result.confidence;
      if (result.source === 'gemma') await incrementUsage(input.orgId, 'ai_credits', 1);
    }
  }

  const expense = await createExpense(input.userId, input.orgId, {
    amount: input.amount,
    currency: input.currency ?? 'USD',
    category: category ?? 'Uncategorized',
    vendor: input.vendor,
    description: input.description,
    rawDescription: input.rawDescription,
    aiCategorized,
    aiConfidence,
    expenseDate: input.expenseDate,
    receiptUrl: input.receiptUrl,
    isBillable: input.isBillable,
    isReimbursable: input.isReimbursable,
  });

  await incrementUsage(input.orgId, 'expenses', 1);
  await writeAudit({
    orgId: input.orgId,
    actorId: input.userId,
    action: 'expense.create',
    resourceType: 'expense',
    resourceId: expense.id,
    metadata: { amount: input.amount, category: expense.category },
    ip: input.ip,
  });
  return expense;
}

export async function update(userId: string, id: string, patch: Record<string, unknown>, ip?: string) {
  const updated = await updateExpense(userId, id, patch);
  if (!updated) throw notFound('Expense not found or not editable');
  await writeAudit({
    orgId: updated.organization_id,
    actorId: userId,
    action: 'expense.update',
    resourceType: 'expense',
    resourceId: id,
    ip,
  });
  return updated;
}

export async function decide(
  ctx: OrgContext,
  userId: string,
  id: string,
  decision: 'approved' | 'rejected',
  ip?: string,
) {
  const updated = await approveExpense(userId, id, decision);
  if (!updated) throw notFound('Expense not found');
  await writeAudit({
    orgId: ctx.id,
    actorId: userId,
    action: `expense.${decision}`,
    resourceType: 'expense',
    resourceId: id,
    ip,
  });
  return updated;
}

export async function remove(userId: string, orgId: string, id: string, ip?: string) {
  const deleted = await deleteExpense(userId, id);
  if (!deleted) throw notFound('Expense not found');
  await writeAudit({ orgId, actorId: userId, action: 'expense.delete', resourceType: 'expense', resourceId: id, ip });
}
