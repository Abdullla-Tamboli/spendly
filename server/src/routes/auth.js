import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { authenticate } from '../middleware/auth.js';
import { register, login, sendOtp, verifyOtp, me, logout, updateProfile } from '../controllers/auth.js';
import { registerSchema, loginSchema, sendOtpSchema, verifyOtpSchema, profileSchema } from '../validators/auth.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), register);
router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.post('/send-otp', authLimiter, validate({ body: sendOtpSchema }), sendOtp);
router.post('/verify-otp', authLimiter, validate({ body: verifyOtpSchema }), verifyOtp);
router.get('/me', authenticate, validate(), me);
router.patch('/me', authenticate, validate({ body: profileSchema }), updateProfile);
router.post('/logout', authenticate, validate(), logout);

export default router;
