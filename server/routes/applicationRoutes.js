const express = require('express');
const applicationController = require('../controllers/applicationController');
const informationRequestController = require('../controllers/informationRequestController');
const otpController = require('../controllers/otpController');
const documentController = require('../controllers/documentController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const {
  listApplicationsQuerySchema,
  updateStatusSchema,
  createInternalNoteSchema,
} = require('../validators/applicationValidators');
const { createInformationRequestSchema } = require('../validators/informationRequestValidators');
const { createOtpRequestSchema } = require('../validators/otpValidators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

const bothRoles = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.get(
  '/',
  authenticate,
  bothRoles,
  validateRequest(listApplicationsQuerySchema, { source: 'query' }),
  applicationController.listApplications
);
router.get('/:id', authenticate, bothRoles, applicationController.getApplication);
router.get('/:id/activity', authenticate, bothRoles, applicationController.getActivity);
router.patch(
  '/:id/status',
  authenticate,
  bothRoles,
  validateRequest(updateStatusSchema),
  applicationController.updateStatus
);
router.get('/:id/notes', authenticate, bothRoles, applicationController.listNotes);
router.post(
  '/:id/notes',
  authenticate,
  bothRoles,
  validateRequest(createInternalNoteSchema),
  applicationController.addNote
);

// --- Information requests (Section 23) ---
router.get('/:id/information-requests', authenticate, bothRoles, informationRequestController.list);
router.post(
  '/:id/information-requests',
  authenticate,
  bothRoles,
  validateRequest(createInformationRequestSchema),
  informationRequestController.create
);

// --- OTP requests (Section 26) ---
router.get('/:id/otp-requests', authenticate, bothRoles, otpController.list);
router.post(
  '/:id/otp-requests',
  authenticate,
  bothRoles,
  validateRequest(createOtpRequestSchema),
  otpController.create
);

// --- Documents (Section 24/25) - list scoped to this application. ---
// Individual document actions (download/verify/request-reupload) live
// under /api/documents/:id, since a document is addressed by its own id
// once you have it, not by application id + document id together.
router.get('/:id/documents', authenticate, bothRoles, documentController.listForApplication);

module.exports = router;
