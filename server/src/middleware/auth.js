import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';
import { checkRecurring } from '../services/recurring.js';

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

    await checkRecurring(user._id);

    next();
  } catch (err) {
    next(err);
  }
}
