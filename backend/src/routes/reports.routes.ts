import { Router } from 'express';
import * as ctrl from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireOrg } from '../middleware/orgContext.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { limit } from '../middleware/rateLimit.js';
import { reportRangeQuery } from '../validators/schemas.js';

export const reportRoutes = Router();
reportRoutes.use(requireAuth, requireOrg(), requireRole('accountant'));

reportRoutes.get('/pl', limit(20), validate({ query: reportRangeQuery }), ctrl.pl);
reportRoutes.get('/cashflow', limit(20), validate({ query: reportRangeQuery }), ctrl.cashflowStatement);
reportRoutes.get('/tax-summary', limit(10), validate({ query: reportRangeQuery }), ctrl.taxSummary);
reportRoutes.post('/export', limit(10), validate({ query: reportRangeQuery }), ctrl.exportPl);
