import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { authenticate } from '../middleware/auth.js';
import { register, sendRegistrationOtp, login, me, logout, updateProfile } from '../controllers/auth.js';
import { registerSchema, sendRegistrationOtpSchema, loginSchema, profileSchema } from '../validators/auth.js';

const router = Router();

router.post('/send-registration-otp', authLimiter, validate({ body: sendRegistrationOtpSchema }), sendRegistrationOtp);
router.post('/register', authLimiter, validate({ body: registerSchema }), register);
router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.get('/me', authenticate, validate(), me);
router.patch('/me', authenticate, validate({ body: profileSchema }), updateProfile);
router.post('/logout', authenticate, validate(), logout);

export default router;
