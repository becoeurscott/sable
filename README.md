# Sable — AI-powered accounting SaaS

An AI-first accounting platform for founders (the "FinanceAI" blueprint). Multi-tenant, security-first, with an AI CFO that categorizes expenses, reads receipts, forecasts cash flow, and answers finance questions in plain English.

## Structure

| Folder | What |
|---|---|
| [`backend/`](backend) | Node.js + TypeScript + Express REST API. Postgres/Supabase with row-level security, JWT/Supabase auth, RBAC, Stripe billing, and the Gemma AI layer (categorize / chat / NL-search / receipt-OCR / forecast / health-score). Interactive API docs at `/docs`. See [backend/README.md](backend/README.md). |
| [`sablefrontend/`](sablefrontend) | Next.js 15 (App Router) frontend, connected to the backend via a typed API client, with Supabase Auth. See [sablefrontend/INTEGRATION.md](sablefrontend/INTEGRATION.md). |

## Quick start

```bash
# Backend (:4000)
cd backend
cp .env.example .env          # set DATABASE_URL, JWT/Supabase secrets
npm install && npm run db:migrate && npm run dev

# Frontend (:3000)
cd ../sablefrontend
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL + Supabase keys
npm install && npm run dev
```

Then open http://localhost:3000. API reference: http://localhost:4000/docs.

## Tech

Supabase (Postgres + Auth) · Node/Express · Next.js · Stripe · Gemma (Google) · Tesseract.js OCR · Zod · Pino.

> **Security:** never commit `.env` / `.env.local` — they hold real credentials and are git-ignored. Rotate any secret that has been shared.
