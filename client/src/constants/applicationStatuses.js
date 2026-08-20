// Mirrors server/constants/applicationStatuses.js. No APPROVED/REJECTED -
// this product does not track that distinction (spec Section 15).
export const APPLICATION_STATUSES = [
  'NEW',
  'UNDER_REVIEW',
  'INFORMATION_REQUIRED',
  'READY_FOR_FORM_FILLING',
  'FORM_SUBMITTED',
  'COMPLETED',
  'CANCELLED',
];

export const STATUS_LABELS = {
  NEW: 'New',
  UNDER_REVIEW: 'Under Review',
  INFORMATION_REQUIRED: 'Information Required',
  READY_FOR_FORM_FILLING: 'Ready for Form Filling',
  FORM_SUBMITTED: 'Form Submitted',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// Tailwind class pairs (bg, text) per status - kept in one place so new
// statuses can't be added on the frontend without a deliberate color choice.
export const STATUS_TONES = {
  NEW: 'bg-slate-100 text-slate-700',
  UNDER_REVIEW: 'bg-accent-light text-accent-dark',
  INFORMATION_REQUIRED: 'bg-rose-light text-rose',
  READY_FOR_FORM_FILLING: 'bg-teal-light text-teal',
  FORM_SUBMITTED: 'bg-teal-light text-teal',
  COMPLETED: 'bg-teal text-white',
  CANCELLED: 'bg-slate-200 text-slate-500',
};

export const PAYMENT_STATUS_LABELS = {
  PENDING: 'Pending',
  SUCCESSFUL: 'Successful',
  FAILED: 'Failed',
  PARTIALLY_REFUNDED: 'Partially Refunded',
  FULLY_REFUNDED: 'Fully Refunded',
};

export const PAYMENT_STATUS_TONES = {
  PENDING: 'bg-slate-100 text-slate-700',
  SUCCESSFUL: 'bg-teal-light text-teal',
  FAILED: 'bg-rose-light text-rose',
  PARTIALLY_REFUNDED: 'bg-accent-light text-accent-dark',
  FULLY_REFUNDED: 'bg-rose-light text-rose',
};
