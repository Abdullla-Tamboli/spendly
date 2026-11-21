import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';
import { processDueRecurring } from '../services/recurring.js';

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No token provided', 401, 'NO_TOKEN'));
    }

    const token = authHeader.slice(7);

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Token has expired', 401, 'TOKEN_EXPIRED'));
      }
      return next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    }

    if (typeof payload.sub !== 'string' || !/^[a-f\d]{24}$/i.test(payload.sub)) {
      return next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      return next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    }

    req.user = user;

    // Throttled recurring processor: at most once per hour per user
    const now = Date.now();
    const lastCheck = user.lastRecurringCheck ? user.lastRecurringCheck.getTime() : 0;
    if (now - lastCheck >= ONE_HOUR_MS) {
      // Fire-and-forget; do not block the request
      processDueRecurring(user._id).catch(() => {});
      await User.findByIdAndUpdate(user._id, { lastRecurringCheck: new Date() });
    }

    next();
  } catch (err) {
    next(err);
  }
}
