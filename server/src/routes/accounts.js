import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { list, create, update, remove } from '../controllers/accounts.js';
import {
  createAccountSchema,
  updateAccountSchema,
  idParamSchema,
} from '../validators/accounts.js';

const router = Router();

router.use(authenticate);

router.get('/', list);
router.post('/', validate({ body: createAccountSchema }), create);
router.put('/:id', validate({ body: updateAccountSchema, params: idParamSchema }), update);
router.delete('/:id', validate({ params: idParamSchema }), remove);

export default router;
