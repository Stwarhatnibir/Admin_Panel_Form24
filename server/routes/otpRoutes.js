const express = require('express');
const otpController = require('../controllers/otpController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { updateOtpStatusSchema } = require('../validators/otpValidators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

const bothRoles = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

// Creating/listing OTP requests lives under /api/applications/:id/otp-requests
// (see applicationRoutes.js) since they're always scoped to an application.
// Updating a specific request's status is addressed by its own id.
router.patch(
  '/:otpId/status',
  authenticate,
  bothRoles,
  validateRequest(updateOtpStatusSchema),
  otpController.updateStatus
);

module.exports = router;
