const auditService = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const result = await auditService.listAuditLogs(req.query);
  res.status(200).json({ success: true, data: result.logs, pagination: result.pagination });
});

module.exports = { list };
