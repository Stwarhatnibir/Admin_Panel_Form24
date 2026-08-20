const ApiError = require('../utils/ApiError');

/**
 * Generic request validation middleware powered by a Zod schema.
 * Usage: validateRequest(loginSchema) as a route middleware.
 * Validates req.body by default; pass { source: 'query' | 'params' } to
 * validate elsewhere.
 */
function validateRequest(schema, { source = 'body' } = {}) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(ApiError.badRequest('Validation failed.', details));
    }
    req[source] = result.data;
    next();
  };
}

module.exports = validateRequest;
