import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as expenses from '../services/expense.service.js';
import { parsePage, paginated } from '../utils/pagination.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page = parsePage(req);
  const q = req.query as Record<string, string | undefined>;
  const { rows, total } = await expenses.list(
    req.user!.id,
    req.org!.id,
    {
      category: q.category,
      status: q.status,
      vendor: q.vendor,
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      amountMin: q.amountMin != null ? Number(q.amountMin) : undefined,
      amountMax: q.amountMax != null ? Number(q.amountMax) : undefined,
    },
    page.limit,
    page.offset,
  );
  res.json(paginated(rows, total, page));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  res.json({ expense: await expenses.getOne(req.user!.id, req.params.id!) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const expense = await expenses.create({
    userId: req.user!.id,
    orgId: req.org!.id,
    ...req.body,
    ip: req.ip,
  });
  res.status(201).json({ expense });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  res.json({ expense: await expenses.update(req.user!.id, req.params.id!, req.body, req.ip) });
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const expense = await expenses.decide(req.org!, req.user!.id, req.params.id!, req.body.decision, req.ip);
  res.json({ expense });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await expenses.remove(req.user!.id, req.org!.id, req.params.id!, req.ip);
  res.status(204).end();
});
