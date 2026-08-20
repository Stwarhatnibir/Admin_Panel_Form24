// Thin Firestore access layer. Keeping this centralized means:
//  - collection names are defined once (see COLLECTIONS)
//  - every service gets the same timestamp/pagination conventions
//  - swapping the underlying data store later only touches this file
const { admin, assertConfigured } = require('./firebaseAdmin');

const COLLECTIONS = Object.freeze({
  ADMINS: 'admins',
  USERS: 'users',
  APPLICATIONS: 'applications',
  SCHEMES: 'schemes',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  DOCUMENTS: 'documents',
  INFORMATION_REQUESTS: 'informationRequests',
  OTP_REQUESTS: 'otpRequests',
  PAYMENTS: 'payments',
  REFUND_REQUESTS: 'refundRequests',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'auditLogs',
  INTERNAL_NOTES: 'internalNotes',
});

function db() {
  assertConfigured();
  return admin.firestore();
}

function serverTimestamp() {
  assertConfigured();
  return admin.firestore.FieldValue.serverTimestamp();
}

/** Converts a Firestore doc snapshot into a plain object with `id` included. */
function toDocObject(doc) {
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

/** Converts a QuerySnapshot into an array of plain objects with `id`. */
function toCollectionArray(snapshot) {
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

module.exports = {
  COLLECTIONS,
  db,
  serverTimestamp,
  toDocObject,
  toCollectionArray,
};
