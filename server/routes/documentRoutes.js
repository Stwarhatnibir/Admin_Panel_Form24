const express = require('express');
const documentController = require('../controllers/documentController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { requestReuploadSchema } = require('../validators/documentValidators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

const bothRoles = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.get('/:id', authenticate, bothRoles, documentController.getDocument);
router.get('/:id/download', authenticate, bothRoles, documentController.download);
router.post('/:id/verify', authenticate, bothRoles, documentController.verify);
router.post(
  '/:id/request-reupload',
  authenticate,
  bothRoles,
  validateRequest(requestReuploadSchema),
  documentController.requestReupload
);

module.exports = router;
