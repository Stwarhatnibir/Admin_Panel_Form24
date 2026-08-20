const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');
const { ROLES } = require('../constants/roles');
const authorize = require('../middleware/authorize');

const router = express.Router();

// Both roles can view the dashboard.
router.get('/stats', authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), dashboardController.getStats);

module.exports = router;
