/**
 * Platform-admin API — cross-tenant SaaS management.
 * Everything below /access is double-gated: requireAuth + requirePlatformAdmin.
 */
import { Router } from 'express';
import * as ctrl from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePlatformAdmin } from '../middleware/platformAdmin.js';
import { limit } from '../middleware/rateLimit.js';

export const adminRoutes = Router();

adminRoutes.use(requireAuth);

// Capability probe — any authenticated user may ask "am I an admin?".
adminRoutes.get('/access', limit(60), ctrl.access);

adminRoutes.use(requirePlatformAdmin);

adminRoutes.get('/overview', limit(60), ctrl.overview);

adminRoutes.get('/users', limit(60), ctrl.users);
adminRoutes.patch('/users/:id', limit(30), ctrl.updateUser);
adminRoutes.delete('/users/:id', limit(10), ctrl.removeUser);

adminRoutes.get('/orgs', limit(60), ctrl.orgs);
adminRoutes.get('/orgs/:id', limit(60), ctrl.orgDetail);
adminRoutes.patch('/orgs/:id/subscription', limit(30), ctrl.updateOrgSubscription);

adminRoutes.get('/plans', limit(60), ctrl.plans);
adminRoutes.patch('/plans/:id', limit(30), ctrl.updatePlan);

adminRoutes.get('/usage', limit(60), ctrl.usage);
adminRoutes.get('/audit', limit(60), ctrl.audit);
adminRoutes.get('/system', limit(60), ctrl.system);
