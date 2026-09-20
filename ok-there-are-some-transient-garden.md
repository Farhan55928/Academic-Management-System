# Fix slow-network failures: false "Invalid Credentials" and failed semester/course loads

## Context

Two bugs, both reported only on slow/poor internet:

1. Semester and course info fails to load with a "failed to fetch"-class error **even though the user is logged in**.
2. Logging in with **correct credentials** shows **"Invalid Credentials"**.

Investigation shows these are one defect wearing two masks: **infrastructure failure is being reported as an authentication failure.** Two independent proofs:

- The string `"Invalid credentials"` **does not exist anywhere in the backend.** The backend's real 401 is `'Invalid email or password'`. So seeing "Invalid Credentials" proves the request never returned a parseable JSON body — it is `frontend/src/pages/Login/LoginPage.jsx:21`'s hardcoded fallback firing on a network/timeout failure.
- `backend/src/middleware/authMiddleware.js:18-29` wraps **both** `jwt.verify` **and** the `User.findById` DB call in one try/catch, so *any* database hiccup returns **401 "Not authorized, token invalid"** on a perfectly valid token.

Underneath both sits the real trigger: `backend/src/config/db.js` has **no connection caching**, so every Vercel cold start re-runs the full Atlas handshake, with no timeouts configured and a `process.exit(1)` that hard-crashes the lambda on a transient failure.

**Outcome:** failures largely stop happening; when they do, the UI tells the truth and offers a retry.

**Decisions made:** full backend + frontend fix; keep `protect`'s user lookup but return 503 on DB error; auto-retry GETs with backoff *plus* a Retry button; add `GET /api/courses/:id`.

---

## Phase 0 — Backend: serverless-safe Mongo connection

**`backend/src/config/db.js`** — rewrite. Cache the connection *promise* on `globalThis` so warm invocations reuse it and concurrent requests share one in-flight handshake:

```js
mongoose.set('bufferCommands', false);  // fail fast instead of 10s silent buffer
const cache = globalThis.__amsMongoose ??= { conn: null, promise: null };

export const connectDB = async () => {
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;
  if (!cache.promise) {
    if (!process.env.Mongo_URI) throw new Error('Mongo_URI is not set');
    cache.promise = mongoose.connect(process.env.Mongo_URI, {
      serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000, socketTimeoutMS: 20000,
      maxPoolSize: 5, minPoolSize: 0, maxIdleTimeMS: 30000,
    }).then(m => { cache.conn = m; return m; })
      .catch(err => { cache.promise = null; throw err; });  // allow retry next request
  }
  return cache.promise;
};
export const dbState = () => mongoose.connection.readyState;
```

Removes `process.exit(1)`; drops the vestigial `(req, res)` signature.

> `bufferCommands:false` makes queries throw instantly if run before connect resolves. **Do not merge without 0.2.** Verify `seed.js` and `scripts/migrateOwnership.js` await `connectDB()` before querying.

**`backend/src/middleware/dbMiddleware.js`** (new) — `ensureDb`: `await connectDB()`, else `503 { code: 'DB_UNAVAILABLE', message: 'Service temporarily unavailable. Please try again.' }`. 503 is the contract the frontend keys off.

**Split `backend/server.js`** — it currently has no `export default app`; `app.listen` is gated behind the Atlas handshake.
- **`backend/src/app.js`** (new): the entire current `server.js` body verbatim, plus — `app.use(ensureDb)` after `express.json()` but *after* the DB-free `GET /` liveness route; a `GET /api/health` returning `{ ok, readyState, connectMs }` (the main verification tool); a **global error handler last** that maps `MongooseServerSelectionError` / `MongoNetworkError` / `/buffering timed out/` → 503, else 500. Ends `export default app;` with **no `listen`, no `connectDB().then()`**. Express 5 auto-forwards async rejections here.
- **`backend/server.js`**: shrinks to `import app` + `app.listen(PORT)`. `npm run dev`/`start` unchanged, but now binds immediately and connects lazily.
- **`backend/api/index.js`** (new): `import app from '../src/app.js'; export default app;`

**`backend/vercel.json`** — the legacy `builds`/`routes` schema cannot express `maxDuration`. Replace (do **not** merge — the keys are mutually exclusive):
```json
{ "functions": { "api/index.js": { "maxDuration": 30 } },
  "rewrites": [{ "source": "/(.*)", "destination": "/api" }] }
```

> Deploy checks: env var is spelled exactly `Mongo_URI` (capital M, uppercase URI); Atlas Network Access allows `0.0.0.0/0` (Vercel egress IPs are not static — an IP-blocked cluster gives exactly this "works locally, times out in prod" signature).

---

## Phase 1 — Backend: honest error semantics

**`backend/src/middleware/authMiddleware.js`** — *the fix for symptom #1.* Split the single try/catch:
- `jwt.verify` in its own try → **401** (`TOKEN_EXPIRED` / `TOKEN_INVALID`). Purely local, cannot fail from network.
- `User.findById(decoded.id).select('_id email').lean()` in a separate try → missing user is **401 `USER_NOT_FOUND`**; a thrown DB error is **503 `DB_UNAVAILABLE`**.

`.lean()` is verified safe: across all `req.user` references the backend only ever reads `req.user._id` and (once, in `getMe`) `req.user.email` — no document methods.

**`backend/src/controllers/authController.js`** — *the backend half of symptom #2.* Wrap `User.findOne` in its own try → 503 on DB error, so a buffering timeout can no longer become the 500 the UI renders as a credential failure. Keep `matchPassword` outside `.lean()` (it's a document method). Add `code` fields: `INVALID_CREDENTIALS`, `MISSING_FIELDS`, `SERVER_ERROR`.

**Contract established:** every error body is `{ code, message }`; 503/`DB_UNAVAILABLE` is the single "not your fault, retry" signal.

---

## Phase 2 — Backend: round-trip reduction

**`GET /api/courses/:id`** (must deploy before 4.4). Add `getCourseById` to `backend/src/controllers/courseController.js` (`Course.findOne({ _id, userId: req.user._id }).lean()`, 404 `NOT_FOUND`) and register in `app.js` beside the existing standalone routes: `app.get('/api/courses/:id', protect, getCourseById)`.

> Follow the `server.js`/`app.js` standalone pattern — **not** `courseRoutes.js`. That router's `/:id` PUT/DELETE at lines 20-21 are dead duplicates (it's only mounted under `/api/semesters/:semesterId/courses`; the live ones are registered separately). Purely additive, so old frontend builds keep working.

**`.lean()` on hot reads** — `semesterController.getSemesters`, `courseController.getCourses`, and all `dashboardController` queries (then delete the now-redundant `.toObject()` calls). Dashboard currently hydrates *every* attendance/lab/marks doc only to `.slice(0,5)`.

> Attendance records also feed per-course `stats`, so they **cannot** be `.limit(5)`-ed. Safest diff: limit labs/marks only, leave attendance unlimited but `.select()`-projected.

Add indexes: `{ userId: 1, semester: 1 }` on `Course`; `{ course: 1, updatedAt: -1 }` on the three record models.

---

## Phase 3 — Frontend: error normalization (*the fix for symptom #2*)

**`frontend/src/api/errors.js`** (new — genuinely warranted; there is no error abstraction today and ~15 catch sites each invent their own wrong message). Exports `classifyError(err)` → `{ kind, message, status, code, retryable }` and `errorMessage(err, fallback)`. Kinds: `OFFLINE` (via `navigator.onLine`), `TIMEOUT` (`ECONNABORTED`), `NETWORK` (no `err.response`), `GATEWAY` (HTML body or 502/504 — Vercel's cold-start page), `AUTH`, `UNAVAIL` (503), `NOTFOUND`, `SERVER`, `CLIENT`, plus a `canceled` kind callers ignore. Retryable = `TIMEOUT | NETWORK | GATEWAY | UNAVAIL`.

The `!err.response` and `GATEWAY` branches are precisely what kill symptom #2's two paths.

**`frontend/src/api/axios.js`** — add `timeout: 15000` and a response interceptor that: retries **idempotent GETs only** up to 2× with exponential backoff + jitter on retryable errors; on a genuine `AUTH` error that is **not** `/auth/login`, clears `ams_token`/`ams_user` and redirects to `/login`; attaches `error.info` for every caller.

> `POST /auth/login` is deliberately never retried — a slow login fails once honestly rather than triple-submitting.
> The 401 auto-logout is **new behavior and must ship after Phase 1**. Against the current backend it would log people out on every slow cold start.
> Budget: Mongo 5s < axios 15s/attempt < Vercel 30s; worst case ≈47s with 2 retries. Mitigate in UI (swap spinner copy to "Still working — your connection looks slow…" after ~6s) rather than shrinking the timeout; drop to `MAX_RETRIES=1` (~31s) if preferred.

**`frontend/src/pages/Login/LoginPage.jsx:21`** — replace the fallback. Only a genuine `AUTH` 401 may claim the credentials are wrong; everything else shows the classified message. **The string `'Invalid credentials'` is deleted from the codebase.**

---

## Phase 4 — Frontend: error state + retry UI

**`frontend/src/components/UI/ErrorState.jsx`** (new) — mirrors `EmptyState.jsx`'s props/folder/styling so it drops into existing call sites. Props: `title`, `description`, `onRetry`, `retrying`. Add `.error-state`/`.error-icon` to `index.css` right after the `.empty-state` block (~line 1546), cloning its geometry but accented with the existing `var(--red)` token — **the visual distinction from an empty list is the entire point.**

**`frontend/src/hooks/useAsyncData.js`** (new, beside `useAuth.js`) — the identical loading/error/data/reload quadruple appears in 11 components, all wrong. Returns `{ data, loading, error, reload }`, uses `AbortController` + a `reqId` ref guard so a slow in-flight response can't overwrite a newer one (a real hazard when navigating fast on a slow link). Requires adding an optional `signal` param to `src/api/*.js` functions (`api.get(url, { signal })` — additive, all call sites keep working).

**Render order everywhere becomes `loading → error → empty → data`** — the error check must come *before* the empty check. That single ordering change is what stops failures from masquerading as "you have no data".

| File | Current | Change |
|---|---|---|
| `pages/Semesters/SemesterDetailPage.jsx:25-31` | **no `.catch` at all** → unhandled rejection, silent false "No courses yet" | add try/catch + `error` state + `ErrorState`; keep `PageHeader` eyebrow from claiming a name on failure |
| `pages/Courses/CourseDetailPage.jsx:20-40` | 1+N **sequential** requests; failure → permanent wrong "Course not found" | **depends on Phase 2.** Add `getCourse(id, signal)` to `api/courses.js`; replace the whole scan with one `useAsyncData` call. Split renders: `NOTFOUND` → keep "Course not found"; any other error → `ErrorState`. Move the hash→tab logic out of the loader into the existing `location.hash` effect |
| `components/Layout/Sidebar.jsx:16-21` | refetches `/semesters` on **every route change**, `.catch(() => {})` | change dep array `[location.pathname]` → `[]`. (Hoisting to a shared context is a better follow-up but requires wiring `reload()` into every semester mutation) |
| `pages/Semesters/SemestersPage.jsx:25` | `.catch(() => toast.error('Failed to load'))` | `error` state + `ErrorState` + `onRetry={load}` |
| `pages/Home/DashboardPage.jsx:143-153` | no error state → false "No semester found" | `ErrorState` before the `!activeSemester` branch |
| `pages/Courses/tabs/{Attendance,Marks,Labs}Tab.jsx` | `.catch(() => setLoading(false))` — fully silent | `error` state + `ErrorState` |
| `pages/Backlog/*` | toast-only / two silent `.catch(() => {})` | same treatment |

Finally, one mechanical pass over the ~15 mutation handlers: `toast.error(e?.response?.data?.message || 'Error')` → `toast.error(errorMessage(e))`. Same shape, now correct when `e.response` is undefined.

---

## Phase 5 — Cleanup

Delete verified dead code: `frontend/src/Axios/UseAxiosSecure.jsx` (wrong token key `'token'` vs `'ams_token'`, imports `dotenv` in browser code), `frontend/src/pages/Login/Login.jsx`, `frontend/src/routes/Router.jsx`, and `backend/src/utils/utils.js`'s `authenticateToken` (defined, never imported; returns 403 where `protect` returns 401).

> `Axios/UseAxiosSecure` is also imported by `pages/Home/Home.jsx` and `pages/Home/AddEditNotes.jsx` — both unreachable from `App.jsx`. Delete them together or leave all four in place; do not half-remove.

Update `CLAUDE.md`: add `GET /api/courses/:id`; **correct the phantom `GET /api/semesters/:id`** (the map claims it, `semesterRoutes.js` has no such route); fix "Add route to `frontend/src/routes/Router.jsx`" (routes live in `App.jsx`); document the `{ code, message }` envelope and the 503 contract.

---

## Merge / deploy order

The two Vercel projects deploy independently, so ordering is load-bearing:

1. **Backend PR 1** — Phase 0 + Phase 1. Verify on preview, promote.
2. **Backend PR 2** — Phase 2. Verify `GET /api/courses/:id` with curl.
3. **Frontend PR 1** — Phase 3. *Requires backend PR 1 in production* (401 auto-logout).
4. **Frontend PR 2** — Phase 4. 4.4 *requires backend PR 2 in production*, or every course page 404s.
5. **PR 5** — Phase 5 + docs.

---

## Verification

**Regression test for symptom #2** — DevTools → Network → Request blocking, block `*/api/auth/login`, log in with correct credentials.
✅ "Couldn't reach the server…" ❌ anything containing "credentials".

**Regression test for symptom #1** — block `*/api/semesters*`, open `/semesters/<id>`.
✅ red `ErrorState` with working "Try Again" ❌ "No courses yet". Likewise block `*/api/courses/*` → must not say "Course not found".

**503 ≠ 401 (local, no Atlas needed):**
- Dead DB: `Mongo_URI=mongodb://127.0.0.1:1/ams npm start`, then `curl -i -H "Authorization: Bearer <valid>" localhost:9000/api/semesters` → ✅ `503 DB_UNAVAILABLE` ❌ `401 token invalid`.
- Blackholed (exercises `serverSelectionTimeoutMS`): `Mongo_URI=mongodb://192.0.2.1:27017/ams` → 503 after ~5s, not a 10s buffer timeout.
- Then issue a **second** request — the process must still be alive, proving `process.exit(1)` is gone.
- `POST /api/auth/login` with correct credentials against any of the above → ✅ 503 ❌ 500 "Server error during login".

**Slow network:** DevTools custom throttle — 30 kb/s down, 15 kb/s up, **2000 ms latency** (harsher than built-in Slow 4G). Re-run every page; toggle Offline mid-request for the `OFFLINE` branch.

**Cold start / connection cache:** a fresh deploy always cold-starts.
```
curl -s -w "\ncold: %{time_total}s\n" https://<api>/api/health
curl -s -w "\nwarm: %{time_total}s\n" https://<api>/api/health
```
✅ `connectMs` >0 on the first, ~0 with `readyState: 1` on the second ❌ similar both times (cache not shared) or an HTML body (wrong entrypoint / crash).

**The actual user scenario:** cold start **+** 2000 ms throttling, then log in → must produce either a slow success or an honest "server is waking up" message.

**Regressions after the entrypoint split:** `GET /` returns its JSON banner without touching the DB; `npm run dev` still binds 9000 with hot reload; `node src/seed.js` still connects.

**Pool sanity:** `for i in $(seq 1 20); do curl -s -o /dev/null https://<api>/api/health & done; wait` — Atlas connections settle in the low tens, not spiking toward the M0 ceiling.
