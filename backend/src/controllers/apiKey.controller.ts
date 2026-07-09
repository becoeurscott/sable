import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as apiKeys from '../services/apiKey.service.js';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const out = await apiKeys.create({
    actorId: req.user!.id,
    orgId: req.org!.id,
    name: req.body.name,
    role: req.body.role,
    readOnly: req.body.readOnly,
    expiresAt: req.body.expiresAt,
    ip: req.ip,
  });
  // `key` is the plaintext — returned once, never retrievable again.
  res.status(201).json(out);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  res.json({ apiKeys: await apiKeys.list(req.user!.id, req.org!.id) });
});

export const revoke = asyncHandler(async (req: Request, res: Response) => {
  await apiKeys.revoke(req.user!.id, req.org!.id, req.params.keyId!, req.ip);
  res.status(204).end();
});
