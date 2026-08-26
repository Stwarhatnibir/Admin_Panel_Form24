const { z } = require('zod');
const { REFUND_STATUSES, REFUND_TYPES } = require('../constants/refundStatuses');

const createRefundSchema = z.object({
  applicationId: z.string().trim().min(1, 'applicationId is required.'),
  refundType: z.enum(REFUND_TYPES, { errorMap: () => ({ message: 'Invalid refund type.' }) }),
  requestedAmount: z.number().positive('Refund amount must be greater than zero.'),
  reason: z.string().trim().min(1, 'A reason is required.').max(1000),
});

const listRefundsQuerySchema = z.object({
  status: z.enum(REFUND_STATUSES).optional(),
  applicationId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const rejectRefundSchema = z.object({
  reason: z.string().trim().min(1, 'A reason is required.').max(1000),
});

module.exports = { createRefundSchema, listRefundsQuerySchema, rejectRefundSchema };
