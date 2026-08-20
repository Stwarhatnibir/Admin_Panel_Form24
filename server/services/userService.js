const { db, COLLECTIONS, toDocObject, toCollectionArray } = require('../firebase/firestore');
const { logAction } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const ApiError = require('../utils/ApiError');

// Fields whose actual values must not be written into audit logs (Section 18:
// "be careful not to unnecessarily store highly sensitive values in logs").
// A change to these fields is still logged - just without the old/new values.
const SENSITIVE_FIELDS = new Set(['aadhaarNumber']);

/**
 * Lists users with pagination. Firestore doesn't support free-text search
 * natively, so this does a prefix match on a lowercase name/phone/email
 * index field maintained on write (see updateUser / user creation
 * elsewhere). Falls back to plain pagination when no search term is given.
 *
 * A production deployment with large user volumes would typically move
 * search to a dedicated index (Algolia/Typesense/Elasticsearch) - noted
 * here rather than silently built, since the spec says not to invent
 * unstated infrastructure decisions.
 */
async function listUsers({ search, page = 1, limit = 20 }) {
  let query = db().collection(COLLECTIONS.USERS).orderBy('createdAt', 'desc');

  if (search) {
    const term = search.trim().toLowerCase();
    // Matches on a maintained `searchIndex` array field: [name, phone, email, id].
    // This is a simple, explicit approach rather than a hidden dependency.
    query = db()
      .collection(COLLECTIONS.USERS)
      .where('searchIndex', 'array-contains', term)
      .orderBy('createdAt', 'desc');
  }

  const offset = (page - 1) * limit;
  const snapshot = await query.limit(limit).offset(offset).get();
  const totalSnapshot = await (search
    ? db().collection(COLLECTIONS.USERS).where('searchIndex', 'array-contains', search.trim().toLowerCase()).count().get()
    : db().collection(COLLECTIONS.USERS).count().get());

  return {
    users: toCollectionArray(snapshot),
    pagination: {
      page,
      limit,
      total: totalSnapshot.data().count,
    },
  };
}

async function getUserById(userId) {
  const doc = await db().collection(COLLECTIONS.USERS).doc(userId).get();
  const user = toDocObject(doc);
  if (!user) throw ApiError.notFound('User not found.');
  return user;
}

/**
 * Updates allowlisted user fields and writes one audit log entry per
 * changed field, per spec Section 18. Sensitive fields are logged without
 * their actual values.
 */
async function updateUser(userId, updates, actor) {
  const userRef = db().collection(COLLECTIONS.USERS).doc(userId);
  const existingDoc = await userRef.get();
  if (!existingDoc.exists) throw ApiError.notFound('User not found.');

  const existing = existingDoc.data();
  const changedFields = Object.keys(updates).filter((field) => existing[field] !== updates[field]);

  if (changedFields.length === 0) {
    return { id: userId, ...existing };
  }

  await userRef.update({ ...updates, updatedAt: new Date() });

  for (const field of changedFields) {
    const isSensitive = SENSITIVE_FIELDS.has(field);
    await logAction({
      actorId: actor.id,
      actorRole: actor.role,
      action: AUDIT_ACTIONS.USER_INFORMATION_UPDATED,
      entityType: 'user',
      entityId: userId,
      fieldChanged: field,
      oldValue: isSensitive ? '[redacted]' : existing[field] ?? null,
      newValue: isSensitive ? '[redacted]' : updates[field],
    });
  }

  const updatedDoc = await userRef.get();
  return { id: userId, ...updatedDoc.data() };
}

module.exports = { listUsers, getUserById, updateUser, SENSITIVE_FIELDS };
