// Aggregates counts for the dashboard stat cards. Each count is a real
// Firestore query - if a collection does not exist yet (e.g. no
// applications have been created because that part of the system isn't
// built yet), Firestore simply returns an empty result and the count is 0.
// Nothing here is mocked or hardcoded.
const { db, COLLECTIONS } = require('../firebase/firestore');

async function countWhere(collection, field, op, value) {
  const query = field ? db().collection(collection).where(field, op, value) : db().collection(collection);
  const snapshot = await query.count().get();
  return snapshot.data().count;
}

async function getDashboardStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalApplications,
    applicationsToday,
    pendingInfoRequests,
    pendingDocuments,
    openConversations,
    pendingRefunds,
    successfulPayments,
  ] = await Promise.all([
    countWhere(COLLECTIONS.USERS),
    countWhere(COLLECTIONS.APPLICATIONS),
    countWhere(COLLECTIONS.APPLICATIONS, 'createdAt', '>=', startOfToday),
    countWhere(COLLECTIONS.INFORMATION_REQUESTS, 'status', '==', 'PENDING'),
    countWhere(COLLECTIONS.DOCUMENTS, 'status', '==', 'PENDING'),
    countWhere(COLLECTIONS.CONVERSATIONS, 'state', '==', 'OPEN'),
    countWhere(COLLECTIONS.REFUND_REQUESTS, 'status', '==', 'PENDING_APPROVAL'),
    countWhere(COLLECTIONS.PAYMENTS, 'status', '==', 'SUCCESSFUL'),
  ]);

  // Revenue requires summing amounts, not just counting documents, so it's
  // handled separately. For large collections this should move to a
  // maintained aggregate/rollup document rather than summing on every
  // request - left as a documented follow-up rather than a premature
  // optimization here.
  const paymentsSnapshot = await db()
    .collection(COLLECTIONS.PAYMENTS)
    .where('status', '==', 'SUCCESSFUL')
    .get();
  const revenue = paymentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

  return {
    totalUsers,
    totalApplications,
    applicationsToday,
    revenue,
    pendingInformationRequests: pendingInfoRequests,
    pendingDocuments,
    openConversations,
    pendingRefundRequests: pendingRefunds,
    successfulPaymentsCount: successfulPayments,
  };
}

module.exports = { getDashboardStats };
