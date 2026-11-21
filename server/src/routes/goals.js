import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { list, create, update, contribute, remove } from '../controllers/goals.js';
import {
  createGoalSchema,
  updateGoalSchema,
  contributeSchema,
  goalIdParamSchema,
} from '../validators/goals.js';

const router = Router();
router.use(authenticate);

router.get('/', list);
router.post('/', validate({ body: createGoalSchema }), create);
router.put('/:id', validate({ body: updateGoalSchema, params: goalIdParamSchema }), update);
router.patch(
  '/:id/contribute',
  validate({ body: contributeSchema, params: goalIdParamSchema }),
  contribute,
);
router.delete('/:id', validate({ params: goalIdParamSchema }), remove);

export default router;
