// Development-only seed script. Creates a Super Admin account (and, if the
// collection is empty, two Admin accounts) so you can log into the panel
// for the first time. Uses fake data only, per the spec - do not point
// this at a production Firebase project.
//
// Usage: npm run seed   (from server/)
require('dotenv').config();
const { db, COLLECTIONS } = require('../firebase/firestore');
const { assertConfigured } = require('../firebase/firebaseAdmin');
const { hashPassword } = require('../utils/password');
const { APPLICATION_STATUSES } = require('../constants/applicationStatuses');
const { PAYMENT_STATUSES } = require('../constants/paymentStatuses');
const { ROLES } = require('../constants/roles');
const env = require('../config/env');

async function seedAdmins() {
  assertConfigured();
  const adminsRef = db().collection(COLLECTIONS.ADMINS);

  const existing = await adminsRef.limit(1).get();
  if (!existing.empty) {
    console.log('[seed] admins collection is not empty - skipping to avoid duplicates.');
    return;
  }

  const superAdminPasswordHash = await hashPassword(env.seed.superAdminPassword);
  const adminPasswordHash = await hashPassword('ChangeMe123!');

  const now = new Date();

  const superAdmin = {
    name: 'Ananya Rao',
    email: env.seed.superAdminEmail.toLowerCase(),
    passwordHash: superAdminPasswordHash,
    role: ROLES.SUPER_ADMIN,
    status: 'ACTIVE',
    createdAt: now,
    lastActiveAt: now,
  };

  const admins = [
    {
      name: 'Rahul Kumar',
      email: 'rahul.admin@example.com',
      passwordHash: adminPasswordHash,
      role: ROLES.ADMIN,
      status: 'ACTIVE',
      createdAt: now,
      lastActiveAt: now,
    },
    {
      name: 'Priya Sharma',
      email: 'priya.admin@example.com',
      passwordHash: adminPasswordHash,
      role: ROLES.ADMIN,
      status: 'ACTIVE',
      createdAt: now,
      lastActiveAt: now,
    },
  ];

  await adminsRef.add(superAdmin);
  for (const admin of admins) {
    await adminsRef.add(admin);
  }

  console.log('[seed] Created 1 Super Admin and 2 Admin accounts:');
  console.log(`  Super Admin: ${superAdmin.email} / ${env.seed.superAdminPassword}`);
  console.log(`  Admin:       rahul.admin@example.com / ChangeMe123!`);
  console.log(`  Admin:       priya.admin@example.com / ChangeMe123!`);
  console.log('[seed] Change these passwords before using anything but a local dev project.');
}

/**
 * Builds the lowercase array used by userService's search-by-prefix query
 * (Firestore has no native free-text search - see comment in userService.js).
 * Includes the user's own generated id once known.
 */
function buildSearchIndex({ fullName, phone, email }) {
  const tokens = new Set();
  fullName
    .toLowerCase()
    .split(' ')
    .forEach((t) => tokens.add(t));
  tokens.add(fullName.toLowerCase());
  tokens.add(phone);
  tokens.add(email.toLowerCase());
  return Array.from(tokens);
}

const FAKE_NAMES = [
  'Arjun Mehta', 'Kavya Iyer', 'Rohan Verma', 'Sneha Patil', 'Vikram Singh',
  'Ishita Gupta', 'Aditya Nair', 'Meera Joshi', 'Karan Malhotra', 'Divya Reddy',
];

async function seedUsers() {
  const usersRef = db().collection(COLLECTIONS.USERS);
  const existing = await usersRef.limit(1).get();
  if (!existing.empty) {
    console.log('[seed] users collection is not empty - skipping to avoid duplicates.');
    return;
  }

  const now = new Date();
  for (let i = 0; i < FAKE_NAMES.length; i += 1) {
    const fullName = FAKE_NAMES[i];
    const phone = `98765${String(10000 + i).slice(-5)}`;
    const email = `${fullName.toLowerCase().replace(' ', '.')}@example.test`;
    const user = {
      fullName,
      phone,
      email,
      address: 'Fake address for development seed data only',
      dateOfBirth: '1995-01-01',
      occupation: 'Not specified',
      annualIncome: 150000 + i * 10000,
      fatherName: 'Fake Father Name',
      createdAt: now,
      updatedAt: now,
      searchIndex: buildSearchIndex({ fullName, phone, email }),
    };
    await usersRef.add(user);
  }
  console.log(`[seed] Created ${FAKE_NAMES.length} fake development users.`);
}

const FAKE_SCHEMES = [
  { name: 'Annapurna Bhandar', description: 'Subsidized food grain support scheme.', price: 199 },
  { name: 'Yuva Sathi', description: 'Youth skill development and employment support.', price: 299 },
  { name: 'Grameen Awas Yojana', description: 'Rural housing assistance scheme.', price: 249 },
];

async function seedSchemesAndApplications() {
  const schemesRef = db().collection(COLLECTIONS.SCHEMES);
  const existingSchemes = await schemesRef.limit(1).get();

  let schemes;
  if (!existingSchemes.empty) {
    console.log('[seed] schemes collection is not empty - reusing existing schemes.');
    const snapshot = await schemesRef.get();
    schemes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } else {
    const now = new Date();
    schemes = [];
    for (const scheme of FAKE_SCHEMES) {
      const ref = await schemesRef.add({
        ...scheme,
        status: 'ACTIVE',
        eligibility: 'Fake eligibility criteria for development seed data.',
        requiredFields: ['Full Name', 'Date of Birth', 'Address', 'Annual Income'],
        requiredDocuments: ['Aadhaar', 'Income Certificate', 'Bank Passbook'],
        instructions: 'Fake instructions for development seed data.',
        createdAt: now,
        updatedAt: now,
      });
      schemes.push({ id: ref.id, name: scheme.name, price: scheme.price });
    }
    console.log(`[seed] Created ${schemes.length} fake government schemes.`);
  }

  const applicationsRef = db().collection(COLLECTIONS.APPLICATIONS);
  const existingApplications = await applicationsRef.limit(1).get();
  if (!existingApplications.empty) {
    console.log('[seed] applications collection is not empty - skipping to avoid duplicates.');
    const snapshot = await applicationsRef.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  const usersSnapshot = await db().collection(COLLECTIONS.USERS).get();
  const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  if (users.length === 0) {
    console.log('[seed] No users found - skipping application seed data.');
    return [];
  }

  const now = new Date();
  const createdApplications = [];
  for (let i = 0; i < 25; i += 1) {
    const user = users[i % users.length];
    const scheme = schemes[i % schemes.length];
    const status = APPLICATION_STATUSES[i % APPLICATION_STATUSES.length];
    const paymentStatus = i % 7 === 0 ? PAYMENT_STATUSES[2] : PAYMENT_STATUSES[1]; // mostly SUCCESSFUL, occasionally FAILED
    const daysAgo = i * 2;
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const searchIndex = [
      user.fullName.toLowerCase(),
      ...user.fullName.toLowerCase().split(' '),
      user.phone,
      scheme.name.toLowerCase(),
    ];

    const applicationData = {
      userId: user.id,
      userName: user.fullName,
      userPhone: user.phone,
      schemeId: scheme.id,
      schemeName: scheme.name,
      amount: scheme.price,
      paymentStatus,
      status,
      createdAt,
      updatedAt: createdAt,
      searchIndex,
    };
    const ref = await applicationsRef.add(applicationData);
    createdApplications.push({ id: ref.id, ...applicationData });
  }
  console.log(`[seed] Created ${createdApplications.length} fake development applications.`);
  return createdApplications;
}

const SAMPLE_AI_MESSAGES = [
  'Hi! I can help you apply for a government scheme. Which one are you interested in?',
  'Great choice. To get started, could you share your full name and date of birth?',
  'Thanks. Now please upload your Aadhaar card and income certificate.',
];

const SAMPLE_USER_MESSAGES = [
  "I'd like to apply, please.",
  'Sure, here are my details.',
  "I've uploaded the documents.",
];

async function seedConversations(applications) {
  const conversationsRef = db().collection(COLLECTIONS.CONVERSATIONS);
  const existing = await conversationsRef.limit(1).get();
  if (!existing.empty) {
    console.log('[seed] conversations collection is not empty - skipping to avoid duplicates.');
    return;
  }
  if (applications.length === 0) {
    console.log('[seed] No applications found - skipping conversation seed data.');
    return;
  }

  const messagesRef = db().collection(COLLECTIONS.MESSAGES);
  const sampleToSeed = applications.slice(0, 12);
  const now = Date.now();

  for (let i = 0; i < sampleToSeed.length; i += 1) {
    const application = sampleToSeed[i];
    const state = i % 4 === 0 ? 'CLOSED' : 'OPEN';
    const baseTime = now - (sampleToSeed.length - i) * 60 * 60 * 1000;

    const conversationData = {
      applicationId: application.id,
      userId: application.userId,
      userName: application.userName,
      schemeName: application.schemeName,
      state,
      searchIndex: [application.userName.toLowerCase(), ...application.userName.toLowerCase().split(' ')],
      createdAt: new Date(baseTime),
      updatedAt: new Date(baseTime),
      lastMessage: '',
      lastMessageAt: new Date(baseTime),
    };
    const conversationRef = await conversationsRef.add(conversationData);

    const exchanges = 1 + (i % 3); // vary conversation length a bit
    let lastMessage = '';
    let lastMessageAt = baseTime;
    for (let e = 0; e < exchanges; e += 1) {
      const aiTime = baseTime + e * 5 * 60 * 1000;
      const aiText = SAMPLE_AI_MESSAGES[e % SAMPLE_AI_MESSAGES.length];
      await messagesRef.add({
        conversationId: conversationRef.id,
        senderId: 'ai-chatbot',
        senderType: 'AI',
        message: aiText,
        createdAt: new Date(aiTime),
      });

      const userTime = aiTime + 2 * 60 * 1000;
      const userText = SAMPLE_USER_MESSAGES[e % SAMPLE_USER_MESSAGES.length];
      await messagesRef.add({
        conversationId: conversationRef.id,
        senderId: application.userId,
        senderType: 'USER',
        message: userText,
        createdAt: new Date(userTime),
      });

      lastMessage = userText;
      lastMessageAt = userTime;
    }

    await conversationRef.update({ lastMessage, lastMessageAt: new Date(lastMessageAt) });
  }

  console.log(`[seed] Created ${sampleToSeed.length} fake development conversations with sample AI/user messages.`);
}

const FAKE_DOCUMENT_TYPES = ['Aadhaar', 'Income Certificate', 'Bank Passbook'];

/**
 * Seeds information requests, OTP requests, and document METADATA (not
 * real files - see documentService.js / storage.js for why: uploading is
 * the user-facing app's job, out of scope here) so the Phase 6 admin
 * screens have something real to display. Document "download" will
 * correctly fail with a clear 404 for this seed data, since there's no
 * actual file in Storage at the recorded path - that's the honest
 * behavior of a real signed-URL lookup against data that was never
 * uploaded, not a bug.
 */
async function seedRequestsDocumentsOtp() {
  const infoRequestsRef = db().collection(COLLECTIONS.INFORMATION_REQUESTS);
  const existingRequests = await infoRequestsRef.limit(1).get();
  if (!existingRequests.empty) {
    console.log('[seed] information requests already exist - skipping Phase 6 seed data.');
    return;
  }

  const applicationsSnapshot = await db().collection(COLLECTIONS.APPLICATIONS).limit(12).get();
  const applications = applicationsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  if (applications.length === 0) {
    console.log('[seed] No applications found - skipping Phase 6 seed data.');
    return;
  }

  const documentsRef = db().collection(COLLECTIONS.DOCUMENTS);
  const otpRequestsRef = db().collection(COLLECTIONS.OTP_REQUESTS);
  const now = new Date();

  let infoRequestCount = 0;
  let documentCount = 0;
  let otpCount = 0;

  for (let i = 0; i < applications.length; i += 1) {
    const application = applications[i];

    if (i % 2 === 0) {
      await infoRequestsRef.add({
        applicationId: application.id,
        userId: application.userId,
        requestedBy: 'seed-script',
        requestedByName: 'Seed Script',
        type: 'TEXT',
        content: "Please share your father's occupation.",
        fields: null,
        status: 'PENDING',
        createdAt: now,
        userResponse: null,
        respondedAt: null,
      });
      infoRequestCount += 1;
    }

    for (const docType of FAKE_DOCUMENT_TYPES) {
      const status = i % 5 === 0 ? 'REUPLOAD_REQUIRED' : i % 3 === 0 ? 'VERIFIED' : 'PENDING';
      await documentsRef.add({
        applicationId: application.id,
        userId: application.userId,
        type: docType,
        fileName: `${docType.toLowerCase().replace(/ /g, '-')}.pdf`,
        // Convention: documents/{applicationId}/{sanitizedType}.pdf - no
        // real object exists at this path for seed data (see doc comment above).
        storagePath: `documents/${application.id}/${docType.toLowerCase().replace(/ /g, '-')}.pdf`,
        status,
        uploadedAt: now,
        verifiedBy: status === 'VERIFIED' ? 'seed-script' : null,
        verifiedAt: status === 'VERIFIED' ? now : null,
        reuploadReason: status === 'REUPLOAD_REQUIRED' ? 'Document image is blurry - please re-upload.' : null,
      });
      documentCount += 1;
    }

    if (i % 3 === 0) {
      await otpRequestsRef.add({
        applicationId: application.id,
        type: 'GOVERNMENT_PORTAL',
        status: 'REQUESTED',
        requestedBy: 'seed-script',
        requestedByName: 'Seed Script',
        requestedAt: now,
        verifiedAt: null,
      });
      otpCount += 1;
    }
  }

  console.log(
    `[seed] Created ${infoRequestCount} information requests, ${documentCount} document records, ${otpCount} OTP requests.`
  );
}

seedAdmins()
  .then(seedUsers)
  .then(seedSchemesAndApplications)
  .then(seedConversations)
  .then(seedRequestsDocumentsOtp)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed] Failed:', err.message);
    process.exit(1);
  });
