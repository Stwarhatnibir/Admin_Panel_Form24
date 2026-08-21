const { z } = require('zod');
const { SCHEME_STATUSES } = require('../constants/schemeStatuses');

// Required Information and Required Documents (Section 28) are the
// dynamic-scheme-config mechanism: plain arrays of labels, matching what's
// already in seed data (['Full Name', 'Date of Birth', ...]). Deliberately
// not a richer per-field object schema (type/required flags etc.) - the
// spec's own example ("Fields: Name, DOB, Address, Income, Occupation")
// is just a list of labels, and inventing more structure than that isn't
// asked for. A scheme's fields/documents can be edited without touching
// any React component - that's the actual "dynamic" requirement.
const nonEmptyStringArray = (message) => z.array(z.string().trim().min(1)).min(1, message);

const createSchemeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(200),
  description: z.string().trim().max(2000).optional().default(''),
  price: z.number().nonnegative('Price cannot be negative.'),
  eligibility: z.string().trim().max(2000).optional().default(''),
  requiredFields: nonEmptyStringArray('At least one required field is needed.'),
  requiredDocuments: nonEmptyStringArray('At least one required document is needed.'),
  instructions: z.string().trim().max(2000).optional().default(''),
  icon: z.string().trim().max(10).optional().default(''), // a single emoji, e.g. "🌾"
});

// Same shape, but every field optional and the whole object rejects
// unknown keys - an admin can never smuggle in `status` through this
// endpoint (status changes go through the dedicated /status route so
// they're always audited as SCHEME_ACTIVATED/SCHEME_DEACTIVATED, not
// silently folded into a generic edit).
const updateSchemeSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    price: z.number().nonnegative('Price cannot be negative.').optional(),
    eligibility: z.string().trim().max(2000).optional(),
    requiredFields: nonEmptyStringArray('At least one required field is needed.').optional(),
    requiredDocuments: nonEmptyStringArray('At least one required document is needed.').optional(),
    instructions: z.string().trim().max(2000).optional(),
    icon: z.string().trim().max(10).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'No fields provided to update.' });

const updateSchemeStatusSchema = z.object({
  status: z.enum(SCHEME_STATUSES, { errorMap: () => ({ message: 'Invalid scheme status.' }) }),
});

module.exports = { createSchemeSchema, updateSchemeSchema, updateSchemeStatusSchema };
