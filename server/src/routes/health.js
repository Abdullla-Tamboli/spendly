import { Router } from 'express';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', validate(), (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'spendly-api',
    },
  });
});

export default router;
