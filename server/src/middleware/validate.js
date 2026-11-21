import AppError from '../utils/AppError.js';

/**
 * Validates req.body, req.query, and req.params against Zod schemas.
 * Replaces the original objects with the parsed (safe) output.
 * Usage: validate({ body: schema, query: schema, params: schema })
 */
export function validate(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          return next(
            new AppError('Validation failed', 400, 'VALIDATION_ERROR', result.error.issues),
          );
        }
        req.body = result.data;
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          return next(
            new AppError('Validation failed', 400, 'VALIDATION_ERROR', result.error.issues),
          );
        }
        req.query = result.data;
      }

      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          return next(
            new AppError('Validation failed', 400, 'VALIDATION_ERROR', result.error.issues),
          );
        }
        req.params = result.data;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
