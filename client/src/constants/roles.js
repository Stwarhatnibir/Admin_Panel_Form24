// Mirrors server/constants/roles.js. Kept in sync manually since frontend
// and backend are separate deployables; if this ever drifts, the backend
// is always the source of truth for what's actually permitted.
export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
});
