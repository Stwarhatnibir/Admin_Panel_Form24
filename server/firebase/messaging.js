// Thin Firebase Cloud Messaging wrapper, mirroring storage.js/firestore.js.
//
// IMPORTANT SCOPE NOTE: actual push delivery requires the recipient's
// device to have registered an FCM token, which happens in the
// user-facing app/chatbot - out of scope for this admin panel (see
// project brief: "Build only the Admin Panel"). This wrapper will
// genuinely call Firebase's Send API for any user who DOES have a
// fcmToken on their user document, but seed/development users won't have
// one (there's no real app writing it), so sending to them will honestly
// report "no token registered" rather than silently pretending to
// succeed. This is the same kind of documented gap as the OTP SMS gateway
// and the payment provider - a real, working admin action wrapped around
// an external integration point that isn't fully wired up end-to-end yet.
const { admin, assertConfigured } = require('./firebaseAdmin');

/**
 * Sends a single push message to one FCM token.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendToToken(token, { title, body, data = {} }) {
  assertConfigured();
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      // Deep-linking data (Section 31) - a real client app reads this to
      // navigate straight to the relevant application/chat.
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { sendToToken };
