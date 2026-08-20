const { db, COLLECTIONS, toDocObject } = require('../firebase/firestore');
const { verifyPassword } = require('../utils/password');
const { signAccessToken } = require('../utils/jwt');
const { logAction } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const ApiError = require('../utils/ApiError');

/** Finds an admin document by email. Returns null if not found. */
async function findAdminByEmail(email) {
  const snapshot = await db()
    .collection(COLLECTIONS.ADMINS)
    .where('email', '==', email.toLowerCase().trim())
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

/** Finds an admin document by id. Returns null if not found. */
async function findAdminById(adminId) {
  const doc = await db().collection(COLLECTIONS.ADMINS).doc(adminId).get();
  return toDocObject(doc);
}

/**
 * Verifies credentials, checks the account is active, issues a JWT, and
 * writes an audit log for both success and failure so repeated failed
 * logins are visible to Super Admins.
 */
async function login({ email, password }, requestMeta = {}) {
  const admin = await findAdminByEmail(email);

  if (!admin) {
    // Do not reveal whether the email exists - generic message either way.
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const passwordMatches = await verifyPassword(password, admin.passwordHash);

  if (!passwordMatches) {
    await logAction({
      actorId: admin.id,
      actorRole: admin.role,
      action: AUDIT_ACTIONS.ADMIN_LOGIN_FAILED,
      entityType: 'admin',
      entityId: admin.id,
      metadata: { ip: requestMeta.ip || null },
    });
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (admin.status !== 'ACTIVE') {
    throw ApiError.forbidden('This admin account has been deactivated.');
  }

  const token = signAccessToken(admin.id);

  await db().collection(COLLECTIONS.ADMINS).doc(admin.id).update({
    lastActiveAt: new Date(),
  });

  await logAction({
    actorId: admin.id,
    actorRole: admin.role,
    action: AUDIT_ACTIONS.ADMIN_LOGIN,
    entityType: 'admin',
    entityId: admin.id,
    metadata: { ip: requestMeta.ip || null },
  });

  const { passwordHash, ...safeAdmin } = admin;
  return { token, admin: safeAdmin };
}

module.exports = { findAdminByEmail, findAdminById, login };
