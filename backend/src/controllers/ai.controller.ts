import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as ai from '../services/ai.service.js';

export const categorize = asyncHandler(async (req: Request, res: Response) => {
  res.json({ result: await ai.categorize(req.user!.id, req.org!.id, req.body.rawDescription) });
});

export const parseReceipt = asyncHandler(async (req: Request, res: Response) => {
  res.json({ receipt: await ai.parseReceipt(req.user!.id, req.org!.id, req.body.rawText) });
});

export const chat = asyncHandler(async (req: Request, res: Response) => {
  res.json(
    await ai.chat({
      userId: req.user!.id,
      orgId: req.org!.id,
      question: req.body.question,
      conversationId: req.body.conversationId,
    }),
  );
});

export const history = asyncHandler(async (req: Request, res: Response) => {
  res.json({ conversations: await ai.history(req.user!.id, req.org!.id) });
});

export const search = asyncHandler(async (req: Request, res: Response) => {
  res.json(await ai.nlSearch(req.user!.id, req.org!.id, req.body.query));
});

export const forecast = asyncHandler(async (req: Request, res: Response) => {
  res.json({ forecast: await ai.forecast(req.user!.id, req.org!.id) });
});

export const healthScore = asyncHandler(async (req: Request, res: Response) => {
  res.json({ health: await ai.healthScore(req.user!.id, req.org!.id) });
});
