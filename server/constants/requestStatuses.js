// Information requests (Section 23) - the user responds through the
// existing chat/application flow (out of scope here to build the user
// side), this admin panel creates the request and displays the response
// once it arrives.
const INFORMATION_REQUEST_STATUSES = Object.freeze(['PENDING', 'RESPONDED']);

// Document statuses (Section 24).
const DOCUMENT_STATUSES = Object.freeze(['PENDING', 'VERIFIED', 'REUPLOAD_REQUIRED']);

// OTP types and statuses (Section 26). Raw OTP values are never stored or
// displayed here - only the request lifecycle.
const OTP_TYPES = Object.freeze(['PHONE_VERIFICATION', 'IDENTITY_VERIFICATION', 'GOVERNMENT_PORTAL']);
const OTP_STATUSES = Object.freeze(['REQUESTED', 'PROVIDED', 'VERIFIED', 'EXPIRED', 'FAILED']);

module.exports = { INFORMATION_REQUEST_STATUSES, DOCUMENT_STATUSES, OTP_TYPES, OTP_STATUSES };
