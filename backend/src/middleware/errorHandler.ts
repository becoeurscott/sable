/** Centralized error boundary (§9 "Error Boundary") — consistent JSON shape. */
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

interface PgError {
  code?: string;
  constraint?: string;
  detail?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let status = 500;
  let code = 'internal_error';
  let message = 'Something went wrong';
  let details: unknown;

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof z.ZodError) {
    status = 400;
    code = 'bad_request';
    message = 'Validation failed';
    details = err.issues;
  } else if (isPgError(err)) {
    if (err.code === '23505') {
      status = 409;
      code = 'conflict';
      message = 'A record with these values already exists';
    } else if (err.code === '23503') {
      status = 400;
      code = 'bad_request';
      message = 'Referenced record does not exist';
    } else if (err.code === '23514') {
      status = 400;
      code = 'bad_request';
      message = 'A value violates a constraint';
    } else if (err.code === '42501') {
      // insufficient_privilege — an RLS policy blocked the operation.
      status = 403;
      code = 'forbidden';
      message = 'You do not have permission to do that';
    }
  }

  const log = status >= 500 ? logger.error : logger.warn;
  log.call(logger, { err, status, code, userId: req.user?.id, orgId: req.org?.id }, message);

  res.status(status).json({
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  });
}

function isPgError(err: unknown): err is PgError {
  return typeof err === 'object' && err !== null && 'code' in err;
}
