const adminService = require('../services/adminService');
const auditService = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const admins = await adminService.listAdmins();
  res.status(200).json({ success: true, data: admins });
});

const create = asyncHandler(async (req, res) => {
  const admin = await adminService.createAdmin(req.body, req.admin);
  res.status(201).json({ success: true, data: admin });
});

const remove = asyncHandler(async (req, res) => {
  const result = await adminService.removeAdmin(req.params.id, req.admin);
  res.status(200).json({ success: true, data: result });
});

// Section 32/34: Super Admin can view an individual admin's activity,
// filtered from the same central audit log everything else writes to.
const getActivity = asyncHandler(async (req, res) => {
  const logs = await auditService.listAuditLogs({ actorId: req.params.id, limit: 50 });
  res.status(200).json({ success: true, data: logs });
});

module.exports = { list, create, remove, getActivity };
