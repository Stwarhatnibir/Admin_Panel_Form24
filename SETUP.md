# Setup

## 1. Firebase project

You need a Firebase project with **Firestore** and **Storage** enabled
(Cloud Messaging can be added when you reach Phase 9).

1. Create/select a project at https://console.firebase.google.com
2. Enable **Firestore Database** (production mode is fine - the backend
   uses the Admin SDK, which bypasses security rules).
3. Enable **Storage**.
4. Go to Project Settings → Service Accounts → Generate new private key.
   This downloads a JSON file with `project_id`, `client_email`, and
   `private_key`.

## 2. Backend

```bash
cd server
cp .env.example .env
```

Fill in `.env` from the service account JSON:

```
FIREBASE_PROJECT_ID=<project_id>
FIREBASE_CLIENT_EMAIL=<client_email>
FIREBASE_PRIVATE_KEY="<private_key, keep the \n escape sequences as-is>"
FIREBASE_STORAGE_BUCKET=<project_id>.appspot.com
JWT_SECRET=<generate a long random string>
```

Then:

```bash
npm install
npm run seed   # creates Super Admin + 2 Admins, 10 fake users, 3 fake schemes, 25 fake applications, 12 fake conversations, information requests / document metadata / OTP requests, payment records, refund requests, and sample notifications
npm test       # runs the permission test suite (no Firebase connection needed - pure middleware logic)
npm run dev    # starts the API on http://localhost:5000
```

Confirm it's up: `curl http://localhost:5000/api/health` should return
`"firebaseConfigured": true`.

## 3. Frontend

```bash
cd client
cp .env.example .env   # VITE_API_BASE_URL should point at your backend
npm install
npm run dev             # starts on http://localhost:5173
```

Log in with the Super Admin credentials printed by `npm run seed`.

## 4. Deploy Firestore composite indexes

Several list/filter/sort queries in this app need Firestore composite
indexes (e.g. filtering conversations by user while sorting by last
message time). Without them, those specific queries fail with a
`FAILED_PRECONDITION: The query requires an index` error - the rest of the
app keeps working, only the specific filtered/sorted query is affected.

Deploy the indexes already defined in `server/firestore.indexes.json`:

```bash
npm install -g firebase-tools   # if you don't already have it
firebase login
cd server
firebase use --add              # select your Firebase project
firebase deploy --only firestore:indexes
```

Indexes take a minute or two to build after deploying. You can check
progress in the Firebase Console under Firestore Database → Indexes.

Alternatively, Firestore errors include a direct link that auto-fills and
creates the specific missing index for you - either approach works, but
deploying the full file up front avoids hitting these one at a time as you
click through the app.

## 5. Local Firestore emulator (optional, for development without touching real data)

```bash
npm install -g firebase-tools
firebase login
firebase init emulators   # choose Firestore
firebase emulators:start --only firestore
```

Then set `FIRESTORE_EMULATOR_HOST=localhost:8080` in `server/.env` before
starting the backend - the Admin SDK will automatically route to the
emulator instead of production Firestore.

## Notes

- No payment provider is configured yet (`PAYMENT_PROVIDER=mock` in
  `.env.example`). This is intentional - see `PHASES.md` and Section 29/54
  of the original spec. Do not set real payment credentials until a
  provider is chosen.
- Never commit a real `.env` file. `.gitignore` already excludes it.
