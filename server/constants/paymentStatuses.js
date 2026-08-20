// Per spec Section 29. Full payment record management (creation,
// verification, refund linkage) lands in Phase 8 - applications only
// display/filter by this status in the meantime via a denormalized field.
const PAYMENT_STATUSES = Object.freeze([
  'PENDING',
  'SUCCESSFUL',
  'FAILED',
  'PARTIALLY_REFUNDED',
  'FULLY_REFUNDED',
]);

module.exports = { PAYMENT_STATUSES };
