const express = require('express');
const refundController = require('../controllers/refundController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { createRefundSchema, listRefundsQuerySchema, rejectRefundSchema } = require('../validators/refundValidators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

const bothRoles = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);
// Approve/reject are Super Admin ONLY - this is the enforcement point for
// spec Section 18/19 ("Admin cannot approve refunds", "Only Super Admin
// can approve/reject refunds"). Both roles can create/view a refund
// request; only this authorize() call gates the decision itself.
const superAdminOnly = authorize(ROLES.SUPER_ADMIN);

router.get('/', authenticate, bothRoles, validateRequest(listRefundsQuerySchema, { source: 'query' }), refundController.listRefunds);
router.get('/:id', authenticate, bothRoles, refundController.getRefund);
router.post('/', authenticate, bothRoles, validateRequest(createRefundSchema), refundController.createRefund);
router.post('/:id/approve', authenticate, superAdminOnly, refundController.approveRefund);
router.post(
  '/:id/reject',
  authenticate,
  superAdminOnly,
  validateRequest(rejectRefundSchema),
  refundController.rejectRefund
);

module.exports = router;
