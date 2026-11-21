import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { analytics } from '../controllers/analytics.js';
import { analyticsQuerySchema } from '../validators/analytics.js';

const router = Router();
router.use(authenticate);
router.get('/', validate({ query: analyticsQuerySchema }), analytics);

export default router;
