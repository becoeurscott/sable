/** Zod request validation (§9 middleware/validate.ts, §12 input validation). */
import type { NextFunction, Request, Response } from 'express';
import { z, type ZodType } from 'zod';
import { badRequest } from '../utils/errors.js';

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      if (schemas.query) {
        // Express 4: req.query is a writable property. Store coerced values back.
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw badRequest('Validation failed', err.issues);
      }
      throw err;
    }
  };
}
