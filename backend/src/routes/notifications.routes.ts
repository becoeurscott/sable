import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { limit } from '../middleware/rateLimit.js';
import { idParam } from '../validators/schemas.js';

export const notificationRoutes = Router();
notificationRoutes.use(requireAuth);

notificationRoutes.get('/', limit(60), ctrl.list);
notificationRoutes.post('/:id/read', limit(60), validate({ params: idParam }), ctrl.read);
