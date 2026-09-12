const { db, COLLECTIONS, toCollectionArray, toDocObject } = require('../firebase/firestore');
const { getSignedDownloadUrl } = require('../firebase/storage');
const { logAction } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const ApiError = require('../utils/ApiError');

/**
 * Lists documents across ALL applications, for the standalone Documents
 * page (Section 4: "View documents" is its own Admin capability, distinct
 * from the per-application Documents tab built in Phase 6). Supports the
 * same optional status/type filters + pagination pattern used by
 * Applications/Payments/Refunds, always sorted by most recently uploaded.
 */
async function listDocuments({ status, type, applicationId, page = 1, limit = 20 }) {
  let query = db().collection(COLLECTIONS.DOCUMENTS);

  if (status) query = query.where('status', '==', status);
  if (type) query = query.where('type', '==', type);
  if (applicationId) query = query.where('applicationId', '==', applicationId);

  const countSnapshot = await query.count().get();

  query = query.orderBy('uploadedAt', 'desc');
  const offset = (page - 1) * limit;
  const snapshot = await query.limit(limit).offset(offset).get();

  return {
    documents: toCollectionArray(snapshot),
    pagination: { page, limit, total: countSnapshot.data().count },
  };
}

async function listDocumentsForApplication(applicationId) {
  const snapshot = await db()
    .collection(COLLECTIONS.DOCUMENTS)
    .where('applicationId', '==', applicationId)
    .orderBy('uploadedAt', 'desc')
    .get();
  return toCollectionArray(snapshot);
}

async function getDocumentById(documentId) {
  const doc = await db().collection(COLLECTIONS.DOCUMENTS).doc(documentId).get();
  const document = toDocObject(doc);
  if (!document) throw ApiError.notFound('Document not found.');
  return document;
}

/**
 * Returns a short-lived signed URL rather than the document itself - the
 * backend never proxies file bytes through Express, and Storage objects
 * are never public (Section 8/25).
 */
async function getDownloadUrl(documentId) {
  const document = await getDocumentById(documentId);
  const url = await getSignedDownloadUrl(document.storagePath);
  return { url, fileName: document.fileName };
}

/**
 * Marks a document VERIFIED. Every verification action must be audited
 * (Section 25) - done unconditionally here, not left to the caller.
 */
async function verifyDocument(documentId, actor) {
  const ref = db().collection(COLLECTIONS.DOCUMENTS).doc(documentId);
  const doc = await ref.get();
  if (!doc.exists) throw ApiError.notFound('Document not found.');

  await ref.update({ status: 'VERIFIED', verifiedBy: actor.id, verifiedAt: new Date() });

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.DOCUMENT_VERIFIED,
    entityType: 'document',
    entityId: documentId,
    metadata: { applicationId: doc.data().applicationId, documentType: doc.data().type },
  });

  const updatedDoc = await ref.get();
  return { id: documentId, ...updatedDoc.data() };
}

async function requestReupload(documentId, reason, actor) {
  const ref = db().collection(COLLECTIONS.DOCUMENTS).doc(documentId);
  const doc = await ref.get();
  if (!doc.exists) throw ApiError.notFound('Document not found.');

  await ref.update({ status: 'REUPLOAD_REQUIRED', reuploadReason: reason });

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.DOCUMENT_REUPLOAD_REQUESTED,
    entityType: 'document',
    entityId: documentId,
    metadata: { applicationId: doc.data().applicationId, documentType: doc.data().type },
    reason,
  });

  const updatedDoc = await ref.get();
  return { id: documentId, ...updatedDoc.data() };
}

module.exports = { listDocuments, listDocumentsForApplication, getDocumentById, getDownloadUrl, verifyDocument, requestReupload };
