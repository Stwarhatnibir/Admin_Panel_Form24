const { verifyAccessToken } = require('../utils/jwt');
const { findAdminById } = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * Verifies the Authorization header, then re-reads the admin record from
 * Firestore on every request.
 *
 * We deliberately do NOT trust the role (or any other claim) baked into the
 * JWT. The token only proves "this is admin id X". The admin's current
 * role and active/inactive status are always read fresh, so:
 *   - a role change by a Super Admin takes effect immediately
 *   - a removed/deactivated admin loses access immediately, even with a
 *     still-valid, unexpired token
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Missing or malformed Authorization header.');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired session. Please log in again.');
  }

  const admin = await findAdminById(payload.sub);

  if (!admin) {
    throw ApiError.unauthorized('Account no longer exists.');
  }

  if (admin.status !== 'ACTIVE') {
    throw ApiError.forbidden('This admin account has been deactivated.');
  }

  const { passwordHash, ...safeAdmin } = admin;
  req.admin = safeAdmin; // { id, name, email, role, status, ... }
  next();
});

module.exports = authenticate;
