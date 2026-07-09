-- ═══════════════════════════════════════════════════════════════════════════
-- 0002 — CORE SCHEMA  (§6 Database Schema Design)
-- Multi-tenant. Every tenant row carries organization_id (§7 isolation model).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- updated_at auto-touch trigger ------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$;

-- ── PLANS (product plans + feature quotas, §2) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,                -- free_trial | starter | growth | professional | enterprise
  name          TEXT NOT NULL,
  price_monthly INTEGER NOT NULL DEFAULT 0,          -- cents
  price_annual  INTEGER,                             -- cents/mo when billed annually
  stripe_price_id_monthly TEXT,
  stripe_price_id_annual  TEXT,
  quotas        JSONB NOT NULL DEFAULT '{}',         -- { seats, invoices_mo, expenses_mo, storage_mb, ai_credits_mo, ocr_mo, ... }
  features      JSONB NOT NULL DEFAULT '{}',         -- { api_access, cash_forecast, fraud_detection, white_label, ... }
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_public     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── USERS (auth identity + profile) ──────────────────────────────────────────
-- LOCAL: password_hash lives here. SUPABASE: drop password_hash and make id
-- REFERENCES auth.users(id); Supabase Auth owns credentials.
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT,                                -- local-first auth only
  full_name     TEXT,
  avatar_url    TEXT,
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  language      TEXT NOT NULL DEFAULT 'en',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_users_touch BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Refresh-token store (rotating, hashed) — local-first session management.
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash  TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON public.refresh_tokens(user_id);

-- ── ORGANIZATIONS (tenant root) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  owner_id        UUID NOT NULL REFERENCES public.users(id),
  plan_id         UUID REFERENCES public.plans(id),
  logo_url        TEXT,
  currency        TEXT NOT NULL DEFAULT 'USD',
  fiscal_year_end INTEGER NOT NULL DEFAULT 12,        -- month number
  tax_id          TEXT,
  country         TEXT,
  chart_of_accounts JSONB NOT NULL DEFAULT '[]',      -- expense/revenue categories
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orgs_owner ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_orgs_slug  ON public.organizations(slug);
CREATE TRIGGER trg_orgs_touch BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── MEMBERSHIPS (RBAC — user ↔ org, §7) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('owner','admin','accountant','manager','employee')),
  invited_by      UUID REFERENCES public.users(id),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_org  ON public.memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);

-- ── SUBSCRIPTIONS (Stripe state per org) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_customer_id     TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_id                UUID REFERENCES public.plans(id),
  status                 TEXT NOT NULL DEFAULT 'trialing'
                           CHECK (status IN ('trialing','active','past_due','canceled','paused')),
  trial_ends_at          TIMESTAMPTZ,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_subs_touch BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── INVOICES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_number  TEXT NOT NULL,
  client_name     TEXT NOT NULL,
  client_email    TEXT,
  line_items      JSONB NOT NULL DEFAULT '[]',
  subtotal        NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate        NUMERIC(5,2)  NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
  total           NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','sent','viewed','paid','overdue','cancelled')),
  issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  notes           TEXT,
  pdf_url         TEXT,
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, invoice_number)
);
CREATE INDEX IF NOT EXISTS idx_invoices_org    ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due    ON public.invoices(due_date) WHERE status <> 'paid';
CREATE TRIGGER trg_invoices_touch BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── EXPENSES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount          NUMERIC(15,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  category        TEXT NOT NULL,
  vendor          TEXT,
  description     TEXT,
  raw_description TEXT,                               -- original bank/merchant string (Gemma input)
  ai_categorized  BOOLEAN NOT NULL DEFAULT FALSE,
  ai_confidence   TEXT CHECK (ai_confidence IN ('high','medium','low')),
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url     TEXT,
  is_billable     BOOLEAN NOT NULL DEFAULT FALSE,
  is_reimbursable BOOLEAN NOT NULL DEFAULT FALSE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by     UUID REFERENCES public.users(id),
  created_by      UUID NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expenses_org  ON public.expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(organization_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_cat  ON public.expenses(organization_id, category);
CREATE TRIGGER trg_expenses_touch BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── REVENUES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.revenues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount          NUMERIC(15,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  source          TEXT NOT NULL,
  description     TEXT,
  invoice_id      UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  revenue_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by      UUID NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_revenues_org  ON public.revenues(organization_id);
CREATE INDEX IF NOT EXISTS idx_revenues_date ON public.revenues(organization_id, revenue_date DESC);
CREATE TRIGGER trg_revenues_touch BEFORE UPDATE ON public.revenues
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── NOTIFICATIONS (in-app queue per user) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT,
  data            JSONB NOT NULL DEFAULT '{}',
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read_at);

-- ── USAGE METRICS (AI credits, OCR, storage, API calls per org per month) ─────
CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period          TEXT NOT NULL,                      -- 'YYYY-MM'
  metric          TEXT NOT NULL,                      -- ai_credits | ocr | invoices | expenses | api_calls | storage_mb
  used            NUMERIC(15,2) NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, period, metric)
);
CREATE INDEX IF NOT EXISTS idx_usage_org_period ON public.usage_metrics(organization_id, period);

-- ── AUDIT LOGS (immutable — append only, §12) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id        UUID REFERENCES public.users(id),
  action          TEXT NOT NULL,                      -- e.g. expense.create, invoice.send
  resource_type   TEXT,
  resource_id     UUID,
  metadata        JSONB NOT NULL DEFAULT '{}',
  ip              TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_org ON public.audit_logs(organization_id, created_at DESC);

-- ── AI CONVERSATIONS + MESSAGES (AI CFO chat history) ────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_conv_org ON public.ai_conversations(organization_id, user_id);
CREATE TRIGGER trg_ai_conv_touch BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_msg_conv ON public.ai_messages(conversation_id, created_at);

-- ── BANK ACCOUNTS (Plaid — Month 2, schema shipped now) ──────────────────────
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL DEFAULT 'plaid',
  institution     TEXT,
  account_mask    TEXT,
  access_token_ref TEXT,                              -- reference into secrets vault, never the raw token
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bank_org ON public.bank_accounts(organization_id);

-- Grant table privileges to whichever per-request RLS role exists:
--   * local:    app_authenticated (from the 0001 shim)
--   * Supabase: authenticated (+ anon/service_role) — native roles
-- RLS still restricts the actual rows each role can see.
DO $$
DECLARE r TEXT;
BEGIN
  FOREACH r IN ARRAY ARRAY['app_authenticated','authenticated','service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I', r);
      EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I', r);
    END IF;
  END LOOP;
END
$$;
