# LeadIQ CRM — Critical Audit Report

**Repo:** `muneeb819/leadiq-crm`
**Branch:** `arena/8775bc5a-leadiq-crm` (from `master` @ `3e4b385`)
**Audit date:** 2026-10-08
**Scope:** Full project — all 127 tracked files across `backend/`, `frontend/`, `ai-agents/`, `docker/`, root.

---

## Executive summary

**This project does not run.** The README's 5-command quickstart fails at command 3
(`docker-compose up -d`), because the frontend Docker build cannot even install its
dependencies. Independently, even with that fixed, `next dev` would throw on startup,
and the backend's production build fails on a TypeScript config error.

Beyond the build blockers, **the headline "AI-powered" features are non-functional at
runtime** — not stubbed, but wired to the wrong level of a response envelope. Lead
enrichment crashes, AI scoring silently no-ops, AI email drafts render blank, and
discovered leads are discarded without being saved.

The code that *is* here is reasonably clean and consistently styled. The problem is not
craft; it is that **nothing in this repo has ever been executed end-to-end.**

| Area | Verdict |
|---|---|
| Installs | ❌ Frontend fails (`E404`), ✅ Backend, ✅ AI service |
| Builds | ❌ Backend `tsc` fails (TS6059), ❌ Frontend never reached |
| Lints | ❌ Backend `eslint: not found`; ✅ Frontend config OK |
| Tests | ⚠️ 3 Python tests pass but mock away the code under test; **0 backend tests** |
| Core AI features | ❌ All 4 broken (see P0 §B) |
| Security | ❌ No tenant isolation; AI service unauthenticated and public |
| Docs | ❌ `FILE_TREE.md` documents 45 files that don't exist |

**Scale:** 100 source files / 3,393 lines (backend 1,120 · frontend 1,832 · ai-agents 441), 27 backend endpoints.

---

## How to read the severity levels

- **P0** — Blocks running the product, or is a security exposure. Must fix first.
- **P1** — Feature is present in the UI but does not work.
- **P2** — Hygiene, correctness debt, maintainability.

Every finding below is tagged with how it was verified:
**[EXECUTED]** = I ran it and observed the failure · **[SOURCE]** = read from the repo ·
**[UPSTREAM]** = verified against a third-party package's own shipped code.

---

# P0-A — Build & runtime blockers

### 1. Frontend `npm install` fails — phantom dependency `[EXECUTED]`

`frontend/package.json` declares `"@radix-ui/react-badge": "^1.0.0"`. **That package does
not exist on npm.**

```
$ npm view @radix-ui/react-badge version
npm error 404 Not Found - GET https://registry.npmjs.org/@radix-ui%2freact-badge - Not found
npm error 404  '@radix-ui/react-badge@*' is not in this registry.

$ cd frontend && npm install
npm error 404  '@radix-ui/react-badge@^1.0.0' is not in this registry.
EXIT_CODE=1
```

`docker/Dockerfile.frontend` runs `RUN npm install` → the `frontend` service build fails →
`docker-compose up -d` fails. **The README quickstart is broken at step 3.**

Note the local `src/components/ui/badge.tsx` is a plain `cva`-based component with no Radix
import — the dependency is not needed at all. Removing the line is the fix.

---

### 2. `next.config.ts` is unsupported by the pinned Next.js `[UPSTREAM]`

`frontend/package.json` pins `next@14.1.3`, but the config file is `next.config.ts`.
TypeScript config files were only added in Next.js 15. Verified against Next 14.1.3's own
published tarball:

```js
// next@14.1.3  package/dist/shared/lib/constants.js:313
const CONFIG_FILES = ["next.config.js", "next.config.mjs"];

// next@14.1.3  package/dist/server/config.js:779-783
const nonJsPath = findup.sync([
    `${configBaseName}.jsx`,
    `${configBaseName}.ts`,     // ← matches this repo's next.config.ts
    `${configBaseName}.tsx`,
    `${configBaseName}.json`
], { cwd: dir });
if (nonJsPath?.length) {
    throw new Error(`Configuring Next.js via '${basename(nonJsPath)}' is not supported. Please replace the file with 'next.config.js' or 'next.config.mjs'.`);
}
```

So after fixing #1, `next dev` and `next build` **throw immediately**. Knock-on effect: the
`/api/:path*` rewrite in that config never applies, so there is no same-origin proxy — the
browser talks directly to `http://localhost:4000`.

Fix: rename to `next.config.js` (or `.mjs`), or upgrade to Next 15.

---

### 3. Backend production build fails — `tsconfig` rootDir conflict `[EXECUTED]`

```
$ npm run build
error TS6059: File '.../backend/prisma/seed.ts' is not under 'rootDir' '.../backend/src'.
  'rootDir' is expected to contain all source files.
  The file is in the program because: Matched by include pattern 'prisma/**/*'
BUILD_EXIT=2
```

`backend/tsconfig.json` sets `"rootDir": "./src"` while `"include": ["src/**/*", "prisma/**/*"]`.
Confirmed side effect: the failed compile still emitted build artifacts *next to the source* —
`prisma/seed.js`, `seed.js.map`, `seed.d.ts`, `seed.d.ts.map` (I removed them after verifying).

Consequence: `npm start` → `node dist/index.js` is not a supported path. Only the `nodemon` +
`ts-node` dev loop works, which is why this has gone unnoticed.

Fix: drop `"prisma/**/*"` from `include`.

---

### 4. Backend lint is broken — missing dev dependencies `[EXECUTED]`

```
$ npm run lint
sh: 1: eslint: not found
LINT_EXIT=127
```

`backend/.eslintrc.json` sets `"parser": "@typescript-eslint/parser"`, but **neither `eslint`
nor `@typescript-eslint/parser` appears in `devDependencies`** `[SOURCE]`. The lint script has
never been runnable.

---

# P0-B — The AI features are broken (response-envelope mismatch)

The FastAPI service wraps every response as `{"success": true, "data": <result>}`.
Three backend call sites read one level too shallow. I ran the **real** FastAPI app
(`TestClient` over `main.app`) to capture actual bodies and traced what the backend does with them.

---

### 5. `POST /leads/:id/enrich` → HTTP 500; enrichment never persists `[EXECUTED + SOURCE]`

`backend/src/controllers/leads.controller.ts`:
```ts
const response = await axios.post(`${env.AI_AGENTS_URL}/enrich`, { lead }, ...);
const enriched = await leadService.updateLead(req.params.id, {
  ...response.data,          // ← spreads the ENVELOPE, not the result
  enriched: true, enrichedAt: new Date(),
});
```

Real response body from the live service:
```json
{"success": true, "data": {"notes": "", "tags": []}}
```

Keys actually handed to `prisma.lead.update({ data })`:
```
['success', 'data', 'enriched', 'enrichedAt']
```

I parsed `backend/prisma/schema.prisma` — the `Lead` model has **27 fields**, and neither
`success` nor `data` is among them. Prisma rejects unknown arguments with
`PrismaClientValidationError`, which `sendError(res, err.message)` turns into a **500 with the
raw Prisma message in the body**.

Correct path is `response.data.data`.

---

### 6. `POST /leads/:id/score` silently does nothing `[EXECUTED]`

```ts
score:       response.data.score,    // → undefined
scoreReason: response.data.reason,   // → undefined
```

Real body: `{"success": true, "data": {"score": 50, "reason": "Score based on available profile data."}}`

```
response.data.score   → None
response.data.reason  → None
response.data.data.score → 50      ← the correct path
```

Prisma treats `undefined` as "leave this field alone", so the request returns **200** and the
lead's score is unchanged. This is the worst failure mode of the three: the UI shows a spinner,
then success, and the score badge never moves. No error is ever surfaced.

---

### 7. AI email draft renders blank — double-wrapped `[EXECUTED]`

`backend/src/routes/outreach.routes.ts` re-wraps an already-wrapped body:
```ts
sendSuccess(res, response.data);   // response.data is already {success, data}
```

Resulting HTTP body:
```json
{"success":true,"data":{"success":true,"data":{"subject":"Quick question for Alex","body":"Hi,\n\n..."}}}
```

Both consumers read one level too high:
- `leads/[id]/page.tsx` → `setEmailDraft(data.data)` ⇒ `emailDraft.subject` = `undefined`, `.body` = `undefined`
- `outreach/compose/page.tsx` → `data.data.subject` = `undefined`, `data.data.body` = `undefined`

**The "AI Email Draft" card shows an empty Subject and an empty Body.** The compose page's
subject/body inputs are pre-filled with empty strings.

---

### 8. AI discovery finds leads, then discards them `[SOURCE]`

```
$ grep -n "prisma" backend/src/routes/agents.routes.ts
  (no matches — no Prisma import, no DB write)
```

`/agents/discover` proxies to the AI service and returns the results to the browser. **Nothing
is written to the database.** Meanwhile `frontend/src/app/agents/page.tsx` tells the user:

> "Check the Leads page to see the newly discovered leads."

Both the Leads-page "AI Discover" button and the Agents-page "Run Discovery Agent" panel are
non-functional — they perform work and throw the output away.

---

### 9. Without an Anthropic key, enrichment returns empty data *and reports success* `[EXECUTED]`

`.env.example` ships `ANTHROPIC_API_KEY=sk-ant-your-key-here` — a placeholder. In that state:

```
POST /enrich → 200 {"success": true, "data": {"notes": "", "tags": []}}
```

`agents/base_agent.py` returns the string `'{"error": "No Anthropic API key configured"}'`,
which `call_claude_json` parses into a dict; `enrichment_agent` then does
`result.get("notes", "")` → `""`. The error is swallowed and the endpoint reports success.

So even after fixing #5, "Enrich Profile" would write **empty notes** and report success.
No user-visible signal distinguishes "AI has nothing" from "AI is unconfigured/broken."

---

# P0-C — Security

### 10. No data isolation — any user can read/modify any other user's data `[SOURCE]`

```
$ grep -rn "ownerId" backend/src/
services/lead.service.ts:46:export const createLead = (data: any, ownerId: string) => {
services/lead.service.ts:48:    data: { ...data, ownerId },
```

`ownerId` is **written** on create and **never used in a `where` clause**. `getLeads`,
`getLeadById`, `updateLead`, `deleteLead`, the whole `/companies` router, `/pipeline`, and
`/outreach` all query with no owner scoping. Any authenticated user can enumerate, edit, and
delete every other user's leads and read every outreach email body.

`requireAdmin` is defined in `middleware/auth.middleware.ts` and **never used anywhere** —
there are no admin-protected routes.

---

### 11. The AI service is unauthenticated and publicly reachable `[SOURCE]`

`ai-agents/main.py`:
```python
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, ...)
```
`docker-compose.yml` publishes `ports: - "8000:8000"`. The routers have no auth dependency.

Anyone who can reach the host can call `/discover`, `/enrich`, `/score`, `/outreach/draft`
and **consume your Anthropic credits** without an account. `allow_origins=["*"]` combined with
`allow_credentials=True` is also an invalid/unsafe CORS pairing.

---

### 12. Postgres and Redis are exposed on the host with documented default passwords `[SOURCE]`

`docker-compose.yml` maps `5432:5432` and `6379:6379` to the host. `.env.example` ships
`POSTGRES_PASSWORD=leadiq_secure_pass_123` and `REDIS_PASSWORD=leadiq_redis_pass_123` —
published in the repo. Anyone on the network can connect to the database directly, bypassing
the API entirely.

---

### 13. No input validation anywhere `[SOURCE]`

`express-validator` is declared in `backend/package.json` and imported by **0 files** (verified).
`zod` is used only for env vars, never for requests.

- `routes/companies.routes.ts`: `prisma.company.create({ data: req.body })` — raw body to Prisma.
- `auth.controller.ts`: no email-format validation; `name` can be any string.
- `routes/pipeline.routes.ts`: `PUT /pipeline/move` accepts any string as `stage`; no check
  that it's a real `PipelineStage`, so a typo orphans the lead from every board column.

---

### 14. Refresh tokens are never rotated or revoked `[SOURCE]`

`auth.service.verifyRefreshToken` only checks the signature. There is no token store, no `jti`,
no family tracking, no invalidation on logout — and `/auth/logout` doesn't exist at all
(though `FILE_TREE.md` documents it). A leaked refresh token is valid for the full 7 days.

---

### 15. Placeholder JWT secrets pass validation `[SOURCE]`

`config/env.ts` requires `JWT_SECRET: z.string().min(32)`. The `.env.example` value
`change_this_to_a_very_long_random_secret_at_least_256_bits_long` is **60 characters** — it
passes. An unmodified `.env` therefore boots happily with a signing key that is public in this
repository. A length check cannot detect a known secret; this needs a "reject known placeholder"
guard or a production-mode refusal.

---

### 16. JWTs stored in `localStorage` `[SOURCE]`

`frontend/src/lib/api.ts` and `useAuth.ts` store `accessToken` and `refreshToken` in
`localStorage`. Any XSS reads both. No `httpOnly` cookie path exists.

---

### 17. Error responses leak internals `[SOURCE]`

`sendError(res, err.message)` defaults to **HTTP 500** and echoes the raw exception message —
including Prisma validation errors, which expose table and column names. `errorHandler.middleware.ts`
additionally returns `err.stack` when `NODE_ENV=development`.

---

# P1 — Features present in the UI that do not work

### 18. No email is ever sent `[SOURCE]`

`@sendgrid/mail` is declared and imported by **0 files**. `POST /outreach/send` does exactly one
thing — writes a row:

```ts
prisma.outreach.create({ data: { leadId, subject, body, status: 'SENT', sentAt: new Date(), sentById } })
```

No mail provider is contacted. **Outreach history will show "SENT" for emails that never left
the server.** `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` in `.env.example` are inert.

---

### 19. The activity feed is frozen at seed data `[SOURCE]`

```
$ grep -rn "activity.create" backend/src/
  (no matches)
```

`Activity` rows are created **only** by `prisma/seed.ts`. Creating, enriching, scoring,
emailing, or moving a lead writes no activity. The dashboard's "Recent Activity" panel and the
lead detail "Activity" card will never change after seeding — despite `ActivityType` defining
11 event types.

---

### 20. Buttons with no handler `[SOURCE]`

| Location | Control | State |
|---|---|---|
| `leads/[id]/page.tsx:136` | **"Send Email"** | no `onClick` |
| `settings/page.tsx:23` | "Save Changes" | no `onClick` |
| `settings/page.tsx:33` | "Save API Keys" | no `onClick` |

`grep -c "api\." frontend/src/app/settings/page.tsx` → **0**. The Settings page makes no API
call at all. It also claims *"API keys are stored securely and encrypted at rest"* — there is no
endpoint, no storage, and no crypto module (`utils/crypto.ts` is documented in `FILE_TREE.md`
but does not exist).

---

### 21. The global header search box is decorative `[SOURCE]`

`components/layout/Header.tsx` has no `useState`, no `onChange`, no `onKeyDown` (verified by
grep). The "Search leads, companies..." input does nothing.

---

### 22. The seed script is not idempotent `[SOURCE]`

Users, pipeline stages, and companies use `upsert`; leads and activities use bare `create`:

```
seed.ts:11  prisma.user.upsert        seed.ts:84  prisma.lead.create      ← duplicates
seed.ts:23  prisma.user.upsert        seed.ts:92  prisma.activity.create  ← duplicates
seed.ts:45  prisma.pipelineStage.upsert   seed.ts:102 prisma.activity.create ← duplicates
seed.ts:63  prisma.company.upsert
```

The README tells you to run `npm run db:seed` as step 5, and `npm run db:seed` again any time.
Every re-run **duplicates all 8 leads and their activities**. Also: `demoUser` (seed.ts:23) is
created and never referenced — every lead is assigned to `admin.id`.

---

### 23. The rate limiter will 429 a single idle user `[SOURCE]`

`apiLimiter` = 200 requests / 15 min, applied to **all** of `/api` before routing, and
`app.set('trust proxy', ...)` is never called.

The frontend polls continuously: `/analytics/dashboard` every 60s, `/leads` every 30s,
`/pipeline` every 30s, `/leads/stats` every 60s. That is roughly **90 requests per 15 minutes
from one idle dashboard tab** — under half the budget before any user interaction. Behind
Docker, all clients also share the bridge gateway IP, so the bucket is global.

---

### 24. Score filters crash on non-numeric input `[SOURCE]`

`services/lead.service.ts`:
```ts
if (minScore) where.score = { ...where.score, gte: parseInt(minScore) };
```
No `NaN` guard. `GET /leads?minScore=abc` → `gte: NaN` → Prisma throws → HTTP 500.

---

### 25. Pipeline endpoint is an unbounded N+1 `[SOURCE]`

`routes/pipeline.routes.ts` loops over stages issuing one `prisma.lead.findMany` per stage, each
with **no `take`**. With 6 stages and a large dataset this is 7 full scans returning the entire
leads table on every 30-second poll.

---

### 26. No database indexes beyond primary/unique keys `[SOURCE]`

`migration.sql` creates 3 PKs, 3 unique indexes, and 6 FKs — and nothing else. Every column used
for filtering or sorting is unindexed: `leads.email`, `leads.companyId`, `leads.ownerId`,
`leads.createdAt` (used by the default `orderBy`), `leads.status`, `leads.source`,
`leads.pipelineStage`, `outreaches.leadId`, `activities.createdAt`.

---

# P2 — Hygiene & correctness debt

### 27. Zero backend tests — and the suite passes vacuously `[EXECUTED]`

```
$ npm test
No tests found, exiting with code 0
TEST_EXIT=0
```

`--passWithNoTests` means an empty suite exits **green**. There is no `jest.config.*` file at
all, so the declared `ts-jest` is unused; `@types/jest` isn't installed either. **`npm run test`
at the repo root reports success while testing nothing on the backend.**

---

### 28. The 3 Python tests mock away the code under test `[EXECUTED]`

```
$ pytest tests/ -v
3 passed, 9 warnings in 0.11s
```

But both meaningful tests patch the agent itself:
```python
with patch("routers.enrichment.agent.enrich") as mock_enrich: ...
with patch("routers.scoring.agent.score")    as mock_score: ...
```

They assert only that the route returns `{"success": true, "data": ...}`. **Zero agent or LLM
logic is exercised.** Notably, a test that asserted the *real* response shape against the
backend's expectations would have caught findings 5, 6, and 7. The `mock_claude` fixture in
`conftest.py` is defined and used by no test.

---

### 29. Dead dependencies (declared, never imported) `[SOURCE — grep count of importing files]`

| Service | Package | Files importing it |
|---|---|---|
| backend | `bull` | 0 |
| backend | `socket.io` | 0 |
| backend | `@sendgrid/mail` | 0 |
| backend | `express-validator` | 0 |
| frontend | `socket.io-client` | 0 |
| frontend | `@radix-ui/react-avatar` | 0 |
| frontend | `@radix-ui/react-dialog` | 0 |
| frontend | `@radix-ui/react-dropdown-menu` | 0 |
| frontend | `@radix-ui/react-select` | 0 |
| frontend | `@radix-ui/react-separator` | 0 |
| frontend | `@radix-ui/react-toast` | 0 |
| frontend | `@radix-ui/react-tooltip` | 0 |
| ai-agents | `aiohttp`, `redis` | 0 |

`ai-agents/requirements.txt` also lists `httpx==0.27.0` **twice** (verified with `uniq -d`).

Each dead dependency is an install-time cost and, in `bull`/`socket.io`/`@sendgrid/mail`'s case,
a promise the codebase doesn't keep.

---

### 30. Dead code `[SOURCE]`

- `backend/src/services/cache.service.ts` — never imported by any file.
- `backend/src/middleware/auth.middleware.ts` → `requireAdmin` — never used.
- `ai-agents/tools/scraper_tool.py` → `scrape_url` — never called.
- `ai-agents/services/` — an empty package (only `__init__.py`).
- `analytics.controller.ts` — computes `thirtyDaysAgo`, never uses it.
- `discovery_agent.py` — `import asyncio`, unused.

---

### 31. `FILE_TREE.md` describes a different, larger project than the one that exists `[SOURCE]`

**45 of 167 distinct names it documents (27%) are absent from the repo.** Highlights:

- **Controllers (4):** `companies.controller.ts`, `pipeline.controller.ts`, `outreach.controller.ts`, `agents.controller.ts` — that logic is inlined into route files instead.
- **Services (4):** `company.service.ts`, `email.service.ts`, `queue.service.ts`, `websocket.service.ts`
- **Middleware:** `validate.middleware.ts` (the "Zod request validation" layer that would have prevented #13)
- **Utils:** `crypto.ts`, `models/types.ts`
- **Frontend (16):** `dialog.tsx`, `table.tsx`, `dropdown-menu.tsx`, `toast.tsx`, `PageContainer.tsx`, `LeadCard.tsx`, `LeadTimeline.tsx`, `AIInsightsPanel.tsx`, `KanbanColumn.tsx`, `DealCard.tsx`, `ConversionFunnel.tsx`, `LeadSourceChart.tsx`, `EmailComposer.tsx`, `CampaignStatus.tsx`, `useCompanies.ts`, `useWebSocket.ts`, `useAgents.ts`, `lib/auth.ts`
- **AI agents (6):** `config/database.py`, `models/company.py`, `models/agent.py`, `routers/research.py`, `agents/research_agent.py`, `tools/product_hunt_tool.py`, `tools/linkedin_tool.py`, `tools/clearbit_tool.py`, `services/*` (3 files)
- **Tests (2):** `test_discovery_agent.py`, `test_outreach_agent.py`

It also documents **6 routes that are not implemented**: `/auth/logout`, `GET /outreach/history`,
`/analytics/funnel`, `/analytics/sources`, `POST /agents/enrich`, `POST /agents/score`. And it
describes `Dockerfile.backend` as "ts-node-dev hot reload" when `package.json` uses `nodemon`.

*(Note on method: my first pass at measuring this reported 186 missing files. That was a bug in
my own path-reconstruction script, which dropped parent directories. The 45/167 figure above uses
basename matching against `git ls-files` and the filesystem, and is the correct number.)*

---

### 32. No lockfiles → non-reproducible installs `[SOURCE]`

```
$ git ls-files | grep lock
backend/prisma/migrations/20240101000000_init/migration.lock
backend/prisma/migrations/migration_lock.toml
```

No `package-lock.json` for backend or frontend. Every `npm install` resolves fresh — which is
precisely how a phantom dependency like #1 goes unnoticed until build time. Python is pinned via
`requirements.txt`, so it's fine.

---

### 33. No `.dockerignore` — and `.gitignore` actively ignores it `[SOURCE]`

`.gitignore` line 43 contains `.dockerignore`. There is no `.dockerignore` in the repo. All
three Dockerfiles use `context: .` (the entire monorepo root), so **every image build ships the
whole project tree to the Docker daemon** — including any local `node_modules`.

---

### 34. No CI, no LICENSE `[SOURCE]`

No `.github/` directory exists — no workflow runs install, build, lint, or test on any push.
Given findings 1–4, this is the single highest-leverage missing control: **a 15-line GitHub
Actions job would have caught all four build blockers.** There is also no `LICENSE` file.

---

### 35. Single-commit history `[EXECUTED]`

```
$ git log --oneline
3e4b385 Add project files.
```

One commit, no branch history, no trace of iterative development or review.

---

### 36. Non-standard Prisma artifact `[SOURCE]`

`prisma/migrations/20240101000000_init/migration.lock` is not a file Prisma generates. The real
lock is `prisma/migrations/migration_lock.toml`, which also exists. Harmless, but a sign the
migration directory was hand-authored rather than produced by `prisma migrate dev`.

---

### 37. Deprecated APIs and a yanked dependency `[EXECUTED]`

- `ai-agents/main.py:26` uses `@app.on_event("startup")` — pytest surfaced a real
  `DeprecationWarning: on_event is deprecated, use lifespan event handlers instead.`
- `config/settings.py` uses class-based `Config` — `PydanticDeprecatedSince20`.
- `requirements.txt` pins `pytest==8.1.0`, which pip reports as **yanked**:
  *"WARNING: The candidate selected for download or install is a yanked version: 'pytest' candidate (version 8.1.0)"*

---

### 38. `docker-compose.yml` issues `[SOURCE]`

- Top-level `version: "3.9"` is obsolete in Compose v2 and emits a warning.
- `frontend`'s `depends_on: [backend]` has **no health condition**, so the frontend starts
  before the API is ready.
- `backend`, `frontend`, and `ai-agents` define **no `healthcheck`**, though all three Dockerfiles
  install `wget` — presumably for one. The restart policy has nothing to act on.

---

# What actually works

To be fair to the codebase:

- **The AI service is the healthiest component.** `pip install -r requirements.txt` succeeds,
  the app boots, all 3 tests pass, `/health` returns correctly, and its internal envelope is
  self-consistent. Its bugs are all at the *boundary* with the backend.
- **The Prisma schema is well designed.** 7 models, sensible enums, correct `onDelete` referential
  actions (`SET NULL` on optional FKs, `RESTRICT` on `outreaches.leadId`), `@@map` to snake_case
  tables. `migration.sql` is internally consistent with `schema.prisma`.
- **`backend/src/` typechecks clean under `strict: true`** — see caveat below.
- **The frontend code is coherent.** Consistent styling, a proper shadcn-style UI kit, sensible
  SWR hooks, correct loading/empty states. What's broken is its dependency list and config file,
  not the JSX.
- **No secrets are committed.** I grepped all tracked files for `sk-ant-`, `SG.`, and `ghp_`
  patterns — no matches.

---

# What I could not verify (and why)

Stated plainly, so you know the boundary of this audit:

1. **`docker-compose up` was never executed.** Docker is not installed in this sandbox
   (`docker: command not found`). The quickstart failure is inferred from the frontend
   `npm install` failure, which I *did* reproduce — `Dockerfile.frontend` runs exactly that
   command.
2. **`prisma generate` and `prisma validate` could not run.** Both require
   `binaries.prisma.sh`, which is outside this sandbox's network allowlist:
   ```
   Error: request to https://binaries.prisma.sh/.../libquery_engine.so.node.gz.sha256 failed
   ```
   Consequences: (a) I could not run migrations or seed a real database; (b) I could not execute
   a live Prisma write, so finding #5 is established by executing the FastAPI side, extracting
   the exact keys passed to `prisma.lead.update`, and diffing them against the 27 fields parsed
   from `schema.prisma` — not by observing the Prisma error itself; (c) **the backend typecheck
   ran against `PrismaClient: any`** (the ungenerated stub), so *no Prisma query shape in the
   backend was actually type-checked.* A clean `tsc` here is weak evidence.
3. **The backend server was never booted.** No Postgres or Redis is available in the sandbox, and
   `dist/app.js` throws at import time without a generated Prisma client. Findings 10–17 and
   23–25 are from source reading, not from observed HTTP responses.
4. **The frontend was never compiled**, because it cannot be installed (finding #1). Findings
   20–21 are from source reading; finding #2 is verified against Next's own shipped code.

---

# Recommended order of work

**Phase 1 — make it installable and buildable (roughly 1 hour, unblocks everything)**
1. Remove `@radix-ui/react-badge` from `frontend/package.json` (#1)
2. Rename `next.config.ts` → `next.config.js` (#2)
3. Drop `"prisma/**/*"` from `backend/tsconfig.json` `include` (#3)
4. Add `eslint` + `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` to backend devDependencies (#4)
5. Commit `package-lock.json` for both Node services (#32)
6. Add a GitHub Actions job running install → build → lint → test on all three services (#34).
   *This is the control that prevents the next four regressions.*

**Phase 2 — fix the AI integration boundary (the actual product value)**
7. Unwrap the envelope at all three call sites: `response.data.data` (#5, #6, #7)
8. Persist discovered leads to the DB with `source` + `ownerId` (#8)
9. Surface "no Anthropic key" as an explicit error instead of empty success (#9)
10. Add one contract test per AI endpoint asserting the *real* response shape, not a mock (#28)

**Phase 3 — security before any real data goes in**
11. Add `ownerId` scoping to every lead/company/pipeline/outreach query (#10)
12. Put auth in front of the AI service, or stop publishing port 8000 (#11)
13. Bind Postgres/Redis to `127.0.0.1` and generate real secrets (#12, #15)
14. Add request validation with `zod` — the `validate.middleware.ts` the docs already promise (#13)
15. Sanitize error responses (#17)

**Phase 4 — make the visible features honest**
16. Implement SendGrid sending, or mark outreach `DRAFT` instead of `SENT` (#18)
17. Write `Activity` rows on every mutation (#19)
18. Wire up or remove the dead buttons (#20) and the header search (#21)
19. Make the seed idempotent (#22)
20. Fix the rate limit budget, the `NaN` score filter, the pipeline N+1, and add indexes (#23–26)

**Phase 5 — docs and hygiene**
21. Rewrite `FILE_TREE.md` to describe the repo as it is, or build the 45 missing files (#31)
22. Remove the 14 dead dependencies (#29) and dead code (#30)
23. Add `.dockerignore` (and un-ignore it in `.gitignore`), `LICENSE`, compose healthchecks (#33, #34, #38)
24. Replace yanked `pytest==8.1.0`; migrate `on_event` → lifespan (#37)

---

## Bottom line

The repository contains a **well-structured scaffold of a CRM** — roughly 3,400 lines of
consistent, readable code with a sound data model — that has **never been run**. Four
independent build blockers, four broken AI integrations, and a complete absence of tenant
isolation are all the kind of defect that a single `npm install && npm run build && npm test`
in CI would surface in under two minutes.

It is not salvageable-by-polish; it is salvageable-by-execution. Get it building in CI first
(Phase 1), then fix the AI envelope contract (Phase 2) — those two phases, roughly a day of
work, take the project from "does not run" to "demoable."

---

# ADDENDUM — 2026-10-09: calibration run (Phase 1 + Phase 2 executed)

The estimate above was derived from reading code. To convert it into a measurement, Phases 1
and 2 were actually implemented and verified. Result: **12 files changed, +147 / −23 lines.**

## Status of findings after this pass

| # | Finding | Status |
|---|---|---|
| 1 | Phantom `@radix-ui/react-badge` | ✅ **FIXED** — removed; `npm install` exit 0, 494 pkgs |
| 2 | `next.config.ts` unsupported | ✅ **FIXED** — renamed to `next.config.js` (CJS, `module.exports`) |
| 3 | `tsc` TS6059 rootDir conflict | ✅ **FIXED** — `prisma/**/*` dropped from `include`; build exit 0, `dist/` clean, no stray `prisma/seed.js` |
| 4 | `eslint: not found` | ✅ **FIXED** — added `eslint@^8.57`, `@typescript-eslint/{parser,eslint-plugin}@^7`, `@types/jest`; lint exit 0 |
| 5 | `/enrich` → 500, mass assignment | ✅ **FIXED** — unwrapped + explicit field allowlist |
| 6 | `/score` silent no-op | ✅ **FIXED** — unwrapped, numeric-validated, clamped 0–100 |
| 7 | Draft email double-wrapped | ✅ **FIXED** — unwrapped once at the boundary |
| 8 | Discovered leads discarded | ✅ **FIXED** — now persisted with dedupe, company link, `ownerId` |
| 9 | Keyless state silently "succeeds" | ✅ **FIXED** — agents propagate `error`; backend returns 503 |
| 39–41 | *(new)* frontend never compiled | ✅ **FIXED** — see below |
| 10–38 | Security, email, activity feed, hygiene | ❌ **NOT ADDRESSED** — untouched |

Verification after the fixes: backend `tsc` exit 0 · backend `eslint` exit 0 (2 warnings, both
the dead variables from finding 30) · `next build` **exit 0, all 15 routes compiled** ·
`pytest` 3 passed · contract trace re-run against the live FastAPI app confirms `notes`/`tags`
now reach valid `Lead` columns, `score` lands as `87` instead of `undefined`, and the draft is
no longer double-wrapped.

## NEW finding 39–41 — the frontend had never been compiled

`next build` surfaced three errors that block the production build. These are not style
nits: `next build` treats them as fatal, so **the frontend could never have been built**.

| Location | Error | Real-world effect |
|---|---|---|
| `app/auth/login/page.tsx:72` | `react/no-unescaped-entities` — bare `'` in "Don't have an account?" | build fails |
| `app/settings/page.tsx:21` | `react/jsx-no-duplicate-props` — two `className` on one `<Input>` | build fails, **and** `mt-1` was silently discarded so the Email field lost its top margin |
| `app/settings/page.tsx:22` | same, on the Role field | same |

Together with #1 and #2 that is **five independent blockers on the frontend alone** — conclusive
evidence that no build of this project has ever been attempted.

## NEW finding 42 — Next.js 14 is security-EOL; the fix requires Next 16

`npm audit` on the frontend reports **17 vulnerabilities (1 critical, 13 high, 3 moderate)**.
`next@14.1.3` is flagged by **23 advisories**, including two **critical unauthenticated RCEs**:

- `GHSA-p293-qw3h-jr36` — RCE on Windows-hosted servers (CVSS **9.0**, CWE-22)
- `GHSA-2xp9-vwfh-vxw4` — RCE in Image Optimization API via AVIF (CWE-1395)

**Bumping to `next@14.2.35` (the latest 14.x) does not clear them.** `npm audit` reports the
vulnerable range as `9.3.4-canary.0 - 16.3.x` with the fix only in **`next@16.4.0`**
(`isSemVerMajor: true`). Verified: after upgrading to 14.2.35 the audit still returned
`17 vulnerabilities (3 moderate, 13 high, 1 critical)`.

**Applicability to this app's actual surface** (checked, not assumed):

| Advisory class | Applies here? | Evidence |
|---|---|---|
| Server Actions (5 advisories) | **No** | `grep "'use server'"` → none; no custom server |
| Middleware/i18n bypass | **No** | no `middleware.ts`, no `i18n`, App Router only |
| WebSocket SSRF (CVSS 8.6) | **No** | no WebSocket usage |
| Windows RCE (CVSS 9.0) | **No, if deployed on Linux** | Dockerfiles are `node:20-alpine` |
| AVIF Image-Optimizer RCE | **Reachable** | no `next/image` in app code, *but* `images.domains` is configured, so `/_next/image` is live |
| **RSC denial of service (3 × CVSS 7.5)** | **YES** | App Router is used throughout |
| SSRF in rewrites | Low as configured | destination is `process.env.NEXT_PUBLIC_API_URL`, not attacker-controlled |

So the two criticals are largely mitigable by configuration (deploy on Linux; set
`images: { unoptimized: true }` or drop `images.domains`), but **the high-severity RSC DoS
advisories genuinely apply and cannot be fixed below Next 16.** This turns "go live" from a
bug-fix exercise into a two-major-version framework migration (14 → 15 → 16, which also implies
React 19).

## NEW finding 43 — backend production dependency is clean; the count was dev-only noise

`npm audit` reports 45 vulnerabilities for the backend, but **`npm audit --omit=dev` reports
only 2 moderate** — and both come from `bull`, which is a **dead dependency** (finding 29).
Deleting `bull` clears the backend's entire production vulnerability surface.

## NEW finding 44 — `next/font/google` makes the build depend on outbound network

`next build` fetches Inter from `fonts.googleapis.com` at **build time** and fails hard
(exit 1, "Failed to fetch `Inter` from Google Fonts") if it cannot reach it. Fine for most CI;
a hard blocker for air-gapped or egress-restricted build environments. (This blocked my own
verification here — I stubbed the font to compile the app, then restored `layout.tsx` byte-identical
to the committed version, confirmed by an empty `git diff`.)

## Revised effort estimate

Measured, not guessed: **Phases 1+2 took ~147 lines across 12 files** and took the project from
"cannot install" to "everything compiles and the AI contract is correct."

What remains is not symmetric with that. Phase 3 (tenant isolation, AI-service auth, input
validation, token rotation, secret handling) is **design work, not repair work**, and Phase 4's
email sending is a real feature build. Add the Next 14→16 migration from finding 42 and the
honest figure for "genuinely production-ready" is **3–5 engineer-weeks**, not 3–5 days.
