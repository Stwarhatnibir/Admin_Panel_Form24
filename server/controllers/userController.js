const userService = require('../services/userService');
const auditService = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');

const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query);
  res.status(200).json({ success: true, data: result.users, pagination: result.pagination });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({ success: true, data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.admin);
  res.status(200).json({ success: true, data: user });
});

// Convenience endpoint: this user's own activity history, scoped server-side
// so the frontend doesn't need broad audit-log read access just to render
// a profile's Activity tab.
const getUserActivity = asyncHandler(async (req, res) => {
  const logs = await auditService.listAuditLogs({ entityType: 'user', entityId: req.params.id, limit: 50 });
  res.status(200).json({ success: true, data: logs.logs });
});

module.exports = { listUsers, getUser, updateUser, getUserActivity };
