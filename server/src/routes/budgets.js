import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { get, upsert, remove } from '../controllers/budgets.js';
import { upsertBudgetSchema, monthParamSchema, monthQuerySchema } from '../validators/budgets.js';

const router = Router();
router.use(authenticate);

router.get('/', validate({ query: monthQuerySchema }), get);
router.put('/:month', validate({ body: upsertBudgetSchema, params: monthParamSchema }), upsert);
router.delete('/:month', validate({ params: monthParamSchema }), remove);

export default router;
