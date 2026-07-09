-- ═══════════════════════════════════════════════════════════════════════════
-- 0001 — LOCAL AUTH SHIM  (LOCAL / SELF-HOSTED POSTGRES ONLY)
-- ───────────────────────────────────────────────────────────────────────────
-- On Supabase, the `auth` schema, `auth.uid()`, and the `authenticated` role
-- already exist — SKIP this file when deploying to Supabase.
--
-- Locally we recreate the exact same contract Supabase exposes so that the RLS
-- policies in 0003 are byte-for-byte portable:
--   * auth.uid()            -> current request's user id (from JWT claims GUC)
--   * auth.jwt()            -> full claims object
--   * role `app_authenticated` -> the low-privilege role the API assumes per
--                                 request via `SET LOCAL ROLE`, so RLS applies.
-- The API sets `request.jwt.claims` per transaction; auth.uid() reads it.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS auth;

-- Full JWT claims for the current request (set by the API via set_config).
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  );
$$;

-- Current authenticated user id (NULL when unauthenticated / service context).
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(auth.jwt() ->> 'sub', '')::uuid;
$$;

-- The role the API switches into per request. NOLOGIN: it is only ever reached
-- via `SET LOCAL ROLE` from the owning connection, never by direct login.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_authenticated') THEN
    CREATE ROLE app_authenticated NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA auth TO app_authenticated;
