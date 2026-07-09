import { Router } from 'express';
import * as ctrl from '../controllers/organization.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireOrg } from '../middleware/orgContext.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { limit } from '../middleware/rateLimit.js';
import { createOrgSchema, updateOrgSchema, inviteSchema, idParam, memberParam } from '../validators/schemas.js';

export const orgRoutes = Router();
orgRoutes.use(requireAuth);

orgRoutes.post('/', limit(5), validate({ body: createOrgSchema }), ctrl.create);
orgRoutes.get('/', limit(60), ctrl.listMine);

const inOrg = requireOrg({ param: 'id' });

orgRoutes.get('/:id', limit(60), validate({ params: idParam }), inOrg, ctrl.get);
orgRoutes.patch(
  '/:id',
  limit(20),
  validate({ params: idParam, body: updateOrgSchema }),
  inOrg,
  requireRole('admin'),
  ctrl.update,
);
orgRoutes.delete('/:id', limit(2), validate({ params: idParam }), inOrg, requireRole('owner'), ctrl.remove);

orgRoutes.get('/:id/members', limit(60), validate({ params: idParam }), inOrg, ctrl.members);
orgRoutes.post(
  '/:id/invite',
  limit(20),
  validate({ params: idParam, body: inviteSchema }),
  inOrg,
  requireRole('admin'),
  ctrl.invite,
);
orgRoutes.delete(
  '/:id/members/:userId',
  limit(20),
  validate({ params: memberParam }),
  inOrg,
  requireRole('admin'),
  ctrl.removeMember,
);
