const { z } = require('zod');

const structuredFieldSchema = z.object({
  label: z.string().trim().min(1).max(200),
  type: z.enum(['text', 'number', 'date', 'file']).default('text'),
  required: z.boolean().default(true),
});

// Matches spec Section 23: a request is either plain text, or a structured
// list of fields (e.g. "Full Name, Date of Birth, Address, Income").
const createInformationRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('TEXT'),
    content: z.string().trim().min(1, 'Message cannot be empty.').max(2000),
  }),
  z.object({
    type: z.literal('STRUCTURED'),
    fields: z.array(structuredFieldSchema).min(1, 'At least one field is required.'),
  }),
]);

module.exports = { createInformationRequestSchema };
