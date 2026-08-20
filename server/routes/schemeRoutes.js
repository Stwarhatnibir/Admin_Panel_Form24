const express = require('express');
const schemeController = require('../controllers/schemeController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Read-only for now (Phase 4 needs this for the Applications filter
// dropdown). Create/update/activate endpoints are added in Phase 7.
router.get('/', authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), schemeController.listSchemes);

module.exports = router;
