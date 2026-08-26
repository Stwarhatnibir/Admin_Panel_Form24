const { db, COLLECTIONS, toCollectionArray, toDocObject } = require('../firebase/firestore');
const { getPaymentProvider } = require('./payment');
const { findRefundablePaymentForApplication } = require('./paymentService');
const { logAction } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const ApiError = require('../utils/ApiError');

/**
 * Sums COMPLETED refunds already issued against a payment, so a new
 * request (and later, its approval) can never push total refunds past the
 * original payment amount. Deliberately excludes PENDING_APPROVAL/APPROVED
 * requests from this sum - two pending requests for the same payment can
 * both exist, but only one can ever be approved without the second being
 * caught by this same check re-run at approval time.
 */
async function getAlreadyRefundedAmount(paymentId) {
  const snapshot = await db()
    .collection(COLLECTIONS.REFUND_REQUESTS)
    .where('paymentId', '==', paymentId)
    .where('status', '==', 'COMPLETED')
    .get();
  return snapshot.docs.reduce((sum, doc) => sum + (doc.data().requestedAmount || 0), 0);
}

/**
 * Creates a refund request. Per spec Section 17/18/30: any Admin or Super
 * Admin can create one; only a Super Admin can later approve/reject it
 * (enforced in the routes via authorize(), not here - this function
 * doesn't know or care who's allowed to call it, that's the router's job).
 */
async function createRefundRequest(applicationId, { refundType, requestedAmount, reason }, actor) {
  const payment = await findRefundablePaymentForApplication(applicationId);
  if (!payment) {
    throw ApiError.badRequest('No successful payment found for this application to refund.');
  }

  const alreadyRefunded = await getAlreadyRefundedAmount(payment.id);
  const refundableAmount = payment.amount - alreadyRefunded;

  if (requestedAmount <= 0) {
    throw ApiError.badRequest('Refund amount must be greater than zero.');
  }
  if (requestedAmount > refundableAmount) {
    throw ApiError.badRequest(
      `Refund amount (₹${requestedAmount}) exceeds the refundable balance (₹${refundableAmount}) on this payment.`
    );
  }

  const entry = {
    applicationId,
    userId: payment.userId,
    paymentId: payment.id,
    requestedAmount,
    refundType,
    reason,
    requestedBy: actor.id,
    requestedByName: actor.name,
    status: 'PENDING_APPROVAL',
    createdAt: new Date(),
    decidedBy: null,
    decidedAt: null,
    rejectionReason: null,
  };
  const ref = await db().collection(COLLECTIONS.REFUND_REQUESTS).add(entry);

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.REFUND_REQUESTED,
    entityType: 'application',
    entityId: applicationId,
    metadata: { refundId: ref.id, requestedAmount, refundType },
  });

  return { id: ref.id, ...entry };
}

async function listRefundRequests({ status, applicationId, page = 1, limit = 20 }) {
  let query = db().collection(COLLECTIONS.REFUND_REQUESTS);

  if (status) query = query.where('status', '==', status);
  if (applicationId) query = query.where('applicationId', '==', applicationId);

  const countSnapshot = await query.count().get();

  query = query.orderBy('createdAt', 'desc');
  const offset = (page - 1) * limit;
  const snapshot = await query.limit(limit).offset(offset).get();

  return {
    refunds: toCollectionArray(snapshot),
    pagination: { page, limit, total: countSnapshot.data().count },
  };
}

async function getRefundRequestById(refundId) {
  const doc = await db().collection(COLLECTIONS.REFUND_REQUESTS).doc(refundId).get();
  const refund = toDocObject(doc);
  if (!refund) throw ApiError.notFound('Refund request not found.');
  return refund;
}

/**
 * Approves a refund. Re-validates the refundable balance at approval time
 * (not just at request time) since another refund could have been
 * completed in between. Calls the PaymentProvider abstraction to actually
 * issue the refund - with the mock provider this always "succeeds"; with a
 * real provider later, a failure here would leave the refund in FAILED
 * rather than COMPLETED, without any change to this function.
 */
async function approveRefundRequest(refundId, actor) {
  const ref = db().collection(COLLECTIONS.REFUND_REQUESTS).doc(refundId);
  const doc = await ref.get();
  if (!doc.exists) throw ApiError.notFound('Refund request not found.');

  const refund = doc.data();
  if (refund.status !== 'PENDING_APPROVAL') {
    throw ApiError.conflict(`This refund request is already ${refund.status.toLowerCase()}.`);
  }

  const paymentRef = db().collection(COLLECTIONS.PAYMENTS).doc(refund.paymentId);
  const paymentDoc = await paymentRef.get();
  if (!paymentDoc.exists) throw ApiError.notFound('The original payment for this refund no longer exists.');
  const payment = { id: paymentDoc.id, ...paymentDoc.data() };

  const alreadyRefunded = await getAlreadyRefundedAmount(payment.id);
  const refundableAmount = payment.amount - alreadyRefunded;
  if (refund.requestedAmount > refundableAmount) {
    throw ApiError.conflict(
      `This refund can no longer be approved - only ₹${refundableAmount} remains refundable on this payment.`
    );
  }

  await ref.update({ status: 'PROCESSING', decidedBy: actor.id, decidedAt: new Date() });

  const provider = getPaymentProvider();
  const result = await provider.createRefund(payment, refund.requestedAmount);

  const finalStatus = result.success ? 'COMPLETED' : 'FAILED';
  await ref.update({ status: finalStatus, providerRefundId: result.providerRefundId || null });

  if (result.success) {
    const newTotalRefunded = alreadyRefunded + refund.requestedAmount;
    const newPaymentStatus = newTotalRefunded >= payment.amount ? 'FULLY_REFUNDED' : 'PARTIALLY_REFUNDED';
    await paymentRef.update({ status: newPaymentStatus, updatedAt: new Date() });

    // Keep the application's denormalized paymentStatus in sync (Phase 4's
    // applications carry this field for list/filter display - see
    // applicationService.js).
    await db()
      .collection(COLLECTIONS.APPLICATIONS)
      .doc(refund.applicationId)
      .update({ paymentStatus: newPaymentStatus, updatedAt: new Date() });
  }

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.REFUND_APPROVED,
    entityType: 'application',
    entityId: refund.applicationId,
    metadata: { refundId, resultStatus: finalStatus },
  });

  const updatedDoc = await ref.get();
  return { id: refundId, ...updatedDoc.data() };
}

async function rejectRefundRequest(refundId, reason, actor) {
  const ref = db().collection(COLLECTIONS.REFUND_REQUESTS).doc(refundId);
  const doc = await ref.get();
  if (!doc.exists) throw ApiError.notFound('Refund request not found.');

  const refund = doc.data();
  if (refund.status !== 'PENDING_APPROVAL') {
    throw ApiError.conflict(`This refund request is already ${refund.status.toLowerCase()}.`);
  }

  await ref.update({ status: 'REJECTED', decidedBy: actor.id, decidedAt: new Date(), rejectionReason: reason });

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.REFUND_REJECTED,
    entityType: 'application',
    entityId: refund.applicationId,
    metadata: { refundId },
    reason,
  });

  const updatedDoc = await ref.get();
  return { id: refundId, ...updatedDoc.data() };
}

module.exports = {
  createRefundRequest,
  listRefundRequests,
  getRefundRequestById,
  approveRefundRequest,
  rejectRefundRequest,
};
