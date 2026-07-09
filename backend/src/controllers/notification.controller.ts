import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listNotifications, markRead } from '../repositories/notification.repository.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const unreadOnly = req.query.unread === 'true';
  res.json({ notifications: await listNotifications(req.user!.id, unreadOnly) });
});

export const read = asyncHandler(async (req: Request, res: Response) => {
  await markRead(req.user!.id, req.params.id!);
  res.status(204).end();
});
