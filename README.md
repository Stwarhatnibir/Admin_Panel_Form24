# Government Scheme Application — Admin Panel

A standalone admin management system for a government-scheme application
service. It consumes user, application, chat, payment, and document data
through a Node.js/Express API backed by Firebase (Firestore, Storage, FCM).

**This is the admin panel only.** The end-user-facing application and AI
chatbot referenced throughout the spec already exist conceptually elsewhere
and are out of scope here — this system is built to receive and act on their
data, not to replace them.

```
admin-panel/
├── server/     Node.js + Express API (JWT auth, Firestore, role middleware)
├── client/     React admin panel (Vite, React Router, Tailwind)
├── PHASES.md   Build order and current status
└── SETUP.md    How to configure Firebase and run locally
```

## Quick start

See [`SETUP.md`](./SETUP.md) for full instructions. In short:

```bash
# backend
cd server && cp .env.example .env   # fill in Firebase credentials
npm install && npm run seed && npm run dev

# frontend (separate terminal)
cd client && cp .env.example .env
npm install && npm run dev
```

Then open http://localhost:5173 and log in with the credentials printed by
`npm run seed`.

## Current status

All 11 build phases are complete: Authentication, Admin layout/Dashboard,
Users, Applications, Chat/Conversations, Information Requests/Documents/OTP,
Government Schemes, Payments/Refunds, Notifications, Admin management, and
Audit Logs/security hardening/permission testing.
See [`PHASES.md`](./PHASES.md) for the full roadmap, what's been verified,
and what's still open.

## Roles

Two roles only: `ADMIN` and `SUPER_ADMIN`. Every permission is enforced on
the backend (`server/middleware/authorize.js`), never trusted from the
frontend. See Section 4/5/43 of the original product spec for the full
permission matrix — it's mirrored in the codebase but the backend is always
the source of truth.

## Payment gateway

Not yet decided. The codebase is structured around a `PaymentService`
abstraction (to be implemented in Phase 8) so a real provider can be plugged
in later without touching application logic. Do not hardcode a specific
provider.
