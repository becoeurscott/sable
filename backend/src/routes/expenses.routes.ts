import { Router } from 'express';
import * as ctrl from '../controllers/expense.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireOrg } from '../middleware/orgContext.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { limit } from '../middleware/rateLimit.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpenseQuery,
  approveSchema,
  idParam,
} from '../validators/schemas.js';

export const expenseRoutes = Router();
expenseRoutes.use(requireAuth, requireOrg());

expenseRoutes.get('/', limit(120), validate({ query: listExpenseQuery }), ctrl.list);
expenseRoutes.post('/', limit(60), validate({ body: createExpenseSchema }), ctrl.create);
expenseRoutes.get('/:id', limit(120), validate({ params: idParam }), ctrl.getOne);
expenseRoutes.patch(
  '/:id',
  limit(60),
  validate({ params: idParam, body: updateExpenseSchema }),
  requireRole('manager'),
  ctrl.update,
);
expenseRoutes.post(
  '/:id/approve',
  limit(60),
  validate({ params: idParam, body: approveSchema }),
  requireRole('manager'),
  ctrl.approve,
);
expenseRoutes.delete('/:id', limit(30), validate({ params: idParam }), requireRole('admin'), ctrl.remove);
