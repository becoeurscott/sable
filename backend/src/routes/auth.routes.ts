import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { limit } from '../middleware/rateLimit.js';
import { signupSchema, loginSchema, refreshSchema } from '../validators/schemas.js';

export const authRoutes = Router();

authRoutes.post('/signup', limit(10), validate({ body: signupSchema }), ctrl.signup);
authRoutes.post('/login', limit(10), validate({ body: loginSchema }), ctrl.login);
authRoutes.post('/refresh', limit(30), validate({ body: refreshSchema }), ctrl.refresh);
authRoutes.post('/logout', limit(60), requireAuth, ctrl.logout);
authRoutes.get('/me', limit(60), requireAuth, ctrl.me);
