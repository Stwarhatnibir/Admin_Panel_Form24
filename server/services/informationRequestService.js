const { db, COLLECTIONS, toCollectionArray, toDocObject } = require('../firebase/firestore');
const { logAction } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const ApiError = require('../utils/ApiError');

async function getApplicationOrThrow(applicationId) {
  const doc = await db().collection(COLLECTIONS.APPLICATIONS).doc(applicationId).get();
  if (!doc.exists) throw ApiError.notFound('Application not found.');
  return { id: doc.id, ...doc.data() };
}

/**
 * Creates an information request (text or structured) against an
 * application. The user responds through the existing chat/application
 * flow (Section 23) - this admin panel only creates the request and later
 * displays whatever response arrives via `userResponse`/`respondedAt`,
 * which are written by whatever process receives that response (the
 * user-facing app, out of scope here). For now this admin panel exposes no
 * endpoint that fabricates a user response - that field simply stays empty
 * until the real system writes it.
 */
async function createInformationRequest(applicationId, payload, actor) {
  const application = await getApplicationOrThrow(applicationId);

  const entry = {
    applicationId,
    userId: application.userId,
    requestedBy: actor.id,
    requestedByName: actor.name,
    type: payload.type,
    content: payload.type === 'TEXT' ? payload.content : null,
    fields: payload.type === 'STRUCTURED' ? payload.fields : null,
    status: 'PENDING',
    createdAt: new Date(),
    userResponse: null,
    respondedAt: null,
  };

  const ref = await db().collection(COLLECTIONS.INFORMATION_REQUESTS).add(entry);

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.INFORMATION_REQUEST_CREATED,
    entityType: 'application',
    entityId: applicationId,
    metadata: { requestType: payload.type },
  });

  return { id: ref.id, ...entry };
}

async function listInformationRequests(applicationId) {
  const snapshot = await db()
    .collection(COLLECTIONS.INFORMATION_REQUESTS)
    .where('applicationId', '==', applicationId)
    .orderBy('createdAt', 'desc')
    .get();
  return toCollectionArray(snapshot);
}

module.exports = { createInformationRequest, listInformationRequests };
