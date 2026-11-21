import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { list, getOne, create, update, remove } from '../controllers/transactions.js';
import { exportCsv } from '../controllers/csv.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
  exportQuerySchema,
  idParamSchema,
} from '../validators/transactions.js';

const router = Router();

router.use(authenticate);

// Export must be registered before /:id to avoid being treated as an id param
router.get('/export', validate({ query: exportQuerySchema }), exportCsv);

router.get('/', validate({ query: listTransactionsQuerySchema }), list);
router.post('/', validate({ body: createTransactionSchema }), create);
router.get('/:id', validate({ params: idParamSchema }), getOne);
router.put('/:id', validate({ body: updateTransactionSchema, params: idParamSchema }), update);
router.delete('/:id', validate({ params: idParamSchema }), remove);

export default router;
