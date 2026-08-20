// The system has exactly two admin-side roles. Do not add more without a
// corresponding update to every permission check in middleware/authorize.js.
const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
});

module.exports = { ROLES };
