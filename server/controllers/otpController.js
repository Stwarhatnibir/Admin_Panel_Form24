const otpService = require('../services/otpService');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const otpRequest = await otpService.createOtpRequest(req.params.id, req.body.type, req.admin);
  res.status(201).json({ success: true, data: otpRequest });
});

const list = asyncHandler(async (req, res) => {
  const requests = await otpService.listOtpRequests(req.params.id);
  res.status(200).json({ success: true, data: requests });
});

const updateStatus = asyncHandler(async (req, res) => {
  const updated = await otpService.updateOtpStatus(req.params.otpId, req.body.status, req.admin);
  res.status(200).json({ success: true, data: updated });
});

module.exports = { create, list, updateStatus };
