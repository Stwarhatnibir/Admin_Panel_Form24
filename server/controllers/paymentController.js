const paymentService = require('../services/paymentService');
const asyncHandler = require('../utils/asyncHandler');

const listPayments = asyncHandler(async (req, res) => {
  const result = await paymentService.listPayments(req.query);
  res.status(200).json({ success: true, data: result.payments, pagination: result.pagination });
});

const getPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id);
  res.status(200).json({ success: true, data: payment });
});

module.exports = { listPayments, getPayment };
