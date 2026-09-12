const { z } = require('zod');
const { DOCUMENT_STATUSES } = require('../constants/requestStatuses');

const listDocumentsQuerySchema = z.object({
  status: z.enum(DOCUMENT_STATUSES).optional(),
  type: z.string().trim().optional(),
  applicationId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const requestReuploadSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required.').max(500),
});

module.exports = { listDocumentsQuerySchema, requestReuploadSchema };
