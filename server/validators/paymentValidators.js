const { z } = require('zod');
const { PAYMENT_STATUSES } = require('../constants/paymentStatuses');

const listPaymentsQuerySchema = z.object({
  status: z.enum(PAYMENT_STATUSES).optional(),
  applicationId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

module.exports = { listPaymentsQuerySchema };
