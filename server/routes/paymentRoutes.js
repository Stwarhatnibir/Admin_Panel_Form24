const express = require('express');
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { listPaymentsQuerySchema } = require('../validators/paymentValidators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

const bothRoles = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.get('/', authenticate, bothRoles, validateRequest(listPaymentsQuerySchema, { source: 'query' }), paymentController.listPayments);
router.get('/:id', authenticate, bothRoles, paymentController.getPayment);

module.exports = router;
