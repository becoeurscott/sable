import { Router } from 'express';
import * as ctrl from '../controllers/billing.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireOrg } from '../middleware/orgContext.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { limit } from '../middleware/rateLimit.js';
import { subscribeSchema } from '../validators/schemas.js';

export const billingRoutes = Router();

// Public: pricing table (§10 GET /billing/plans, Public).
billingRoutes.get('/plans', limit(60), ctrl.plans);

// Authenticated + org-scoped billing operations (owner-gated writes).
billingRoutes.use(requireAuth, requireOrg());
billingRoutes.get('/usage', limit(60), ctrl.usage);
billingRoutes.get('/subscription', limit(30), requireRole('admin'), ctrl.current);
billingRoutes.post('/subscribe', limit(5), requireRole('owner'), validate({ body: subscribeSchema }), ctrl.subscribe);
billingRoutes.post('/cancel', limit(3), requireRole('owner'), ctrl.cancel);
