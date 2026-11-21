import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { authenticate } from '../middleware/auth.js';
import { register, login, me, logout } from '../controllers/auth.js';
import { registerSchema, loginSchema } from '../validators/auth.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), register);
router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

export default router;
