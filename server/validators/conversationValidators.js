const { z } = require('zod');
const { CONVERSATION_STATES } = require('../constants/conversationStates');

const listConversationsQuerySchema = z.object({
  search: z.string().trim().optional(),
  state: z.enum(CONVERSATION_STATES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const listMessagesQuerySchema = z.object({
  // Polling clients pass `since` (an ISO timestamp) to fetch only messages
  // newer than what they already have, instead of re-fetching the whole
  // thread on every poll.
  since: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

const sendMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty.').max(5000),
});

module.exports = { listConversationsQuerySchema, listMessagesQuerySchema, sendMessageSchema };
