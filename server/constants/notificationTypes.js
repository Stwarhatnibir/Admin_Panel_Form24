// Per spec Section 9/31: an admin can send to one user, a selected group,
// or everyone.
const RECIPIENT_TYPES = Object.freeze(['INDIVIDUAL', 'GROUP', 'EVERYONE']);

module.exports = { RECIPIENT_TYPES };
