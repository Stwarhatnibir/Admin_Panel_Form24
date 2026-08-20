const { db, COLLECTIONS, toDocObject, toCollectionArray } = require('../firebase/firestore');
const { logAction } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const ApiError = require('../utils/ApiError');

/**
 * Lists applications with search, status/scheme/date filters, sorting and
 * pagination. Firestore only allows range filters (createdFrom/createdTo)
 * on the same field used for orderBy, so date filtering forces sorting by
 * createdAt regardless of the requested sortBy - this is a Firestore
 * constraint, not a design choice, and is surfaced back in the response
 * so the frontend can reflect the actual applied sort.
 *
 * Applications carry denormalized user/scheme/payment display fields
 * (userName, schemeName, amount, paymentStatus) written at creation time,
 * rather than joining across collections on every list request. Full
 * payment record management lands in Phase 8; for now `paymentStatus` and
 * `amount` are read directly off the application document.
 */
async function listApplications(filters) {
  const { search, status, schemeId, createdFrom, createdTo, sortBy, sortDir, page, limit } = filters;

  let query = db().collection(COLLECTIONS.APPLICATIONS);
  let effectiveSortBy = sortBy;

  if (status) query = query.where('status', '==', status);
  if (schemeId) query = query.where('schemeId', '==', schemeId);

  if (search) {
    const term = search.trim().toLowerCase();
    query = query.where('searchIndex', 'array-contains', term);
  }

  if (createdFrom || createdTo) {
    effectiveSortBy = 'createdAt';
    if (createdFrom) query = query.where('createdAt', '>=', new Date(createdFrom));
    if (createdTo) query = query.where('createdAt', '<=', new Date(createdTo));
  }

  // Count must mirror the same filters, taken before orderBy/limit/offset.
  const countSnapshot = await query.count().get();

  query = query.orderBy(effectiveSortBy, sortDir);

  const offset = (page - 1) * limit;
  const snapshot = await query.limit(limit).offset(offset).get();

  return {
    applications: toCollectionArray(snapshot),
    pagination: { page, limit, total: countSnapshot.data().count },
    appliedSort: { sortBy: effectiveSortBy, sortDir },
  };
}

async function getApplicationById(applicationId) {
  const doc = await db().collection(COLLECTIONS.APPLICATIONS).doc(applicationId).get();
  const application = toDocObject(doc);
  if (!application) throw ApiError.notFound('Application not found.');
  return application;
}

async function updateApplicationStatus(applicationId, newStatus, actor) {
  const ref = db().collection(COLLECTIONS.APPLICATIONS).doc(applicationId);
  const existingDoc = await ref.get();
  if (!existingDoc.exists) throw ApiError.notFound('Application not found.');

  const existing = existingDoc.data();
  if (existing.status === newStatus) {
    return { id: applicationId, ...existing };
  }

  await ref.update({ status: newStatus, updatedAt: new Date() });

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.APPLICATION_STATUS_UPDATED,
    entityType: 'application',
    entityId: applicationId,
    fieldChanged: 'status',
    oldValue: existing.status,
    newValue: newStatus,
  });

  const updatedDoc = await ref.get();
  return { id: applicationId, ...updatedDoc.data() };
}

async function addInternalNote(applicationId, note, actor) {
  const appDoc = await db().collection(COLLECTIONS.APPLICATIONS).doc(applicationId).get();
  if (!appDoc.exists) throw ApiError.notFound('Application not found.');

  const entry = {
    applicationId,
    note,
    createdBy: actor.id,
    createdByName: actor.name,
    createdAt: new Date(),
  };
  const ref = await db().collection(COLLECTIONS.INTERNAL_NOTES).add(entry);

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.INTERNAL_NOTE_ADDED,
    entityType: 'application',
    entityId: applicationId,
  });

  return { id: ref.id, ...entry };
}

async function listInternalNotes(applicationId) {
  const snapshot = await db()
    .collection(COLLECTIONS.INTERNAL_NOTES)
    .where('applicationId', '==', applicationId)
    .orderBy('createdAt', 'desc')
    .get();
  return toCollectionArray(snapshot);
}

module.exports = {
  listApplications,
  getApplicationById,
  updateApplicationStatus,
  addInternalNote,
  listInternalNotes,
};
