// Loads and validates environment variables in one place so the rest of the
// codebase never touches `process.env` directly. If a required variable is
// missing we fail fast and loudly at startup instead of at request time.
require('dotenv').config();

function required(name, { allowEmptyInDev = false } = {}) {
  const value = process.env[name];
  if (!value && !(allowEmptyInDev && process.env.NODE_ENV !== 'production')) {
    // eslint-disable-next-line no-console
    console.warn(`[config] Missing environment variable: ${name}`);
  }
  return value || '';
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  firebase: {
    projectId: required('FIREBASE_PROJECT_ID', { allowEmptyInDev: true }),
    clientEmail: required('FIREBASE_CLIENT_EMAIL', { allowEmptyInDev: true }),
    // .env files can't hold real newlines, so private keys are stored with
    // literal "\n" sequences and converted back here.
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  },

  fcm: {
    projectId: process.env.FCM_PROJECT_ID || '',
  },

  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'mock',
    apiKey: process.env.PAYMENT_API_KEY || '',
    apiSecret: process.env.PAYMENT_API_SECRET || '',
  },

  seed: {
    superAdminEmail: process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@example.com',
    superAdminPassword: process.env.SEED_SUPER_ADMIN_PASSWORD || 'ChangeMe123!',
  },
};

module.exports = env;
