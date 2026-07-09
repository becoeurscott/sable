import { Router } from 'express';
import * as ctrl from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireOrg } from '../middleware/orgContext.js';
import { validate } from '../middleware/validate.js';
import { limit } from '../middleware/rateLimit.js';
import { reportRangeQuery } from '../validators/schemas.js';

export const dashboardRoutes = Router();
dashboardRoutes.use(requireAuth, requireOrg());

dashboardRoutes.get('/', limit(60), validate({ query: reportRangeQuery }), ctrl.dashboard);
dashboardRoutes.get('/cashflow', limit(60), validate({ query: reportRangeQuery }), ctrl.dashboardCashflow);
