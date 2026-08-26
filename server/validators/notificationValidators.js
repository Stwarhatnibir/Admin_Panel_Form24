const { z } = require('zod');

const baseFields = {
  title: z.string().trim().min(1, 'Title is required.').max(200),
  message: z.string().trim().min(1, 'Message is required.').max(1000),
  relatedApplicationId: z.string().trim().optional(),
};

const createNotificationSchema = z.discriminatedUnion('recipientType', [
  z.object({ recipientType: z.literal('INDIVIDUAL'), recipientId: z.string().trim().min(1), ...baseFields }),
  z.object({
    recipientType: z.literal('GROUP'),
    recipientIds: z.array(z.string().trim().min(1)).min(1, 'Select at least one recipient.'),
    ...baseFields,
  }),
  z.object({ recipientType: z.literal('EVERYONE'), ...baseFields }),
]);

const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

module.exports = { createNotificationSchema, listNotificationsQuerySchema };
