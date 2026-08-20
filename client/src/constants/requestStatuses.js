export const DOCUMENT_STATUSES = ['PENDING', 'VERIFIED', 'REUPLOAD_REQUIRED'];
export const DOCUMENT_STATUS_LABELS = { PENDING: 'Pending', VERIFIED: 'Verified', REUPLOAD_REQUIRED: 'Re-upload Required' };
export const DOCUMENT_STATUS_TONES = {
  PENDING: 'bg-slate-100 text-slate-700',
  VERIFIED: 'bg-teal-light text-teal',
  REUPLOAD_REQUIRED: 'bg-rose-light text-rose',
};

export const OTP_TYPES = ['PHONE_VERIFICATION', 'IDENTITY_VERIFICATION', 'GOVERNMENT_PORTAL'];
export const OTP_TYPE_LABELS = {
  PHONE_VERIFICATION: 'Phone Verification',
  IDENTITY_VERIFICATION: 'Identity Verification',
  GOVERNMENT_PORTAL: 'Government Portal',
};

export const OTP_STATUSES = ['REQUESTED', 'PROVIDED', 'VERIFIED', 'EXPIRED', 'FAILED'];
export const OTP_STATUS_LABELS = { REQUESTED: 'Requested', PROVIDED: 'Provided', VERIFIED: 'Verified', EXPIRED: 'Expired', FAILED: 'Failed' };
export const OTP_STATUS_TONES = {
  REQUESTED: 'bg-slate-100 text-slate-700',
  PROVIDED: 'bg-accent-light text-accent-dark',
  VERIFIED: 'bg-teal-light text-teal',
  EXPIRED: 'bg-slate-200 text-slate-500',
  FAILED: 'bg-rose-light text-rose',
};

export const INFORMATION_REQUEST_STATUS_LABELS = { PENDING: 'Pending', RESPONDED: 'Responded' };
export const INFORMATION_REQUEST_STATUS_TONES = {
  PENDING: 'bg-slate-100 text-slate-700',
  RESPONDED: 'bg-teal-light text-teal',
};
