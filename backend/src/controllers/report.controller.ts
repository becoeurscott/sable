import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as reports from '../services/report.service.js';
import * as ai from '../services/ai.service.js';

const range = (req: Request) =>
  reports.resolveRange(req.query.from as string | undefined, req.query.to as string | undefined);
const months = (req: Request) => Number(req.query.months ?? 6);

export const dashboard = asyncHandler(async (req: Request, res: Response) => {
  res.json(await reports.dashboard(req.user!.id, req.org!.id, range(req)));
});

export const dashboardCashflow = asyncHandler(async (req: Request, res: Response) => {
  res.json(await reports.cashflow(req.user!.id, req.org!.id, months(req)));
});

export const healthScore = asyncHandler(async (req: Request, res: Response) => {
  res.json({ health: await ai.healthScore(req.user!.id, req.org!.id) });
});

export const pl = asyncHandler(async (req: Request, res: Response) => {
  res.json(await reports.profitAndLoss(req.user!.id, req.org!.id, range(req)));
});

export const cashflowStatement = asyncHandler(async (req: Request, res: Response) => {
  res.json(await reports.cashflowStatement(req.user!.id, req.org!.id, months(req)));
});

export const taxSummary = asyncHandler(async (req: Request, res: Response) => {
  res.json(await reports.taxSummary(req.user!.id, req.org!.id, range(req)));
});

export const exportPl = asyncHandler(async (req: Request, res: Response) => {
  const csv = await reports.exportPlCsv(req.user!.id, req.org!.id, range(req));
  res
    .status(200)
    .setHeader('Content-Type', 'text/csv')
    .setHeader('Content-Disposition', 'attachment; filename="profit-and-loss.csv"')
    .send(csv);
});
