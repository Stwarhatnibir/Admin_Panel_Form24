const { z } = require('zod');

// Deliberately does not enforce mutual exclusivity between actorId/action/
// entityType here - see the comment in auditService.js. The frontend is
// the actual enforcement point for "only one filter dimension at a time",
// since that's a UI/index-scoping decision, not a data-integrity rule.
const listAuditLogsQuerySchema = z.object({
  actorId: z.string().trim().optional(),
  action: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  entityId: z.string().trim().optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

module.exports = { listAuditLogsQuerySchema };
