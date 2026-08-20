const { z } = require('zod');
const { APPLICATION_STATUSES } = require('../constants/applicationStatuses');

const listApplicationsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  schemeId: z.string().trim().optional(),
  createdFrom: z.string().trim().optional(), // ISO date
  createdTo: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'amount']).optional().default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const updateStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES, { errorMap: () => ({ message: 'Invalid application status.' }) }),
});

const createInternalNoteSchema = z.object({
  note: z.string().trim().min(1, 'Note cannot be empty.').max(2000),
});

module.exports = { listApplicationsQuerySchema, updateStatusSchema, createInternalNoteSchema };
