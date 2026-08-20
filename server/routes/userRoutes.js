const express = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { updateUserSchema, listUsersQuerySchema } = require('../validators/userValidators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

const bothRoles = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.get('/', authenticate, bothRoles, validateRequest(listUsersQuerySchema, { source: 'query' }), userController.listUsers);
router.get('/:id', authenticate, bothRoles, userController.getUser);
router.get('/:id/activity', authenticate, bothRoles, userController.getUserActivity);
router.patch('/:id', authenticate, bothRoles, validateRequest(updateUserSchema), userController.updateUser);

module.exports = router;
