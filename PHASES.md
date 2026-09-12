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
| 7 | Government schemes (dynamic fields, dynamic documents, CRUD) | ✅ Done |
| 8 | Payments / Refunds (provider abstraction, Super Admin approval) | ✅ Done |
| 9 | Notifications (FCM - individual, group, broadcast) | ✅ Done |
| 10 | Admin management (add/remove Admin, activity log) | ✅ Done |
| 11 | Audit logs, security hardening, permission testing, production cleanup | ✅ Done |

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

## Known issue found and fixed: standalone Documents page was never built, and its index was missing too

The sidebar's "Documents" link was left `implemented: false` since Phase 6,
because only the per-application Documents tab (inside an Application's
detail page) was actually built then - the standalone page that lists
documents across *all* applications, matching how Users/Applications/
Payments already work, was never implemented. This surfaced when the
person building against this app clicked "Documents" in the sidebar and
got the honest "coming soon" placeholder instead of a working page.

**Fixed**: added `GET /api/documents` (list, with status filter and
pagination) and the corresponding `client/src/pages/Documents/Documents.jsx`
page, reusing the same verify/download/request-reupload actions already
built for the per-application tab. The nav item is now `implemented: true`.

**A second, more serious bug surfaced while fixing this**: auditing the
`documents` collection's Firestore indexes for the new list endpoint
revealed the collection had **zero** composite indexes defined at all -
including for the *existing* per-application query
(`listDocumentsForApplication`, `applicationId == / orderBy(uploadedAt)`),
which has needed one since Phase 6 and never had it. This means the
per-application Documents tab has likely been hitting the same
`FAILED_PRECONDITION` error as `messages`/`internalNotes` did earlier,
just not yet reported. All 7 needed composite indexes for `documents`
(covering status/type/applicationId filter combinations) have now been
added - `firestore.indexes.json` is at 68 total. **This needs a fresh
`firebase deploy --only firestore:indexes` to take effect.**

## Known issue found and fixed: two indexes missing from the committed file

While deploying indexes via `firebase deploy --only firestore:indexes`, the
CLI flagged two indexes that existed in the live Firebase project (created
earlier via the auto-generated links Firestore provides on a
`FAILED_PRECONDITION` error) but were missing from the committed
`firestore.indexes.json`: `informationRequests` (applicationId + createdAt)
and `otpRequests` (applicationId + requestedAt). Both are genuinely
required by `informationRequestService.js`/`otpService.js`'s list queries

- an omission in my original audit, not indexes that should be deleted.
  Both are now in the file (59 total). If `firebase deploy` ever flags an
  index as "not present in your file" again, treat that as a signal to add
  it to the file, not to delete it, unless you're certain it's genuinely
  unused.

## Known issue found and fixed: missing Firestore composite indexes

Phases 3-5 shipped without composite indexes for several filter+sort query
combinations. This was missed during my own verification because I could
only test against an _unconfigured_ Firebase instance in this sandbox
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
  Storage URL - never a public link. Seed data creates document _metadata_
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

## What "Done" means for Phase 7

- **This extends, not replaces, the read-only `schemeService.js` from
  Phase 4** - exactly as flagged in that phase's comments at the time. The
  Applications filter dropdown and this full CRUD page now share the same
  service and Firestore documents.
- **Dynamic fields/documents (Section 28)** are plain string arrays
  (`requiredFields`, `requiredDocuments`) editable from the UI with no code
  changes required to add a new scheme - matching the spec's own example
  ("Fields: Name, DOB, Address, Income, Occupation") exactly, rather than
  inventing a richer per-field type/required schema the spec didn't ask
  for. A new scheme with entirely different fields/documents is addable
  purely through the Schemes page.
- **Both Admin and Super Admin can manage schemes** - per Section 4/5's
  permission tables, "Add/edit government schemes" and
  "Activate/deactivate schemes" are listed under plain Admin, not
  restricted to Super Admin. Enforced server-side like every other
  permission in this app.
- **Status changes are never foldable into a generic edit** - the
  `updateSchemeSchema` is `.strict()` and has no `status` field at all, so
  activating/deactivating always goes through the dedicated
  `PATCH /:id/status` route and is always logged as `SCHEME_ACTIVATED`/
  `SCHEME_DEACTIVATED` specifically, never folded into a generic
  `SCHEME_UPDATED` entry - verified directly that `status` in the update
  body is rejected.
- **Price changes get a dedicated audit entry** (`PRICE_UPDATED`, with
  old/new values) in addition to the general `SCHEME_UPDATED` entry,
  matching the spec's own distinct audit action for price changes
  (Section 33) - not merged into a generic diff the way most other
  fields are.
- Verified: backend syntax-checked and boot-tested with every new route; a
  full route sweep confirmed correct 401s on every mutation endpoint
  (create/update/status); every validator behavior (negative price
  rejected, empty required-fields list rejected, `status` rejected on the
  generic update endpoint, valid ACTIVE/INACTIVE accepted on the status
  endpoint) was unit-verified directly against real input. Frontend build
  and lint both pass clean. Not yet verified: a live walkthrough against
  real Firestore data - same limitation noted in every earlier phase.

## What "Done" means for Phase 8

- **Payment provider abstraction**: `server/services/payment/PaymentProvider.js`
  defines the contract (`verifyPayment`, `createRefund`); `MockPaymentProvider.js`
  is a clearly-labeled development-only implementation; `payment/index.js`
  is a factory keyed off `PAYMENT_PROVIDER` in `.env`. Swapping in a real
  gateway later means writing one new file implementing the same contract
  and changing one env var - `paymentService.js` and `refundService.js`
  never reference a specific provider.
- **The critical permission boundary - Admin can request a refund but
  cannot approve/reject one - was verified by directly unit-testing the
  actual `authorize()` middleware function**, not by re-deriving the logic
  or just trusting the route wiring looks right. Confirmed: `ADMIN` is
  blocked from a Super-Admin-only route, `SUPER_ADMIN` is allowed through,
  and `ADMIN` is allowed on a both-roles route. This is the same middleware
  every route in the app uses, so this test result generalizes.
- **Refundable-amount validation** happens twice: once when a refund is
  requested (rejecting zero/negative amounts or amounts exceeding the
  original payment), and again when it's approved (in case another refund
  completed in the interim and the balance changed) - not just validated
  once at creation and trusted afterward.
- **Index audit caught a subtlety this codebase hadn't needed before**:
  `findRefundablePaymentForApplication` combines an equality filter with an
  `in` filter, which Firestore requires a composite index for even without
  an `orderBy` - unlike pure equality-only multi-field queries (like
  `getAlreadyRefundedAmount`'s `paymentId == / status ==`), which Firestore
  handles automatically. `firestore.indexes.json` grew from 50 to 57
  entries for this phase; each addition is commented with which query it
  serves and, where relevant, why an index was deliberately _not_ added.
- **Applications' denormalized `paymentStatus` field (from Phase 4) is kept
  in sync** when a refund completes - `refundService.js` updates both the
  `payments` and `applications` documents so the Applications list still
  shows accurate payment status without a second source of truth drifting
  out of date.
- Verified: backend syntax-checked and boot-tested with every new route; a
  full route sweep confirmed correct 401s on every endpoint including
  refund approve/reject; every refund validator behavior (zero/negative
  amount rejected, missing reason rejected, invalid refund type rejected)
  was unit-verified directly, alongside the authorize() middleware test
  described above. Frontend build and lint both pass clean. Not yet
  verified: a live walkthrough against real Firestore data, including
  actually watching an approval move a payment from SUCCESSFUL to
  PARTIALLY_REFUNDED - same limitation noted in every earlier phase.

## What "Done" means for Phase 9

- **Send targets**: Individual, Selected Group, and Everyone are all
  implemented with a real discriminated-union validator (unit-verified
  directly - invalid recipient types rejected, empty group selections
  rejected, EVERYONE correctly requires no recipient list).
- **Delivery is genuinely attempted through Firebase Cloud Messaging for
  any recipient with a registered device token** - but registering that
  token is the user-facing app's job (out of scope here, per the project
  brief), so seed/development users won't have one. Sends to them are
  honestly counted as "skipped (no device registered)", not silently
  dropped or falsely reported as delivered - the same documented-gap
  pattern as the OTP SMS gateway and payment provider. The delivery result
  shown after sending states this plainly rather than looking like a
  success.
- **Deep linking** (Section 31): an optional `relatedApplicationId` is
  included as FCM `data` payload for a real client app to route on. No
  application picker UI was built for this field - it's a plain text
  input - since the admin would need to already know the ID; a proper
  picker is a reasonable follow-up if this field sees real use.
- **Not built in this phase**: Section 48's notification-count badges on
  the sidebar (Applications: 12, Chats: 5, etc.) - that's a
  cross-cutting UI feature touching every section's nav item, not
  specific to the Notifications feature itself, and wasn't silently
  dropped - it's called out here as unbuilt rather than left unmentioned.
- Verified: backend syntax-checked and boot-tested with every new route; a
  full route sweep confirmed correct 401s; every discriminated-union
  validator path was unit-verified directly against real input (all three
  recipient types, plus their specific rejection cases). Frontend build and
  lint both pass clean. Not yet verified: a live send against real
  Firestore/FCM - same limitation noted in every earlier phase, compounded
  here by FCM delivery also needing a real registered device token to
  exercise the "sent" path at all (as opposed to "skipped").

## What "Done" means for Phase 10

- **The entire `/api/admins` router is Super Admin only** - verified by
  directly unit-testing the actual `authorize()` middleware (the same test
  pattern used for the refund approve/reject boundary in Phase 8):
  confirmed `ADMIN` is blocked and `SUPER_ADMIN` is allowed on every route
  in this router.
- **"Removing" an admin sets `status: 'REMOVED'` rather than deleting the
  Firestore document.** This is deliberate: `authenticate.js`'s existing
  Phase 1 logic already rejects any non-`ACTIVE` admin on every request,
  so this immediately and correctly revokes access - matching the
  confirmation dialog's exact wording ("This will revoke admin access") -
  while keeping that admin's id valid as an `actorId` reference in every
  audit log entry they ever created. Hard-deleting would have orphaned
  that history.
- **Two lockout safety guards**, neither explicitly required by the spec
  but necessary for the feature to be safe to use: a Super Admin cannot
  remove their own account, and cannot remove the last remaining active
  Super Admin (which would leave nobody able to manage admins at all).
  Both are implemented as explicit, clearly-worded `ApiError`s, not silent
  no-ops.
- **Admin activity** (Section 32/34) reuses the exact same
  `auditService.listAuditLogs({ actorId })` function written back in
  Phase 1 but never exposed through a route until now - confirmed this by
  reading, not rewriting, that function. A composite index
  (`auditLogs`: actorId + timestamp) was added since this filter is now
  actually reachable via `GET /api/admins/:id/activity`.
- **Index bookkeeping**: while deploying indexes for this project, two
  indexes were found to exist in the live Firebase project but were
  missing from the committed `firestore.indexes.json`
  (`informationRequests`, `otpRequests`) - an omission from an earlier
  phase's audit, now corrected. See the "Known issue" note above this
  table. Total is now 60 indexes.
- Verified: backend syntax-checked and boot-tested with every new route; a
  full route sweep confirmed correct 401s on every admin-management
  endpoint; the admin creation validator was unit-verified directly
  (short password rejected, invalid email rejected, invalid role
  rejected, both ADMIN and SUPER_ADMIN roles accepted). Frontend build and
  lint both pass clean. Not yet verified: a live walkthrough against real
  Firestore data, including actually attempting the two lockout guards
  against real records - same limitation noted in every earlier phase.

## What "Done" means for Phase 11

- **Audit Logs page** (Section 33/34): a new `GET /api/audit-logs` endpoint,
  restricted to Super Admin only - matching the spec's own distinction
  between Section 5's Super-Admin "View complete audit logs" and Section
  4's plain-Admin "View relevant activity/audit information" (the latter
  is exactly what the existing entity-scoped views on Users/Applications/
  Admins already provide to both roles). `auditService.listAuditLogs` was
  extended with pagination and date-range filtering - this required
  updating its three existing callers (user, application, and admin
  activity views), whose code assumed the old return shape.
- **The Audit Logs UI deliberately filters by one dimension at a time**
  (Admin, Action, or Entity), always combinable with a date range, rather
  than allowing arbitrary combinations of independent filters. This is the
  same bounded-index approach used for Applications/Payments/Refunds -
  arbitrary combinations would need a combinatorial number of Firestore
  composite indexes. One new index (`action` + `timestamp`) was added;
  total is now 61.
- **A real, runnable permission test suite**
  (`server/test/authorize.test.js`, run via `npm test`) using Node's
  built-in test runner - no new dependency for a codebase this size. It
  tests the actual `authorize()` middleware used by every route, not a
  redescription of it, against the exact matrix from spec Section 53 (Admin
  → Add Admin: DENIED, Super Admin → Add Admin: ALLOWED, etc.) plus several
  more permission-table checks from Section 43. **Run and confirmed passing:
  13/13.**
- **Security/production-cleanup audit** - performed with small verification
  scripts rather than manual inspection, so the claims below are checked,
  not asserted:
  - Every route except `POST /auth/login` requires `authenticate` -
    confirmed by parsing every `router.METHOD(...)` call in every route
    file and checking its middleware list, not by eyeballing.
  - Every authenticated route also carries an explicit role check
    (`authorize(...)`, `bothRoles`, or `superAdminOnly`) - same
    parsing-based check, zero exceptions found.
  - No stray `console.log`/`console.error` calls beyond the ones that
    belong there (server startup, centralized error logging, the seed
    script's clearly-labeled dev-credential printout, which already carries
    its own "change these passwords" warning) - confirmed by grep across
    both `server/` and `client/src/`. Zero `console.*` calls exist in the
    frontend at all.
  - No `TODO`/`FIXME`/`XXX` markers anywhere in the codebase.
  - helmet, CORS (origin-restricted via env var), and rate limiting
    (general + login-specific) are all wired in `server.js` - present since
    Phase 1, reconfirmed here rather than assumed still correct.
- Verified: backend syntax-checked and boot-tested with the new route; a
  full route sweep confirmed correct 401s; the permission test suite was
  actually executed (not just written) and passed 13/13, both before and
  after a clean `npm install`. Frontend build and lint both pass clean.
  Not yet verified: a live walkthrough of the Audit Logs UI against real
  Firestore data with entries spanning multiple actors/actions/entities -
  same limitation noted in every earlier phase.

## Nav items that exist but aren't built yet

The sidebar shows all sections from the spec (Applications, Users,
Conversations, Documents, Schemes, Payments, Refunds, Notifications, Audit
Logs, Admins) so the information architecture is visible early. Clicking into
an unbuilt section shows a plain "coming soon" page - not a fake button that
pretends to do something. As each phase lands, its `implemented: false` flag
in `client/src/constants/navigation.js` flips to `true` and the real page
replaces the placeholder route in `client/src/App.jsx`.
Yolo test badge
