# Deploying Sable to Vercel

This branch (`vercel-deploy`) is set up to run **both** apps on Vercel as **two
separate Vercel projects from this one repo**:

| Project | Root directory | Framework | What it is |
|---|---|---|---|
| `sable-api` | `backend` | Other | Express API, run as a serverless function (`backend/api/index.ts` + `backend/vercel.json`) |
| `sable-web` | `sablefrontend` | Next.js | The frontend (auto-detected) |

> **The Postgres database is not on Vercel.** Vercel hosts the *code*. The
> database lives on **Supabase** (or a Vercel-Marketplace Neon Postgres). Create
> it first — see step 1.

---

## 1. Database (Supabase) — do this first

1. Create a project at [supabase.com](https://supabase.com).
2. Grab the **pooler** connection string: *Settings → Database → Connection
   string → URI*, the **Pooler / port 6543** one (serverless needs the pooler,
   not the direct 5432 connection).
3. Run the migrations against it from your machine, once:
   ```bash
   cd backend
   npm install
   DATABASE_URL="<your-pooler-uri>" DB_RLS_ROLE=authenticated npm run db:migrate
   DATABASE_URL="<your-pooler-uri>" DB_RLS_ROLE=authenticated npm run db:seed
   ```

## 2. Backend project (`sable-api`)

1. [vercel.com/new](https://vercel.com/new) → import `becoeurscott/sable`.
2. **Root Directory:** `backend`. **Deploy from branch:** `vercel-deploy`.
3. Add **Environment Variables** (Production):

   **Required**
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | your Supabase **pooler** URI (port 6543) |
   | `DB_RLS_ROLE` | `authenticated` |
   | `JWT_SECRET` | a long random string (≥16 chars) |
   | `AUTH_MODE` | `local` (or `supabase`) |
   | `CORS_ORIGINS` | your frontend URL, e.g. `https://sable-web.vercel.app` |
   | `NODE_ENV` | `production` |

   **Optional (features degrade gracefully if unset)**
   | Key | Enables |
   |---|---|
   | `SUPABASE_URL`, `SUPABASE_JWT_SECRET` | Supabase Auth (only if `AUTH_MODE=supabase`) |
   | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Billing |
   | `GEMMA_API_KEY` **or** `OPENROUTER_API_KEY` | AI CFO / categorization / OCR parsing |
   | `RESEND_API_KEY`, `EMAIL_FROM` | Real invoice emails |
   | `RATE_LIMIT_STORE=redis`, `REDIS_URL` | Durable rate limiting (see caveats) |

4. Deploy. Sanity-check `https://<sable-api-url>/health` and `/docs`.

## 3. Frontend project (`sable-web`)

1. [vercel.com/new](https://vercel.com/new) → import the same repo again.
2. **Root Directory:** `sablefrontend`. **Branch:** `vercel-deploy`. Framework:
   **Next.js** (auto).
3. Add one **Environment Variable**:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<sable-api-url>/api/v1` |
4. Deploy.
5. Go back to `sable-api` and set `CORS_ORIGINS` to this frontend's real URL,
   then redeploy the backend.

---

## Serverless caveats (important, be aware)

- **Use the Supabase pooler URL** (port 6543). The direct connection will
  exhaust connections under serverless concurrency.
- **Rate limiting:** the default in-memory store does not persist across
  serverless invocations. For real limits set `RATE_LIMIT_STORE=redis` +
  `REDIS_URL` (e.g. Upstash from the Vercel Marketplace). Without it, limiting
  is best-effort only.
- **Stripe webhooks:** point the Stripe dashboard webhook at
  `https://<sable-api-url>/api/v1/webhooks/stripe` (raw-body route is already
  mounted before the JSON parser in `app.ts`).
- **First deploy may need a tweak.** This serverless adapter is standard but
  hasn't been run against a live Vercel build here. If the API 404s or the
  function build fails, grab the Vercel build/function logs — the usual fixes
  are the rewrite path or an ESM import, both quick.

## Simpler alternative for the backend

Vercel is serverless-first; a long-running Express + Postgres app is happier on
**Railway** or **Render** (push repo, set the same env vars, done — no adapter,
no pooler/rate-limit gotchas). Frontend still goes on Vercel. If the serverless
route fights you, switch the backend to Railway and only change
`NEXT_PUBLIC_API_URL`.
