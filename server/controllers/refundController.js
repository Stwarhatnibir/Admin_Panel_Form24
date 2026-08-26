const refundService = require('../services/refundService');
const asyncHandler = require('../utils/asyncHandler');

const listRefunds = asyncHandler(async (req, res) => {
  const result = await refundService.listRefundRequests(req.query);
  res.status(200).json({ success: true, data: result.refunds, pagination: result.pagination });
});

const getRefund = asyncHandler(async (req, res) => {
  const refund = await refundService.getRefundRequestById(req.params.id);
  res.status(200).json({ success: true, data: refund });
});

const createRefund = asyncHandler(async (req, res) => {
  const { applicationId, ...rest } = req.body;
  const refund = await refundService.createRefundRequest(applicationId, rest, req.admin);
  res.status(201).json({ success: true, data: refund });
});

const approveRefund = asyncHandler(async (req, res) => {
  const refund = await refundService.approveRefundRequest(req.params.id, req.admin);
  res.status(200).json({ success: true, data: refund });
});

const rejectRefund = asyncHandler(async (req, res) => {
  const refund = await refundService.rejectRefundRequest(req.params.id, req.body.reason, req.admin);
  res.status(200).json({ success: true, data: refund });
});

module.exports = { listRefunds, getRefund, createRefund, approveRefund, rejectRefund };
