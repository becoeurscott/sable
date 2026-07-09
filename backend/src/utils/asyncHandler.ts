import type { NextFunction, Request, Response } from 'express';

/** Wraps async route handlers so rejected promises reach the error middleware. */
export const asyncHandler =
  <T = void>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
