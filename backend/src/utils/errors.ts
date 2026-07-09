/** Typed application errors → consistent JSON envelope via errorHandler (§9). */

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (msg = 'Bad request', details?: unknown) =>
  new AppError(400, 'bad_request', msg, details);
export const unauthorized = (msg = 'Authentication required') =>
  new AppError(401, 'unauthorized', msg);
export const forbidden = (msg = 'You do not have permission to do that') =>
  new AppError(403, 'forbidden', msg);
export const notFound = (msg = 'Not found') => new AppError(404, 'not_found', msg);
export const conflict = (msg = 'Conflict', details?: unknown) =>
  new AppError(409, 'conflict', msg, details);
export const paymentRequired = (msg = 'Upgrade required', details?: unknown) =>
  new AppError(402, 'payment_required', msg, details);
export const tooManyRequests = (msg = 'Rate limit exceeded') =>
  new AppError(429, 'rate_limited', msg);
export const serviceUnavailable = (msg = 'Service unavailable') =>
  new AppError(503, 'service_unavailable', msg);
