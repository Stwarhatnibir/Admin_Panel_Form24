const { db, COLLECTIONS, toDocObject, toCollectionArray, serverTimestamp } = require('../firebase/firestore');
const ApiError = require('../utils/ApiError');

/**
 * Lists conversations with optional search (by denormalized user/scheme
 * name, same searchIndex pattern used elsewhere) and state filter, sorted
 * by most recently active first.
 */
async function listConversations({ search, state, page = 1, limit = 20 }) {
  let query = db().collection(COLLECTIONS.CONVERSATIONS);

  if (state) query = query.where('state', '==', state);
  if (search) {
    query = query.where('searchIndex', 'array-contains', search.trim().toLowerCase());
  }

  const countSnapshot = await query.count().get();

  query = query.orderBy('lastMessageAt', 'desc');
  const offset = (page - 1) * limit;
  const snapshot = await query.limit(limit).offset(offset).get();

  return {
    conversations: toCollectionArray(snapshot),
    pagination: { page, limit, total: countSnapshot.data().count },
  };
}

async function getConversationById(conversationId) {
  const doc = await db().collection(COLLECTIONS.CONVERSATIONS).doc(conversationId).get();
  const conversation = toDocObject(doc);
  if (!conversation) throw ApiError.notFound('Conversation not found.');
  return conversation;
}

/**
 * Returns the conversation for a given application, or null. Used so the
 * Applications detail page can link straight into the right conversation
 * without the frontend needing to know the conversation's own id.
 */
async function getConversationByApplicationId(applicationId) {
  const snapshot = await db()
    .collection(COLLECTIONS.CONVERSATIONS)
    .where('applicationId', '==', applicationId)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

/**
 * Lists messages oldest-first. When `since` is provided, only messages
 * strictly newer than that timestamp are returned - this is what powers
 * polling-based updates on the frontend (see conversationService.js /
 * ConversationDetail.jsx on the client, and the note in PHASES.md about
 * why polling was chosen over Firestore client-side listeners for now).
 */
async function listMessages(conversationId, { since, limit = 100 }) {
  const conversation = await getConversationById(conversationId);

  let query = db().collection(COLLECTIONS.MESSAGES).where('conversationId', '==', conversation.id);
  if (since) {
    query = query.where('createdAt', '>', new Date(since));
  }
  query = query.orderBy('createdAt', 'asc').limit(limit);

  const snapshot = await query.get();
  return toCollectionArray(snapshot);
}

/**
 * Records an admin reply. Updates the conversation's lastMessage/
 * lastMessageAt so it surfaces correctly in the Conversations list without
 * a second write path to keep in sync.
 */
async function sendAdminMessage(conversationId, text, actor) {
  const conversationRef = db().collection(COLLECTIONS.CONVERSATIONS).doc(conversationId);
  const conversationDoc = await conversationRef.get();
  if (!conversationDoc.exists) throw ApiError.notFound('Conversation not found.');

  const now = new Date();
  const message = {
    conversationId,
    senderId: actor.id,
    senderType: 'ADMIN',
    message: text,
    createdAt: now,
  };
  const ref = await db().collection(COLLECTIONS.MESSAGES).add(message);

  await conversationRef.update({
    lastMessage: text,
    lastMessageAt: now,
    updatedAt: now,
  });

  return { id: ref.id, ...message };
}

module.exports = {
  listConversations,
  getConversationById,
  getConversationByApplicationId,
  listMessages,
  sendAdminMessage,
};
