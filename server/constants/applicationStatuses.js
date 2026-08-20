// Exactly these seven statuses, per spec Section 15. Deliberately no
// APPROVED/REJECTED - this product does not track that distinction.
const APPLICATION_STATUSES = Object.freeze([
  'NEW',
  'UNDER_REVIEW',
  'INFORMATION_REQUIRED',
  'READY_FOR_FORM_FILLING',
  'FORM_SUBMITTED',
  'COMPLETED',
  'CANCELLED',
]);

module.exports = { APPLICATION_STATUSES };
