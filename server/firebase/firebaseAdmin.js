// Initializes the Firebase Admin SDK from environment variables.
//
// This module NEVER hardcodes or invents credentials. If the required
// environment variables are not set, `isConfigured` is false and any
// attempt to use Firestore/Storage/FCM will throw a clear, explicit error
// instead of silently failing or connecting to a wrong project.
const admin = require('firebase-admin');
const env = require('../config/env');

const isConfigured = Boolean(
  env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey
);

let app = null;

if (isConfigured) {
  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: env.firebase.privateKey,
    }),
    storageBucket: env.firebase.storageBucket || undefined,
  });
} else {
  // eslint-disable-next-line no-console
  console.warn(
    '[firebase] FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY are not set. ' +
      'Firestore, Storage and FCM calls will fail until real Firebase credentials are provided in .env. ' +
      'This is expected in a fresh checkout - see server/.env.example.'
  );
}

/**
 * Throws a descriptive error if Firebase has not been configured. Every
 * module that touches Firestore/Storage/FCM should call this first so the
 * failure is immediately understandable instead of a cryptic SDK error.
 */
function assertConfigured() {
  if (!isConfigured) {
    const err = new Error(
      'Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and ' +
        'FIREBASE_PRIVATE_KEY in server/.env to enable this feature.'
    );
    err.statusCode = 503;
    err.code = 'FIREBASE_NOT_CONFIGURED';
    throw err;
  }
}

module.exports = {
  admin,
  app,
  isConfigured,
  assertConfigured,
};
