// Not finalized by the product spec (Section 57 explicitly calls out
// "exact status naming" as undecided). Kept deliberately minimal - OPEN
// while the admin team may still need to respond, CLOSED once the
// application reaches a terminal status. This is already assumed by
// dashboardService's "openConversations" stat from Phase 2 - kept
// consistent with that rather than introducing a second scheme.
const CONVERSATION_STATES = Object.freeze(['OPEN', 'CLOSED']);

// Every message has one of these senders. AI and USER messages originate
// from the existing user-facing app/chatbot (out of scope here) - this
// admin panel only ever reads those and writes ADMIN messages.
const SENDER_TYPES = Object.freeze(['AI', 'USER', 'ADMIN', 'SYSTEM']);

module.exports = { CONVERSATION_STATES, SENDER_TYPES };
