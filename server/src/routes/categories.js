import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { list, create, update, remove } from '../controllers/categories.js';
import {
  createCategorySchema,
  updateCategorySchema,
  idParamSchema,
} from '../validators/categories.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(), list);
router.post('/', validate({ body: createCategorySchema }), create);
router.put('/:id', validate({ body: updateCategorySchema, params: idParamSchema }), update);
router.delete('/:id', validate({ params: idParamSchema }), remove);

export default router;
