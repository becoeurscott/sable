# FinanceAI — Backend (REST API · Multi-tenant · Security-first)

Node.js + TypeScript + Express + PostgreSQL implementation of the **AI Accounting SaaS MVP Blueprint** (§9 Backend, §10 REST API, §12 Security). Built **local-first** — it runs today on plain Postgres with zero cloud accounts — while staying **Supabase-compatible** so you can flip to a managed Supabase project later without rewriting the data model or the row-level-security policies.

> AI (Gemma) is an **assistant layer only** (§3). The database is the source of financial truth; the model never computes ledgers, totals, or reports. When `GEMMA_API_KEY` is unset the API still runs — AI features degrade to deterministic heuristics.

---

## Architecture

`Controller → Service → Repository` with a hard tenant boundary (§9):

```
src/
  config/     env (zod), db (RLS-aware pool), stripe, logger
  middleware/ auth (JWT) · orgContext (tenant) · rbac · rateLimit · validate · errorHandler
  routes/     one module per §10 resource, mounted under /api/v1
  controllers/ thin HTTP layer — no DB calls
  services/   business logic, quota enforcement, audit, usage metering
  repositories/ all SQL; tenant reads/writes go through asUser() (RLS)
  ai/         gemma client + categorizer · nlSearch · cfoChat · healthScore
  utils/      tokens · password · money · pdf · pagination · errors
migrations/   0001 auth shim · 0002 schema · 0003 RLS · 0004 seed plans
```

### How tenant isolation actually works (§7, §8, §12)

Two DB access modes in [`src/config/db.ts`](src/config/db.ts):

- **`asUser(userId, fn)`** — opens a transaction, injects the request's JWT claims (`request.jwt.claims`), then `SET LOCAL ROLE app_authenticated`. Every query inside runs as a low-privilege role subject to the RLS policies in `0003_rls_policies.sql`. **Postgres enforces isolation, not just the API.**
- **`query()` / `serviceTxn()`** — service context (table owner, RLS bypassed) for legitimately cross-tenant work: signup, org bootstrap, Stripe webhooks, usage/audit writes.

The policies reference `auth.uid()` — native on Supabase, recreated locally by `0001_local_auth_shim.sql`. **The same policy SQL runs in both environments.**

---

## Quick start

**Prerequisites:** Node 20+, and Postgres 16 (via Docker or local).

```bash
cd backend
cp .env.example .env            # then set JWT_SECRET at minimum

# 1) Start Postgres (+ Redis) locally
docker compose up -d            # or point DATABASE_URL at your own Postgres

# 2) Install + migrate + seed demo data
npm install
npm run db:migrate              # applies migrations/*.sql
npm run db:seed                 # optional: demo user + org + sample data

# 3) Run
npm run dev                     # http://localhost:4000
```

Health check: `GET http://localhost:4000/health` → `{ "status": "ok", "integrations": {…} }`

**Interactive API reference:** open **`http://localhost:4000/docs`** — Swagger UI listing every route with live **"Try it out"**. Click **Authorize**, paste a Bearer token (from `/auth/login`), set the `X-Org-Id` header on org-scoped routes, and fire real requests. Raw spec: `GET /api/v1/openapi.json`. (The server boots even before the DB is connected, so `/docs` and `/health` always work.)

Smoke test the core loop with [`requests.http`](requests.http) (VS Code REST Client), or:

```bash
# signup → returns { accessToken }, then create an org, then use X-Org-Id
curl -s localhost:4000/api/v1/auth/signup -H 'content-type: application/json' \
  -d '{"email":"a@b.co","password":"password123"}'
```

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Hot-reload dev server (tsx) |
| `npm run build` / `start` | Compile to `dist/` / run compiled |
| `npm run typecheck` | `tsc --noEmit` (no emit) |
| `npm test` | Unit tests (money math, AI heuristics, health score) |
| `npm run db:migrate` | Apply migrations (`-- --reset` to drop & recreate) |
| `npm run db:seed` | Insert demo data |

---

## API keys (programmatic access, §2)

External apps/scripts can authenticate with a long-lived **API key** instead of a user login. Keys are org-scoped with a role + optional read-only flag; only the SHA-256 hash is stored (plaintext shown once).

- **Create/manage:** in the app under **Settings → API keys** (admin+), or `POST /organizations/:id/api-keys`.
- **Use:** send the key as `X-API-Key: sbl_…` **or** `Authorization: Bearer sbl_…`. No `X-Org-Id` needed — the key pins the org.

```bash
curl https://your-api/api/v1/dashboard -H "X-API-Key: sbl_xxxxxxxx…"
```

A read-only key rejects any non-GET request with `403`. Revoke anytime in Settings or `DELETE /organizations/:id/api-keys/:keyId`.

### Master developer key (for you, not customers)

Set `ADMIN_API_KEY` in `.env` for a single key that grants **full access to any org** without logging in or being a member — for your own scripts/admin. Send it as `X-API-Key` (or `Bearer`) **plus** an `X-Org-Id` header naming the org:

```bash
curl http://localhost:4000/api/v1/dashboard \
  -H "X-API-Key: $ADMIN_API_KEY" -H "X-Org-Id: <org-id>"
```

It acts as that org's owner (full read/write). Generate one with:
`node -e "console.log('sbl_admin_'+require('crypto').randomBytes(32).toString('hex'))"`. Keep it secret; rotate by changing the env value.

## REST API (§10)

Base: `/api/v1`. Auth: `Authorization: Bearer <accessToken>`. Tenant: `X-Org-Id: <uuid>` header (org-scoped resources) or the `:id` path segment (org routes). Every route is rate-limited per the §10 budgets.

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/auth/signup` · `/auth/login` · `/auth/refresh` | public | JWT + rotating refresh token |
| POST | `/auth/logout` · GET `/auth/me` | JWT | |
| POST/GET | `/organizations` | JWT | create tenant / list mine |
| GET/PATCH/DELETE | `/organizations/:id` | Member / Admin / Owner | |
| POST | `/organizations/:id/invite` · DELETE `/…/members/:userId` | Admin | |
| GET | `/dashboard` · `/dashboard/cashflow` | Member | KPI aggregates |
| GET/POST | `/expenses` | Member | list (filter/paginate) / create (auto-categorize) |
| PATCH/DELETE | `/expenses/:id` | Manager / Admin | |
| POST | `/expenses/:id/approve` | Manager | |
| GET/POST | `/invoices` | Member / Accountant | totals computed server-side |
| POST | `/invoices/:id/send` · `/mark-paid` | Accountant | |
| GET | `/invoices/:id/pdf` | Member | PDFKit-rendered |
| GET/POST | `/revenues` | Member / Accountant | |
| GET | `/reports/pl` · `/cashflow` · `/tax-summary` | Accountant | exact SQL |
| POST | `/reports/export` | Accountant | CSV |
| POST | `/ai/chat` · `/ai/categorize` · `/ai/search` | Member | Gemma-assisted |
| GET | `/ai/forecast` · `/ai/health-score` · `/ai/chat/history` | Member | |
| GET | `/billing/plans` | public | pricing tiers |
| GET/POST | `/billing/subscription` · `/subscribe` · `/cancel` | Admin / Owner | Stripe Checkout |
| POST | `/webhooks/stripe` | Stripe signature | raw-body verified |

Error envelope: `{ "error": { "code", "message", "details?" } }`.

### RBAC role hierarchy (§7/§8)
`owner > admin > accountant > manager > employee`. Guards use the same ranking as the SQL `has_role()` function, so API checks and DB policies never disagree. Employees see only their own expenses (enforced by RLS).

---

## Security controls implemented (§12)

| Control | Where |
|---|---|
| JWT auth (1h access + rotating refresh, hashed at rest) | `utils/tokens.ts`, `services/auth.service.ts` |
| Row-Level Security on every tenant table | `migrations/0003_rls_policies.sql` + `config/db.ts` |
| RBAC middleware before every protected controller | `middleware/rbac.ts` |
| Per-user/IP + per-route rate limiting | `middleware/rateLimit.ts` |
| Zod validation on body/query/params | `middleware/validate.ts`, `validators/schemas.ts` |
| Parameterized queries only (no string-built SQL from input) | all repositories |
| NL search returns JSON filters, never SQL | `ai/nlSearch.ts` |
| Immutable, append-only audit log | `repositories/audit.repository.ts` |
| Stripe webhook signature verification | `controllers/webhook.controller.ts` |
| Secrets via env / (Supabase Vault in prod); log redaction | `config/env.ts`, `config/logger.ts` |
| Security headers (helmet, HSTS in prod, CSP) | `app.ts` |
| Password hashing (bcrypt, 12 rounds) + timing-safe login | `utils/password.ts`, `auth.service.ts` |

Bearer-token auth (no ambient cookies) makes the API inherently CSRF-resistant; add SameSite cookies + CSRF tokens only if you later serve auth from cookies (§12).

---

## Using Supabase as the database

The app keeps its own JWT auth and just uses Supabase's Postgres. Only `.env` changes — no code changes:

1. In your Supabase project: **Settings → Database → Connection string → URI** (use the **Pooler**, port `6543`). Copy it and fill in your DB password.
2. In `.env` set:
   ```
   DATABASE_URL=postgresql://postgres.<project-ref>:<DB-PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres
   DB_RLS_ROLE=authenticated
   ```
   (`DATABASE_SSL=auto` already turns SSL on for the remote host.)
3. `npm run db:migrate` — the migrator **auto-skips** the local auth shim (Supabase already has `auth.uid()` + the `authenticated` role), applies the schema/RLS/plans, and grants table access to `authenticated`.

The same RLS policies run unchanged because `db.asUser()` sets `request.jwt.claims`, which Supabase's native `auth.uid()` reads. Service-context writes run as `postgres` (bypasses RLS), tenant reads/writes run as `authenticated` (RLS enforced).

Safety: `db:migrate --reset` refuses to run against a remote DB unless `FORCE_REMOTE_RESET=true`, and never drops the `auth` schema.

**Optional later:** switch credential storage to Supabase Auth (drop `users.password_hash`, reference `auth.users(id)`, verify Supabase JWTs in `middleware/auth.ts`) and move secrets to Supabase Vault.

---

## Scope of this build

**Implemented (Month-1 core + selected Month-2 AI):** auth/RBAC, org + membership, expenses (w/ auto-categorization), invoices (+ PDF, totals), revenues, dashboard + P&L/cashflow/tax reports, Stripe billing + webhooks, usage metering + plan quotas, audit logs, notifications, and AI endpoints (categorize, CFO chat, NL search, health score, forecast).

**Also built since:** receipt OCR structuring (`POST /ai/parse-receipt`, Gemma + regex fallback; browser does the Tesseract text extraction), Resend email on invoice send (PDF attached, graceful no-key fallback), and the full Next.js frontend (`../sablefrontend`, connected to this API).

**Deferred (per blueprint §3/§8):** Plaid bank sync, Google OAuth, 2FA, BullMQ background jobs, Realtime push, balance sheet. Hooks/tables for these already exist in the schema.

**Not verifiable in this sandbox:** the live DB/RLS path (no Postgres/Docker was available here). Typecheck and unit tests pass; run `docker compose up -d && npm run db:migrate && npm run dev` to exercise it end-to-end.
