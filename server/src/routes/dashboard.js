import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { dashboard } from '../controllers/dashboard.js';

const router = Router();
router.use(authenticate);
router.get('/', dashboard);

export default router;
