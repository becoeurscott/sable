import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as billing from '../services/billing.service.js';

export const plans = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ plans: await billing.plans() });
});

export const current = asyncHandler(async (req: Request, res: Response) => {
  res.json({ subscription: await billing.currentSubscription(req.user!.id, req.org!.id) });
});

export const usage = asyncHandler(async (req: Request, res: Response) => {
  res.json(await billing.usageSummary(req.user!.id, req.org!.id));
});

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const out = await billing.subscribe({
    userId: req.user!.id,
    orgId: req.org!.id,
    email: req.user!.email,
    planCode: req.body.planCode,
    interval: req.body.interval,
    successUrl: req.body.successUrl,
    cancelUrl: req.body.cancelUrl,
  });
  res.json(out);
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  res.json(await billing.cancel(req.user!.id, req.org!.id));
});
