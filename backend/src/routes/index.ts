import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { orgRoutes } from './organizations.routes.js';
import { expenseRoutes } from './expenses.routes.js';
import { invoiceRoutes } from './invoices.routes.js';
import { revenueRoutes } from './revenues.routes.js';
import { dashboardRoutes } from './dashboard.routes.js';
import { reportRoutes } from './reports.routes.js';
import { aiRoutes } from './ai.routes.js';
import { billingRoutes } from './billing.routes.js';
import { notificationRoutes } from './notifications.routes.js';

/** Mounts the full REST surface from §10 under /api/v1. */
export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/organizations', orgRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/invoices', invoiceRoutes);
apiRouter.use('/revenues', revenueRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/billing', billingRoutes);
apiRouter.use('/notifications', notificationRoutes);
