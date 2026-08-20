const { z } = require('zod');
const { OTP_TYPES, OTP_STATUSES } = require('../constants/requestStatuses');

const createOtpRequestSchema = z.object({
  type: z.enum(OTP_TYPES, { errorMap: () => ({ message: 'Invalid OTP type.' }) }),
});

// Admin-facing status transitions only - there is deliberately no field
// anywhere in this schema (or the OTP data model) for the OTP value
// itself. See Section 26: "Never store raw OTPs in audit logs" and "Never
// display OTPs to unauthorized users" - the simplest way to guarantee that
// is to never have a field capable of holding one.
const updateOtpStatusSchema = z.object({
  status: z.enum(OTP_STATUSES, { errorMap: () => ({ message: 'Invalid OTP status.' }) }),
});

module.exports = { createOtpRequestSchema, updateOtpStatusSchema };
