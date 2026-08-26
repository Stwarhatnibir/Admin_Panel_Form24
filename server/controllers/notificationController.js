const notificationService = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const notification = await notificationService.createAndSendNotification(req.body, req.admin);
  res.status(201).json({ success: true, data: notification });
});

const list = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(req.query);
  res.status(200).json({ success: true, data: result.notifications, pagination: result.pagination });
});

const getNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.getNotificationById(req.params.id);
  res.status(200).json({ success: true, data: notification });
});

module.exports = { create, list, getNotification };
