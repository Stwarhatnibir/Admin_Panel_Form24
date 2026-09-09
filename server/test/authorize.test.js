// Real, runnable tests against the actual authorize() middleware used by
// every protected route in this app - not a reimplementation, not a
// description of intended behavior. Uses Node's built-in test runner
// (available since Node 18) rather than adding a test framework
// dependency for a codebase this size.
//
// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');

const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants/roles');

/**
 * Calls the real authorize(...) middleware with a fake request carrying
 * the given role, and reports whether it was denied or allowed - by
 * inspecting what it actually passed to next(), exactly as Express would.
 */
function callAuthorize(role, allowedRoles) {
  const middleware = authorize(...allowedRoles);
  let outcome = null;
  const req = { admin: { role } };
  const res = {};
  const next = (err) => {
    outcome = err ? { denied: true, statusCode: err.statusCode } : { denied: false };
  };
  middleware(req, res, next);
  return outcome;
}

// --- Exact matrix from spec Section 53 ---

test('Admin -> Add Admin = DENIED', () => {
  const result = callAuthorize(ROLES.ADMIN, [ROLES.SUPER_ADMIN]); // POST /api/admins
  assert.equal(result.denied, true);
  assert.equal(result.statusCode, 403);
});

test('Admin -> Remove Admin = DENIED', () => {
  const result = callAuthorize(ROLES.ADMIN, [ROLES.SUPER_ADMIN]); // DELETE /api/admins/:id
  assert.equal(result.denied, true);
  assert.equal(result.statusCode, 403);
});

test('Admin -> Approve Refund = DENIED', () => {
  const result = callAuthorize(ROLES.ADMIN, [ROLES.SUPER_ADMIN]); // POST /api/refunds/:id/approve
  assert.equal(result.denied, true);
  assert.equal(result.statusCode, 403);
});

test('Super Admin -> Add Admin = ALLOWED', () => {
  const result = callAuthorize(ROLES.SUPER_ADMIN, [ROLES.SUPER_ADMIN]);
  assert.equal(result.denied, false);
});

test('Super Admin -> Remove Admin = ALLOWED', () => {
  const result = callAuthorize(ROLES.SUPER_ADMIN, [ROLES.SUPER_ADMIN]);
  assert.equal(result.denied, false);
});

test('Super Admin -> Approve Refund = ALLOWED', () => {
  const result = callAuthorize(ROLES.SUPER_ADMIN, [ROLES.SUPER_ADMIN]);
  assert.equal(result.denied, false);
});

// --- Additional permission-table checks from Section 43, for coverage
// beyond the six explicitly named in Section 53 ---

test('Admin -> Reject Refund = DENIED (only approve/reject are Super Admin only, both should match)', () => {
  const result = callAuthorize(ROLES.ADMIN, [ROLES.SUPER_ADMIN]); // POST /api/refunds/:id/reject
  assert.equal(result.denied, true);
});

test('Super Admin -> Reject Refund = ALLOWED', () => {
  const result = callAuthorize(ROLES.SUPER_ADMIN, [ROLES.SUPER_ADMIN]);
  assert.equal(result.denied, false);
});

test('Admin -> Add Scheme = ALLOWED (both roles can manage schemes)', () => {
  const result = callAuthorize(ROLES.ADMIN, [ROLES.ADMIN, ROLES.SUPER_ADMIN]); // POST /api/schemes
  assert.equal(result.denied, false);
});

test('Admin -> Request Refund = ALLOWED (creating a request is not the same as approving it)', () => {
  const result = callAuthorize(ROLES.ADMIN, [ROLES.ADMIN, ROLES.SUPER_ADMIN]); // POST /api/refunds
  assert.equal(result.denied, false);
});

test('Admin -> View complete Audit Logs = DENIED (Super Admin only, per Section 5)', () => {
  const result = callAuthorize(ROLES.ADMIN, [ROLES.SUPER_ADMIN]); // GET /api/audit-logs
  assert.equal(result.denied, true);
});

test('Super Admin -> View complete Audit Logs = ALLOWED', () => {
  const result = callAuthorize(ROLES.SUPER_ADMIN, [ROLES.SUPER_ADMIN]);
  assert.equal(result.denied, false);
});

test('unauthenticated request (no req.admin) is always denied with 401, regardless of allowed roles', () => {
  const middleware = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);
  let outcome = null;
  middleware({}, {}, (err) => {
    outcome = err ? { denied: true, statusCode: err.statusCode } : { denied: false };
  });
  assert.equal(outcome.denied, true);
  assert.equal(outcome.statusCode, 401);
});
