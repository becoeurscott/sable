import type { Request } from 'express';

export interface Page {
  limit: number;
  offset: number;
  page: number;
}

/** Parse ?page= & ?limit= with safe bounds. */
export function parsePage(req: Request, defaultLimit = 25, maxLimit = 100): Page {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number.parseInt(String(req.query.limit ?? defaultLimit), 10) || defaultLimit),
  );
  return { limit, offset: (page - 1) * limit, page };
}

export function paginated<T>(rows: T[], total: number, page: Page) {
  return {
    data: rows,
    pagination: {
      page: page.page,
      limit: page.limit,
      total,
      totalPages: Math.ceil(total / page.limit),
    },
  };
}
