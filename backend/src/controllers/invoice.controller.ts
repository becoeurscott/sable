import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as invoices from '../services/invoice.service.js';
import * as org from '../services/organization.service.js';
import { parsePage, paginated } from '../utils/pagination.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page = parsePage(req);
  const q = req.query as Record<string, string | undefined>;
  const { rows, total } = await invoices.list(
    req.user!.id,
    req.org!.id,
    { status: q.status, client: q.client, dateFrom: q.dateFrom, dateTo: q.dateTo },
    page.limit,
    page.offset,
  );
  res.json(paginated(rows, total, page));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  res.json({ invoice: await invoices.getOne(req.user!.id, req.params.id!) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoices.create({
    userId: req.user!.id,
    orgId: req.org!.id,
    ...req.body,
    ip: req.ip,
  });
  res.status(201).json({ invoice });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  res.json({ invoice: await invoices.update(req.user!.id, req.params.id!, req.body, req.ip) });
});

export const send = asyncHandler(async (req: Request, res: Response) => {
  res.json({ invoice: await invoices.send(req.user!.id, req.params.id!, req.ip) });
});

export const markPaid = asyncHandler(async (req: Request, res: Response) => {
  res.json({ invoice: await invoices.markPaid(req.user!.id, req.params.id!, req.ip) });
});

export const pdf = asyncHandler(async (req: Request, res: Response) => {
  const organization = await org.get(req.user!.id, req.org!.id);
  const buffer = await invoices.pdf(req.user!.id, req.params.id!, organization.name);
  res
    .status(200)
    .setHeader('Content-Type', 'application/pdf')
    .setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.id}.pdf"`)
    .send(buffer);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await invoices.remove(req.user!.id, req.org!.id, req.params.id!, req.ip);
  res.status(204).end();
});
