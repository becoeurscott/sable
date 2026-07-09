import { Router } from 'express';
import * as ctrl from '../controllers/invoice.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireOrg } from '../middleware/orgContext.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { limit } from '../middleware/rateLimit.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  listInvoiceQuery,
  idParam,
} from '../validators/schemas.js';

export const invoiceRoutes = Router();
invoiceRoutes.use(requireAuth, requireOrg());

invoiceRoutes.get('/', limit(120), validate({ query: listInvoiceQuery }), ctrl.list);
invoiceRoutes.post('/', limit(30), validate({ body: createInvoiceSchema }), requireRole('accountant'), ctrl.create);
invoiceRoutes.get('/:id', limit(120), validate({ params: idParam }), ctrl.getOne);
invoiceRoutes.patch(
  '/:id',
  limit(30),
  validate({ params: idParam, body: updateInvoiceSchema }),
  requireRole('accountant'),
  ctrl.update,
);
invoiceRoutes.post('/:id/send', limit(10), validate({ params: idParam }), requireRole('accountant'), ctrl.send);
invoiceRoutes.post('/:id/mark-paid', limit(30), validate({ params: idParam }), requireRole('accountant'), ctrl.markPaid);
invoiceRoutes.get('/:id/pdf', limit(20), validate({ params: idParam }), ctrl.pdf);
invoiceRoutes.post('/:id/pdf', limit(20), validate({ params: idParam }), ctrl.pdf);
invoiceRoutes.delete('/:id', limit(30), validate({ params: idParam }), requireRole('admin'), ctrl.remove);
