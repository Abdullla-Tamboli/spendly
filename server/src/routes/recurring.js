import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { list, patch, remove } from '../controllers/recurring.js';
import { patchRuleSchema, ruleIdParamSchema } from '../validators/recurring.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(), list);
router.patch('/:id', validate({ body: patchRuleSchema, params: ruleIdParamSchema }), patch);
router.delete('/:id', validate({ params: ruleIdParamSchema }), remove);

export default router;
