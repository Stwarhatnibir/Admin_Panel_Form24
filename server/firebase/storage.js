// Thin Firebase Storage access layer, mirroring firestore.js. Documents are
// never publicly accessible (spec Section 8/25) - the only way to read one
// is through this backend generating a short-lived signed URL for an
// authenticated, authorized admin.
const { admin, assertConfigured } = require('./firebaseAdmin');
const env = require('../config/env');

function bucket() {
  assertConfigured();
  if (!env.firebase.storageBucket) {
    const err = new Error('FIREBASE_STORAGE_BUCKET is not set in .env.');
    err.statusCode = 503;
    throw err;
  }
  return admin.storage().bucket(env.firebase.storageBucket);
}

/**
 * Generates a signed URL for downloading a document, valid for 10 minutes.
 * Never returns a permanent public URL, per spec Section 8/25.
 */
async function getSignedDownloadUrl(storagePath) {
  const file = bucket().file(storagePath);
  const [exists] = await file.exists();
  if (!exists) {
    const err = new Error(
      'File not found in Storage. If this is seed/development data, only document metadata was seeded - ' +
        'no real file was uploaded, since that upload happens in the user-facing app (out of scope here).'
    );
    err.statusCode = 404;
    throw err;
  }
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 10 * 60 * 1000,
  });
  return url;
}

module.exports = { bucket, getSignedDownloadUrl };
