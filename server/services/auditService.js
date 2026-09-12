// Every important admin action is written here. This is intentionally a
// single, narrow entry point - controllers/services should call `logAction`
// rather than writing to the auditLogs collection directly, so the shape
// of an audit entry stays consistent everywhere.
const { db, COLLECTIONS, serverTimestamp, toCollectionArray } = require('../firebase/firestore');

/**
 * @param {Object} params
 * @param {string} params.actorId - id of the admin who performed the action
 * @param {string} params.actorRole - ADMIN | SUPER_ADMIN
 * @param {string} params.action - one of constants/auditActions.js
 * @param {string} params.entityType - e.g. 'application', 'user', 'scheme'
 * @param {string} [params.entityId]
 * @param {Object} [params.metadata] - free-form extra context. Must never
 *   contain passwords, JWTs, raw OTP values, or other secrets - callers are
 *   responsible for scrubbing sensitive fields before calling this.
 * @param {*} [params.oldValue]
 * @param {*} [params.newValue]
 * @param {string} [params.fieldChanged]
 * @param {string} [params.reason]
 */
async function logAction({
  actorId,
  actorRole,
  action,
  entityType,
  entityId = null,
  metadata = {},
  oldValue = undefined,
  newValue = undefined,
  fieldChanged = undefined,
  reason = undefined,
}) {
  const entry = {
    actorId,
    actorRole,
    action,
    entityType,
    entityId,
    metadata,
    timestamp: serverTimestamp(),
  };
  if (fieldChanged !== undefined) entry.fieldChanged = fieldChanged;
  if (oldValue !== undefined) entry.oldValue = oldValue;
  if (newValue !== undefined) entry.newValue = newValue;
  if (reason !== undefined) entry.reason = reason;

  await db().collection(COLLECTIONS.AUDIT_LOGS).add(entry);
}

/**
 * Lists audit logs with optional filters, newest first, paginated.
 *
 * The general-purpose Audit Logs page (Section 33/34) restricts its UI to
 * filtering by at most one of {actorId, action, entityType+entityId} at a
 * time, always combinable with a date range - this keeps the set of
 * Firestore composite indexes bounded and enumerable rather than needing
 * one for every possible combination of independent filters (the same
 * approach taken for Applications/Payments/Refunds list queries). Passing
 * more than one non-date filter at once is not validated against here
 * (this function stays a thin, generic query builder) but the frontend
 * never does it - see AuditLogs.jsx.
 *
 * @param {Object} filters
 * @param {string} [filters.actorId]
 * @param {string} [filters.action]
 * @param {string} [filters.entityType]
 * @param {string} [filters.entityId]
 * @param {string} [filters.dateFrom] - ISO date string
 * @param {string} [filters.dateTo] - ISO date string
 * @param {number} [filters.page]
 * @param {number} [filters.limit]
 */
async function listAuditLogs(filters = {}) {
  const { actorId, action, entityType, entityId, dateFrom, dateTo, page = 1, limit = 25 } = filters;
  let query = db().collection(COLLECTIONS.AUDIT_LOGS);

  if (actorId) query = query.where('actorId', '==', actorId);
  if (action) query = query.where('action', '==', action);
  if (entityType) query = query.where('entityType', '==', entityType);
  if (entityId) query = query.where('entityId', '==', entityId);
  if (dateFrom) query = query.where('timestamp', '>=', new Date(dateFrom));
  if (dateTo) query = query.where('timestamp', '<=', new Date(dateTo));

  const countSnapshot = await query.count().get();

  query = query.orderBy('timestamp', 'desc');
  const boundedLimit = Math.min(limit, 100);
  const offset = (page - 1) * boundedLimit;
  const snapshot = await query.limit(boundedLimit).offset(offset).get();

  return {
    logs: toCollectionArray(snapshot),
    pagination: { page, limit: boundedLimit, total: countSnapshot.data().count },
  };
}

module.exports = { logAction, listAuditLogs };
