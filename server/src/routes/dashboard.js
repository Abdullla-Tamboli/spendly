import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { dashboard } from '../controllers/dashboard.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);
router.get('/', validate(), dashboard);

export default router;
