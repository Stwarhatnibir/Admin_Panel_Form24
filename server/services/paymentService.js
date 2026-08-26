// Payment creation/verification happens in the user-facing app's backend
// flow (out of scope here - "backend verifies payment" per spec Section 4,
// but that backend is the existing application, not this admin panel).
// This admin panel only ever READS payment records and, through
// refundService.js, initiates refunds against them via the PaymentProvider
// abstraction.
const { db, COLLECTIONS, toCollectionArray, toDocObject } = require('../firebase/firestore');
const ApiError = require('../utils/ApiError');

async function listPayments({ status, applicationId, page = 1, limit = 20 }) {
  let query = db().collection(COLLECTIONS.PAYMENTS);

  if (status) query = query.where('status', '==', status);
  if (applicationId) query = query.where('applicationId', '==', applicationId);

  const countSnapshot = await query.count().get();

  query = query.orderBy('createdAt', 'desc');
  const offset = (page - 1) * limit;
  const snapshot = await query.limit(limit).offset(offset).get();

  return {
    payments: toCollectionArray(snapshot),
    pagination: { page, limit, total: countSnapshot.data().count },
  };
}

async function getPaymentById(paymentId) {
  const doc = await db().collection(COLLECTIONS.PAYMENTS).doc(paymentId).get();
  const payment = toDocObject(doc);
  if (!payment) throw ApiError.notFound('Payment not found.');
  return payment;
}

/** Finds the payment a refund should be created against for an application. */
async function findRefundablePaymentForApplication(applicationId) {
  const snapshot = await db()
    .collection(COLLECTIONS.PAYMENTS)
    .where('applicationId', '==', applicationId)
    .where('status', 'in', ['SUCCESSFUL', 'PARTIALLY_REFUNDED'])
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

module.exports = { listPayments, getPaymentById, findRefundablePaymentForApplication };
