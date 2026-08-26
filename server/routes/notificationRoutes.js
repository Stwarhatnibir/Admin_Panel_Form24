const express = require('express');
const notificationController = require('../controllers/notificationController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { createNotificationSchema, listNotificationsQuerySchema } = require('../validators/notificationValidators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

const bothRoles = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.get('/', authenticate, bothRoles, validateRequest(listNotificationsQuerySchema, { source: 'query' }), notificationController.list);
router.get('/:id', authenticate, bothRoles, notificationController.getNotification);
router.post('/', authenticate, bothRoles, validateRequest(createNotificationSchema), notificationController.create);

module.exports = router;
