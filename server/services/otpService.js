const { db, COLLECTIONS, toCollectionArray } = require('../firebase/firestore');
const { logAction } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const ApiError = require('../utils/ApiError');

async function assertApplicationExists(applicationId) {
  const doc = await db().collection(COLLECTIONS.APPLICATIONS).doc(applicationId).get();
  if (!doc.exists) throw ApiError.notFound('Application not found.');
}

/**
 * Creates an OTP request record. This deliberately does NOT send an actual
 * SMS/OTP - no SMS gateway is configured (the same "external integration
 * not yet decided" situation as the payment provider, Section 29/54). What
 * IS real: a Firestore record is created and an audit entry is written
 * describing WHICH TYPE of OTP was requested, never a value - matching
 * Section 26 exactly ("Admin requested Government Portal OTP." not
 * "OTP = 123456").
 */
async function createOtpRequest(applicationId, type, actor) {
  await assertApplicationExists(applicationId);

  const entry = {
    applicationId,
    type,
    status: 'REQUESTED',
    requestedBy: actor.id,
    requestedByName: actor.name,
    requestedAt: new Date(),
    verifiedAt: null,
  };
  const ref = await db().collection(COLLECTIONS.OTP_REQUESTS).add(entry);

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.OTP_REQUESTED,
    entityType: 'application',
    entityId: applicationId,
    metadata: { otpType: type },
  });

  return { id: ref.id, ...entry };
}

async function listOtpRequests(applicationId) {
  const snapshot = await db()
    .collection(COLLECTIONS.OTP_REQUESTS)
    .where('applicationId', '==', applicationId)
    .orderBy('requestedAt', 'desc')
    .get();
  return toCollectionArray(snapshot);
}

/**
 * Updates the lifecycle status of an OTP request (e.g. to PROVIDED once the
 * user has responded via chat, or VERIFIED/FAILED/EXPIRED after the admin
 * checks it against the government portal). No field in this data model
 * can ever hold the OTP value itself - see the note in otpValidators.js.
 */
async function updateOtpStatus(otpRequestId, status, actor) {
  const ref = db().collection(COLLECTIONS.OTP_REQUESTS).doc(otpRequestId);
  const doc = await ref.get();
  if (!doc.exists) throw ApiError.notFound('OTP request not found.');

  const updates = { status };
  if (status === 'VERIFIED') updates.verifiedAt = new Date();
  await ref.update(updates);

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.OTP_REQUESTED,
    entityType: 'application',
    entityId: doc.data().applicationId,
    metadata: { otpStatusChangedTo: status },
  });

  const updatedDoc = await ref.get();
  return { id: otpRequestId, ...updatedDoc.data() };
}

module.exports = { createOtpRequest, listOtpRequests, updateOtpStatus };
