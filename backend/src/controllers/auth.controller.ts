import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as auth from '../services/auth.service.js';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const result = await auth.signup({ ...req.body, ip: req.ip });
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await auth.login({ ...req.body, ip: req.ip });
  res.json(result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await auth.refresh(req.body.refreshToken);
  res.json(result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await auth.logout(req.body?.refreshToken);
  res.status(204).end();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  res.json({ user: await auth.me(req.user!) });
});
