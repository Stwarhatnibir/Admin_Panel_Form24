const { z } = require('zod');

// Fields an admin is allowed to edit on a user record. Kept as an allowlist
// rather than accepting an arbitrary object, so an admin can never write to
// fields like `id`, `createdAt`, or anything not meant to be user-editable.
const updateUserSchema = z
  .object({
    fullName: z.string().trim().min(1).max(200).optional(),
    email: z.string().trim().email().optional().or(z.literal('')),
    phone: z.string().trim().min(6).max(20).optional(),
    address: z.string().trim().max(500).optional(),
    dateOfBirth: z.string().trim().optional(), // ISO date string
    occupation: z.string().trim().max(200).optional(),
    annualIncome: z.number().nonnegative().optional(),
    fatherName: z.string().trim().max(200).optional(),
    aadhaarNumber: z.string().trim().max(20).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'No fields provided to update.' });

const listUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

module.exports = { updateUserSchema, listUsersQuerySchema };
