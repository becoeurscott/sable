import { Router } from 'express';
import * as ctrl from '../controllers/revenue.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireOrg } from '../middleware/orgContext.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { limit } from '../middleware/rateLimit.js';
import { createRevenueSchema, updateRevenueSchema, listRevenueQuery, idParam } from '../validators/schemas.js';

export const revenueRoutes = Router();
revenueRoutes.use(requireAuth, requireOrg());

revenueRoutes.get('/', limit(120), validate({ query: listRevenueQuery }), ctrl.list);
revenueRoutes.post('/', limit(60), validate({ body: createRevenueSchema }), requireRole('accountant'), ctrl.create);
revenueRoutes.get('/:id', limit(120), validate({ params: idParam }), ctrl.getOne);
revenueRoutes.patch(
  '/:id',
  limit(60),
  validate({ params: idParam, body: updateRevenueSchema }),
  requireRole('accountant'),
  ctrl.update,
);
revenueRoutes.delete('/:id', limit(30), validate({ params: idParam }), requireRole('admin'), ctrl.remove);
