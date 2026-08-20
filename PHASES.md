# Build Phases

This project is being built in phases, matching the order in the original spec
(Section 59). Each phase is implemented, tested, and reviewed before moving to
the next, rather than scaffolding everything at once.

| Phase | Scope | Status |
|---|---|---|
| 1 | Authentication (JWT login, role middleware, protected routes) | ✅ Done |
| 2 | Admin layout (sidebar, topbar, dashboard shell + live stat cards) | ✅ Done |
| 3 | Users (list, search, profile, edit, audit trail) | ✅ Done |
| 4 | Applications (list, filters, detail page, status, tabs) | ✅ Done |
| 5 | Chat (conversation list, real-time messaging, admin replies, internal notes) | ✅ Done |
| 6 | Information Requests / Documents / OTP | ✅ Done |
| 7 | Government schemes (dynamic fields, dynamic documents, CRUD) | ⏳ Not started |
| 8 | Payments / Refunds (provider abstraction, Super Admin approval) | ⏳ Not started |
| 9 | Notifications (FCM - individual, group, broadcast) | ⏳ Not started |
| 10 | Admin management (add/remove Admin, activity log) | ⏳ Not started |
| 11 | Audit logs, security hardening, permission testing, production cleanup | ⏳ Not started (audit log write path exists; UI + full test suite pending) |

## What "Done" means for Phases 1–2

- **Backend**: real Express routes, Firestore-backed data access, JWT auth
  where the role is always re-read from Firestore (never trusted from the
  client or the token), bcrypt password hashing, centralized error handling,
  rate limiting, audit logging on login/logout.
- **Frontend**: real login form wired to the API, session bootstrap on page
  reload, protected routing, role-aware sidebar, dashboard stat cards that
  fetch live counts from Firestore (not mocked data).
- Both were build-verified (`npm run build` on the client, syntax-checked and
  boot-tested on the server) and the HTTP contract between them - including
  CORS - was tested directly with `curl`.
- **Not yet verified**: a live login → dashboard walkthrough against a real
  Firebase project, since this environment can't reach Firebase's emulator
  download servers or a real Firebase backend. Once you connect a real (or
  emulated, on your own machine) Firebase project per `SETUP.md`, this should
  be the first thing you test.

## What "Done" means for Phase 3

- **Search**: Firestore has no native free-text search, so search works via
  a maintained lowercase `searchIndex` array field (tokens: name parts,
  phone, email) using `array-contains`. This is a deliberate, visible
  approach rather than a hidden dependency — noted in `userService.js`. At
  larger scale you'd swap this for a dedicated search index
  (Algolia/Typesense/Elasticsearch) without changing the API contract.
- **Edit + audit**: updating a user only accepts an allowlisted set of
  fields (never `role`, `id`, etc. — enforced by a `.strict()` Zod schema,
  verified directly). Every changed field writes its own audit log entry
  with old/new values, except fields marked sensitive (currently just
  `aadhaarNumber`), which log that a change happened without the values,
  per spec Section 18.
- **Profile tabs**: Personal Information, Contact Information, and Activity
  are real and wired to the API. Applications, Documents, Conversations,
  Payments, and Refunds tabs show a "coming soon" state — they depend on
  data models from later phases.
- Verified: backend syntax-checked and boot-tested with the new routes,
  auth/authorization confirmed to reject requests before validation runs,
  the `.strict()` schema confirmed (via a direct Node script) to reject a
  `role` field even if included in a request body. Frontend build and lint
  both pass clean. Not yet verified: an actual login → search → edit →
  see-it-in-Activity walkthrough against real Firestore data, for the same
  reason noted in Phase 1/2 — no Firebase/emulator access in this sandbox.

## What "Done" means for Phase 4

- **Applications carry denormalized display fields** (`userName`, `schemeName`,
  `amount`, `paymentStatus`) written at creation time rather than joined
  across collections on every list request — a documented performance
  decision, not a shortcut. Full payment record management (the `payments`
  collection itself) is still Phase 8; for now `amount`/`paymentStatus` are
  read directly off the application document.
- **Status enum is enforced server-side**: `APPROVED`/`REJECTED` are
  rejected by the Zod schema — verified directly, not just assumed from the
  spec (see Section 15). Only the exact seven statuses are ever accepted.
- **Scheme filtering** needed a way to list schemes before Schemes CRUD
  (Phase 7) exists, so a minimal **read-only** `GET /api/schemes` was added
  now. Phase 7 will extend the same `schemeService.js`/`schemeRoutes.js`
  files with create/update/activate endpoints — this file isn't a throwaway,
  it's the foundation Phase 7 builds on.
- **Application detail tabs**: Overview (status change + internal notes,
  both fully working and audited), User Information (read-only summary
  pulled live from the linked user, links out to the full editable
  profile), and Activity (real audit trail) are functional. Documents,
  Conversation, and Payment tabs show "coming soon" — they depend on data
  models from Phase 5/6/8. Reply-to-user, request-information,
  request-document, request-OTP, and request-refund actions are similarly
  not yet buildable and are called out directly in the UI rather than
  shown as non-functional buttons.
- Verified: backend syntax-checked and boot-tested with the new routes; a
  full sweep of every route group confirmed correct 401s (not 500s/crashes)
  without a token; the status-enum enforcement was unit-verified directly
  against the validator. Frontend build and lint both pass clean. Not yet
  verified: a live walkthrough against real Firestore data (same
  limitation noted in earlier phases).

## What "Done" means for Phase 5

- **"Real-time" is polling, not Firestore client-side listeners** - this is
  a deliberate, documented decision, not a shortcut taken silently. True
  Firestore listeners from the browser would need this JWT-based backend to
  mint Firebase custom auth tokens (`admin.auth().createCustomToken`) and
  the frontend to sign in with the Firebase Web SDK just to satisfy
  Firestore security rules - a real architectural addition on top of
  everything else, not a small tweak. Spec Section 46 explicitly allows
  "Firestore real-time listeners **or an equivalent real-time mechanism**",
  so the conversation view instead polls `GET /messages?since=<timestamp>`
  every 4 seconds while open, appending only genuinely new messages. This
  is a real, working mechanism - not a fake "loading" spinner - it's just
  not sub-second. If you want true push-based listeners later, the
  `since`-based polling shape you already have would remain useful as a
  fallback/reconnect path even after adding them.
- **Only ADMIN-authored messages are ever written from this panel.** AI and
  USER messages are read-only here - they're expected to come from the
  user-facing app/chatbot (out of scope for this project), and seed data
  fakes a few of each so the admin reply flow has something real to work
  against.
- **Conversation state** (`OPEN`/`CLOSED`) is deliberately minimal since the
  spec (Section 57) explicitly leaves exact status naming undecided - noted
  directly in `constants/conversationStates.js` rather than silently
  expanded.
- Internal notes in the conversation view reuse the exact same
  `internalNotes` API built in Phase 4 (application-scoped) - a
  conversation always belongs to exactly one application, so there's one
  notes thread, visible from both the conversation and the application
  detail page, not two parallel systems.
- The Applications detail page's Conversation tab (previously "coming
  soon") now links straight into the real conversation via a new
  `GET /conversations/by-application/:applicationId` lookup route.
- Verified: backend syntax-checked and boot-tested with the new routes; a
  full route sweep confirmed correct 401s; route ordering for
  `/by-application/:applicationId` vs `/:id` was specifically checked so
  the more specific route isn't swallowed by the generic one. Frontend
  build and lint both pass clean. Not yet verified: an actual live
  multi-message conversation walkthrough (including watching the poll pick
  up a new message) against real Firestore data - same limitation noted in
  every earlier phase.

## Known issue found and fixed: missing Firestore composite indexes

Phases 3-5 shipped without composite indexes for several filter+sort query
combinations. This was missed during my own verification because I could
only test against an *unconfigured* Firebase instance in this sandbox
(network restrictions block Firebase's servers) - I verified routes
returned the correct status codes (401 unauthenticated, etc.), but never
exercised an actual Firestore query end-to-end, so a whole class of bug
(missing composite indexes) was invisible to that testing. I flagged this
limitation in every phase above, but should be direct about what it
actually cost: a real user hit a live `FAILED_PRECONDITION` error opening
a conversation and its messages.

**Fix**: `server/firestore.indexes.json` now defines every composite index
needed by every filter/sort combination reachable through the current API
(50 indexes total - see the file for the full list, generated
systematically from an audit of every `.where()`/`.orderBy()` call in
`server/services/*.js`, not just the one that errored). `server/firebase.json`
points at it. Deployment instructions are in `SETUP.md` step 4.

If you hit a similar error on a query path this audit didn't anticipate,
Firestore's error message includes a direct link that creates the missing
index for you - that always works as an immediate fix, independent of
whether it's already in the committed file.

## What "Done" means for Phase 6

- **Information requests** (Section 23) support both TEXT and STRUCTURED
  types via a discriminated Zod union - verified directly that each shape
  is validated correctly and that an invalid `type` is rejected. The user's
  response arrives through the existing chat/application flow (out of
  scope here to build); this panel creates the request and will display
  `userResponse` once some other process (the real user-facing app) writes
  it - no endpoint here fabricates a response.
- **OTP requests** (Section 26) create a real Firestore record and a real,
  correctly-worded audit entry ("Admin requested Government Portal OTP"),
  but do **not** send an actual SMS - no SMS gateway is configured, the
  same "external integration not yet decided" situation as the payment
  provider (Section 29/54). This is a deliberate, documented gap, not a
  fake button: the admin-facing action (creating the request, tracking its
  lifecycle) is fully real. Structurally guaranteed never to store a raw
  OTP value: there is no field anywhere in the schema capable of holding
  one, so this isn't a policy that could be violated by a future mistake.
- **Documents** (Sections 24/25): list, verify, and request-re-upload are
  fully real and audited. Download works via a genuine 10-minute signed
  Storage URL - never a public link. Seed data creates document *metadata*
  only (no real files uploaded to Storage, since uploading is the
  user-facing app's job, out of scope here), so downloading a seeded
  document will correctly 404 with a clear explanation rather than silently
  failing - that's the honest behavior of a real signed-URL lookup against
  data that was never uploaded, demonstrated in the seed script's own
  comments.
- Verified: backend syntax-checked and boot-tested with every new route; a
  full route sweep confirmed correct 401s (and one correct 404 for a
  PATCH-only route hit with GET); the information-request/OTP validators
  were unit-verified directly. Frontend build and lint both pass clean (one
  unused-import lint warning was caught and fixed during this pass). Not
  yet verified: a live walkthrough against real Firestore/Storage data -
  same limitation noted in every earlier phase, compounded here by Storage
  also needing real file uploads to fully exercise the download path.

## Nav items that exist but aren't built yet

The sidebar shows all sections from the spec (Applications, Users,
Conversations, Documents, Schemes, Payments, Refunds, Notifications, Audit
Logs, Admins) so the information architecture is visible early. Clicking into
an unbuilt section shows a plain "coming soon" page - not a fake button that
pretends to do something. As each phase lands, its `implemented: false` flag
in `client/src/constants/navigation.js` flips to `true` and the real page
replaces the placeholder route in `client/src/App.jsx`.
