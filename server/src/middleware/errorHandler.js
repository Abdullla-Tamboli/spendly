import env from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  // Default to 500
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || [];

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Request body must be valid JSON';
  }
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large';
  }
  if (err.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
  }

  // Zod validation error (from AppError with details array)
  if (code === 'VALIDATION_ERROR' && Array.isArray(err.details)) {
    details = err.details.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }

  // Mongoose CastError (bad ObjectId, etc.)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid value for field: ${err.path}`;
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Data validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token has expired';
  }

  // Never leak stack traces in production
  if (statusCode >= 500 && !err.isOperational) {
    message = 'An unexpected error occurred';
    code = 'INTERNAL_ERROR';
    details = [];
  }
  const response = {
    success: false,
    error: {
      code,
      message,
      ...(details.length > 0 && { details }),
    },
  };

  if (env.NODE_ENV === 'development' && !err.isOperational) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
