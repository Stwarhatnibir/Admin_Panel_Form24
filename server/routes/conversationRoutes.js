const express = require('express');
const conversationController = require('../controllers/conversationController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const {
  listConversationsQuerySchema,
  listMessagesQuerySchema,
  sendMessageSchema,
} = require('../validators/conversationValidators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

const bothRoles = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.get(
  '/',
  authenticate,
  bothRoles,
  validateRequest(listConversationsQuerySchema, { source: 'query' }),
  conversationController.listConversations
);
router.get('/by-application/:applicationId', authenticate, bothRoles, conversationController.getConversationForApplication);
router.get('/:id', authenticate, bothRoles, conversationController.getConversation);
router.get(
  '/:id/messages',
  authenticate,
  bothRoles,
  validateRequest(listMessagesQuerySchema, { source: 'query' }),
  conversationController.listMessages
);
router.post(
  '/:id/messages',
  authenticate,
  bothRoles,
  validateRequest(sendMessageSchema),
  conversationController.sendMessage
);

module.exports = router;
