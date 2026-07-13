-- ═══════════════════════════════════════════════════════════════════════════
-- 0007 — PLATFORM ADMINS
-- Marks users allowed into the cross-tenant /admin API (SaaS operator role,
-- distinct from per-org membership roles). Bootstrap the first admin via the
-- PLATFORM_ADMIN_EMAILS env var; promote others from the admin dashboard.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_platform_admin
  ON public.users(id) WHERE is_platform_admin;
