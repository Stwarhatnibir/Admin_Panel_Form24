const express = require('express');
const schemeController = require('../controllers/schemeController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { createSchemeSchema, updateSchemeSchema, updateSchemeStatusSchema } = require('../validators/schemeValidators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Both Admin and Super Admin can manage schemes - per spec Section 4/5,
// "Add/edit government schemes" and "Activate/deactivate schemes" are
// listed as things a plain Admin can do, not Super-Admin-only.
const bothRoles = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.get('/', authenticate, bothRoles, schemeController.listSchemes);
router.get('/:id', authenticate, bothRoles, schemeController.getScheme);
router.post('/', authenticate, bothRoles, validateRequest(createSchemeSchema), schemeController.createScheme);
router.patch('/:id', authenticate, bothRoles, validateRequest(updateSchemeSchema), schemeController.updateScheme);
router.patch(
  '/:id/status',
  authenticate,
  bothRoles,
  validateRequest(updateSchemeStatusSchema),
  schemeController.updateStatus
);

module.exports = router;
