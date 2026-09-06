const express = require('express');
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { createAdminSchema } = require('../validators/adminValidators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// This entire router is Super Admin only - "Manage administrative access"
// is explicitly not something a plain Admin can do (Section 4/5/43).
const superAdminOnly = authorize(ROLES.SUPER_ADMIN);

router.get('/', authenticate, superAdminOnly, adminController.list);
router.post('/', authenticate, superAdminOnly, validateRequest(createAdminSchema), adminController.create);
router.delete('/:id', authenticate, superAdminOnly, adminController.remove);
router.get('/:id/activity', authenticate, superAdminOnly, adminController.getActivity);

module.exports = router;
