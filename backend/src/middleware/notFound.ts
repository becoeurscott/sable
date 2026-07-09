import type { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'not_found', message: `No route: ${req.method} ${req.path}` } });
}
