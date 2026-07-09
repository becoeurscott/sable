import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as revenues from '../services/revenue.service.js';
import { parsePage, paginated } from '../utils/pagination.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page = parsePage(req);
  const q = req.query as Record<string, string | undefined>;
  const { rows, total } = await revenues.list(
    req.user!.id,
    req.org!.id,
    { source: q.source, dateFrom: q.dateFrom, dateTo: q.dateTo },
    page.limit,
    page.offset,
  );
  res.json(paginated(rows, total, page));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  res.json({ revenue: await revenues.getOne(req.user!.id, req.params.id!) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const revenue = await revenues.create({
    userId: req.user!.id,
    orgId: req.org!.id,
    ...req.body,
    ip: req.ip,
  });
  res.status(201).json({ revenue });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  res.json({ revenue: await revenues.update(req.user!.id, req.params.id!, req.body, req.ip) });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await revenues.remove(req.user!.id, req.org!.id, req.params.id!, req.ip);
  res.status(204).end();
});
