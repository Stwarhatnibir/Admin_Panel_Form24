const ApiError = require('../utils/ApiError');

/**
 * Route-level guard: `authorize(ROLES.SUPER_ADMIN)` only allows Super
 * Admins through. `authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN)` allows both.
 *
 * Must run after `authenticate`, which populates req.admin from Firestore
 * (never from the client). This is the enforcement point referenced
 * throughout the spec's permission tables - every sensitive route must be
 * wrapped with this, not just hidden in the UI.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.admin.role)) {
      return next(ApiError.forbidden());
    }
    next();
  };
}

module.exports = authorize;
