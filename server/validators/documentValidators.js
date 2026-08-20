const { z } = require('zod');

const requestReuploadSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required.').max(500),
});

module.exports = { requestReuploadSchema };
