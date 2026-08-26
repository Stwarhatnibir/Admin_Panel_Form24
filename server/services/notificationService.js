const { db, COLLECTIONS, toCollectionArray, toDocObject } = require('../firebase/firestore');
const { sendToToken } = require('../firebase/messaging');
const { logAction } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const ApiError = require('../utils/ApiError');

/** Resolves the list of user documents a notification should go to. */
async function resolveRecipients(payload) {
  if (payload.recipientType === 'INDIVIDUAL') {
    const doc = await db().collection(COLLECTIONS.USERS).doc(payload.recipientId).get();
    if (!doc.exists) throw ApiError.notFound('Recipient user not found.');
    return [{ id: doc.id, ...doc.data() }];
  }

  if (payload.recipientType === 'GROUP') {
    const docs = await Promise.all(payload.recipientIds.map((id) => db().collection(COLLECTIONS.USERS).doc(id).get()));
    const missing = docs.filter((d) => !d.exists);
    if (missing.length > 0) {
      throw ApiError.badRequest(`${missing.length} selected recipient(s) could not be found.`);
    }
    return docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // EVERYONE - fetches the full users collection. Fine at the user counts
  // this admin panel is built for; a very large user base would want this
  // paginated/batched rather than loaded in one request - noted here
  // rather than silently building a scale ceiling into the feature.
  const snapshot = await db().collection(COLLECTIONS.USERS).get();
  return toCollectionArray(snapshot);
}

/**
 * Creates a notification record and attempts real delivery to every
 * resolved recipient that has a registered FCM token. Recipients without
 * one are honestly counted as "skipped", not silently dropped or falsely
 * reported as delivered - see the doc comment in firebase/messaging.js for
 * why most/all seed users will fall into that bucket.
 */
async function createAndSendNotification(payload, actor) {
  const recipients = await resolveRecipients(payload);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of recipients) {
    if (!user.fcmToken) {
      skipped += 1;
      continue;
    }
    const result = await sendToToken(user.fcmToken, {
      title: payload.title,
      body: payload.message,
      data: payload.relatedApplicationId ? { applicationId: payload.relatedApplicationId } : {},
    });
    if (result.success) sent += 1;
    else failed += 1;
  }

  const entry = {
    recipientType: payload.recipientType,
    recipientIds: recipients.map((u) => u.id),
    recipientCount: recipients.length,
    title: payload.title,
    message: payload.message,
    relatedApplicationId: payload.relatedApplicationId || null,
    createdBy: actor.id,
    createdByName: actor.name,
    createdAt: new Date(),
    deliveryStatus: { totalRecipients: recipients.length, sent, skipped, failed },
  };
  const ref = await db().collection(COLLECTIONS.NOTIFICATIONS).add(entry);

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.NOTIFICATION_SENT,
    entityType: 'notification',
    entityId: ref.id,
    metadata: { recipientType: payload.recipientType, recipientCount: recipients.length, sent, skipped, failed },
  });

  return { id: ref.id, ...entry };
}

async function listNotifications({ page = 1, limit = 20 }) {
  const query = db().collection(COLLECTIONS.NOTIFICATIONS).orderBy('createdAt', 'desc');
  const countSnapshot = await db().collection(COLLECTIONS.NOTIFICATIONS).count().get();
  const offset = (page - 1) * limit;
  const snapshot = await query.limit(limit).offset(offset).get();

  return {
    notifications: toCollectionArray(snapshot),
    pagination: { page, limit, total: countSnapshot.data().count },
  };
}

async function getNotificationById(notificationId) {
  const doc = await db().collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId).get();
  const notification = toDocObject(doc);
  if (!notification) throw ApiError.notFound('Notification not found.');
  return notification;
}

module.exports = { createAndSendNotification, listNotifications, getNotificationById };
