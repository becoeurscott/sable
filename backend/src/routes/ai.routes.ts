import { Router } from 'express';
import * as ctrl from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireOrg } from '../middleware/orgContext.js';
import { validate } from '../middleware/validate.js';
import { limit } from '../middleware/rateLimit.js';
import { chatSchema, categorizeSchema, nlSearchSchema, parseReceiptSchema } from '../validators/schemas.js';

export const aiRoutes = Router();
aiRoutes.use(requireAuth, requireOrg());

aiRoutes.post('/chat', limit(20), validate({ body: chatSchema }), ctrl.chat);
aiRoutes.get('/chat/history', limit(30), ctrl.history);
aiRoutes.post('/categorize', limit(60), validate({ body: categorizeSchema }), ctrl.categorize);
aiRoutes.post('/parse-receipt', limit(30), validate({ body: parseReceiptSchema }), ctrl.parseReceipt);
aiRoutes.post('/search', limit(20), validate({ body: nlSearchSchema }), ctrl.search);
aiRoutes.get('/forecast', limit(10), ctrl.forecast);
aiRoutes.get('/health-score', limit(5), ctrl.healthScore);
