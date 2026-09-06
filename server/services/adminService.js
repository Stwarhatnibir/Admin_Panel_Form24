const { db, COLLECTIONS, toCollectionArray } = require('../firebase/firestore');
const { hashPassword } = require('../utils/password');
const { findAdminByEmail } = require('./authService');
const { logAction } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const { ROLES } = require('../constants/roles');
const ApiError = require('../utils/ApiError');

async function listAdmins() {
  const snapshot = await db().collection(COLLECTIONS.ADMINS).orderBy('createdAt', 'desc').get();
  // Never return password hashes to the client, even to a Super Admin.
  return snapshot.docs.map((doc) => {
    const { passwordHash, ...safe } = doc.data();
    return { id: doc.id, ...safe };
  });
}

async function createAdmin({ name, email, password, role }, actor) {
  const existing = await findAdminByEmail(email);
  if (existing) {
    throw ApiError.conflict('An admin with this email already exists.');
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();
  const entry = {
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
    status: 'ACTIVE',
    createdAt: now,
    lastActiveAt: null,
  };
  const ref = await db().collection(COLLECTIONS.ADMINS).add(entry);

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.ADMIN_CREATED,
    entityType: 'admin',
    entityId: ref.id,
    metadata: { name, email: entry.email, role },
  });

  const { passwordHash: _discard, ...safe } = entry;
  return { id: ref.id, ...safe };
}

/**
 * Removing an admin sets status to REMOVED rather than deleting the
 * Firestore document. This is deliberate: the authenticate middleware
 * already rejects any non-ACTIVE admin on every request (see
 * middleware/authenticate.js from Phase 1), so this immediately revokes
 * access - matching the confirmation dialog's "This will revoke admin
 * access" wording - while preserving the admin's id as a valid actorId
 * reference in existing audit log entries. Hard-deleting would orphan
 * every audit entry that admin ever created.
 */
async function removeAdmin(adminId, actor) {
  if (adminId === actor.id) {
    throw ApiError.badRequest('You cannot remove your own admin account.');
  }

  const ref = db().collection(COLLECTIONS.ADMINS).doc(adminId);
  const doc = await ref.get();
  if (!doc.exists) throw ApiError.notFound('Admin not found.');

  const target = doc.data();

  if (target.role === ROLES.SUPER_ADMIN && target.status === 'ACTIVE') {
    const remainingSuperAdmins = await db()
      .collection(COLLECTIONS.ADMINS)
      .where('role', '==', ROLES.SUPER_ADMIN)
      .where('status', '==', 'ACTIVE')
      .get();
    if (remainingSuperAdmins.size <= 1) {
      throw ApiError.badRequest('Cannot remove the last active Super Admin - this would lock out admin management.');
    }
  }

  await ref.update({ status: 'REMOVED' });

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.ADMIN_REMOVED,
    entityType: 'admin',
    entityId: adminId,
    metadata: { name: target.name, email: target.email },
  });

  return { id: adminId, removed: true };
}

module.exports = { listAdmins, createAdmin, removeAdmin };
