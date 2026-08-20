const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Issues a JWT for an authenticated admin. The token payload intentionally
 * carries only an identifier - never the role by itself as a trust anchor.
 * The backend always re-reads the admin's current role/status from
 * Firestore on every request (see middleware/authenticate.js) so a token
 * cannot be used to retain access after a role change or deactivation.
 */
function signAccessToken(adminId) {
  return jwt.sign({ sub: adminId }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

module.exports = { signAccessToken, verifyAccessToken };
