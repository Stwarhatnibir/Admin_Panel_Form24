const conversationService = require('../services/conversationService');
const asyncHandler = require('../utils/asyncHandler');

const listConversations = asyncHandler(async (req, res) => {
  const result = await conversationService.listConversations(req.query);
  res.status(200).json({ success: true, data: result.conversations, pagination: result.pagination });
});

const getConversation = asyncHandler(async (req, res) => {
  const conversation = await conversationService.getConversationById(req.params.id);
  res.status(200).json({ success: true, data: conversation });
});

// Lets the Applications detail page (Phase 4) link directly into the
// conversation for that application, without knowing its id up front.
const getConversationForApplication = asyncHandler(async (req, res) => {
  const conversation = await conversationService.getConversationByApplicationId(req.params.applicationId);
  if (!conversation) {
    return res.status(200).json({ success: true, data: null });
  }
  res.status(200).json({ success: true, data: conversation });
});

const listMessages = asyncHandler(async (req, res) => {
  const messages = await conversationService.listMessages(req.params.id, req.query);
  res.status(200).json({ success: true, data: messages });
});

const sendMessage = asyncHandler(async (req, res) => {
  const message = await conversationService.sendAdminMessage(req.params.id, req.body.message, req.admin);
  res.status(201).json({ success: true, data: message });
});

module.exports = { listConversations, getConversation, getConversationForApplication, listMessages, sendMessage };
