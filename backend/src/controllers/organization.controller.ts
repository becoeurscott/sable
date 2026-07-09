import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as org from '../services/organization.service.js';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const created = await org.create({ ownerId: req.user!.id, ...req.body, ip: req.ip });
  res.status(201).json({ organization: created });
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  res.json({ organizations: await org.listForUser(req.user!.id) });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  res.json({ organization: await org.get(req.user!.id, req.org!.id) });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  res.json({ organization: await org.update(req.user!.id, req.org!.id, req.body, req.ip) });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await org.remove(req.user!.id, req.org!.id, req.ip);
  res.status(204).end();
});

export const members = asyncHandler(async (req: Request, res: Response) => {
  res.json({ members: await org.members(req.user!.id, req.org!.id) });
});

export const invite = asyncHandler(async (req: Request, res: Response) => {
  const membership = await org.invite({
    actorId: req.user!.id,
    orgId: req.org!.id,
    email: req.body.email,
    role: req.body.role,
    ip: req.ip,
  });
  res.status(201).json({ membership });
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  await org.removeMember({
    actorId: req.user!.id,
    orgId: req.org!.id,
    targetUserId: req.params.userId!,
    ip: req.ip,
  });
  res.status(204).end();
});
