# Sable frontend ↔ FinanceAI backend

The frontend is now wired to the backend REST API. **All backend interaction lives in one place: [`app/lib/`](app/lib).**

## The integration layer (`app/lib/`)

| File | Responsibility |
|---|---|
| `config.ts` | API base URL (`NEXT_PUBLIC_API_URL`, default `http://localhost:4000/api/v1`) |
| `session.ts` | Stores access/refresh tokens + active org id in `localStorage` |
| `api.ts` | Typed fetch client — attaches `Bearer` token + `X-Org-Id`, auto-refreshes expired tokens, normalizes errors. Endpoint wrappers (`authApi`, `orgApi`, `expensesApi`, `invoicesApi`, `dashboardApi`, `reportsApi`, `aiApi`, `billingApi`) + mappers that convert backend rows → the UI view types |
| `auth-context.tsx` | `AuthProvider` / `useAuth` — login, signup, logout, and org bootstrap (creates a first org if none) |

## Blueprint §11 page coverage

| §11 page | Status |
|---|---|
| `/` Landing, `/pricing` | ✅ |
| `/login` (signup + login) | ✅ **Supabase Auth** — email/password + Google OAuth + magic link |
| `/app/dashboard` — KPIs + **AI health-score widget** | ✅ live |
| `/app/expenses` — **real receipt OCR** + **filters** + **manual add** + live category breakdown | ✅ live |
| `/app/revenue` — income table + **source breakdown** | ✅ **added** |
| `/app/invoices` — list, create&send, **Send / Mark-paid actions** | ✅ live |
| `/app/reports` — **P&L / Cash-Flow tabs**, **date range**, **live AI forecast**, CSV export | ✅ live |
| `/app/cfo` (`/app/ai`) — chat + suggested queries | ✅ live |
| `/app/search` — **natural-language search** (§5 #2) via topbar | ✅ **added** |
| `/app/billing` — plan + status | ✅ live |
| `/app/settings` — org info + **team members / invite / roles** + integrations/security | ✅ **added** |

**Receipt OCR is real:** upload a receipt photo → `tesseract.js` extracts the text in-browser (nothing leaves the device for OCR) → `POST /ai/parse-receipt` structures it (Gemma, or a regex fallback) into vendor / date / tax / total → you review and confirm → it files a real, auto-categorized expense.

**Invoice email is real:** "Send" on an invoice (or "Create & send") emails the client via Resend with the PDF attached — no-op-logged when `RESEND_API_KEY` is unset.

**Deferred (blueprint's own Month-2+ list):** Google OAuth, 2FA, Plaid bank connect, balance sheet, WhatsApp.

## What each screen calls

| Screen | Endpoints |
|---|---|
| Auth | `POST /auth/signup·login·refresh·logout`, `GET /auth/me`, `POST/GET /organizations` |
| Dashboard | `GET /dashboard`, `GET /invoices`, `GET /ai/health-score` |
| Expenses | `GET/POST /expenses` (auto-categorized), `POST /ai/parse-receipt` (OCR) |
| Revenue | `GET/POST /revenues` |
| Invoices | `GET/POST /invoices`, `POST /invoices/:id/send·mark-paid` |
| Reports | `GET /reports/pl`, `GET /dashboard/cashflow`, `GET /ai/forecast`, `POST /reports/export` |
| AI CFO / Search | `POST /ai/chat`, `POST /ai/search` |
| Billing | `GET /billing/plans·subscription` |
| Settings | `GET/PATCH /organizations/:id`, `GET /organizations/:id/members`, `POST /…/invite`, `DELETE /…/members/:userId` |

Still cosmetic (no backend source yet): the dashboard "recent transactions" strip, payment-method card, and referral widget.

## Run both together

```bash
# 1) Backend (see ../backend/README.md)
cd ../backend
docker compose up -d && npm install && npm run db:migrate && npm run db:seed && npm run dev   # :4000

# 2) Frontend
cd ../sablefrontend
cp .env.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm install && npm run dev        # :3000
```

Open http://localhost:3000 → **Sign in** → create an account. A trial org is created automatically, and every screen now reads/writes your real data. The backend already allows the `http://localhost:3000` origin and the `X-Org-Id` header (CORS).

> Verified: `npx tsc --noEmit` and `npm run build` both pass. Live end-to-end needs the backend + Postgres running (not available in the build sandbox).
