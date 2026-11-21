import rateLimit from 'express-rate-limit';

const standardError = (statusCode, code, message) => (_req, res) => {
  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
};

/** 10 requests per 15 minutes — applied to auth routes */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.'),
});

/** 300 requests per 15 minutes — applied to all other API routes */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.'),
});
