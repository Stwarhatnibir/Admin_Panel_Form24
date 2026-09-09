const express = require('express');
const auditLogController = require('../controllers/auditLogController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { listAuditLogsQuerySchema } = require('../validators/auditLogValidators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Full, unscoped audit log browsing is Super Admin only - Section 5 lists
// "View complete audit logs" under Super Admin specifically, distinct from
// Section 4's plain-Admin "View relevant activity/audit information",
// which is the entity-scoped activity views already available to both
// roles (Users/:id/activity, Applications/:id/activity).
router.get(
  '/',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  validateRequest(listAuditLogsQuerySchema, { source: 'query' }),
  auditLogController.list
);

module.exports = router;
