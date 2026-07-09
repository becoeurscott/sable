-- ═══════════════════════════════════════════════════════════════════════════
-- 0006 — API KEYS  (§2 "API Access" — programmatic access for external apps)
-- Long-lived, hashed keys scoped to one organization, with a role + optional
-- read-only flag. Only the SHA-256 hash is stored; the plaintext is shown once.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  prefix          TEXT NOT NULL,                 -- display id, e.g. 'sbl_a1b2c3d4'
  key_hash        TEXT UNIQUE NOT NULL,          -- sha256(full key)
  role            TEXT NOT NULL CHECK (role IN ('owner','admin','accountant','manager','employee')),
  read_only       BOOLEAN NOT NULL DEFAULT FALSE,
  created_by      UUID REFERENCES public.users(id),
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON public.api_keys(organization_id);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins+ of the org can manage its keys (verification runs in service
-- context, which bypasses RLS — see apiKey.repository).
DROP POLICY IF EXISTS api_keys_admin ON public.api_keys;
CREATE POLICY api_keys_admin ON public.api_keys FOR ALL
  USING (has_role(organization_id, 'admin'))
  WITH CHECK (has_role(organization_id, 'admin'));

-- Grant privileges to whichever per-request RLS role exists (new table isn't
-- covered by the one-time grant in 0002).
DO $$
DECLARE r TEXT;
BEGIN
  FOREACH r IN ARRAY ARRAY['app_authenticated','authenticated','service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO %I', r);
    END IF;
  END LOOP;
END
$$;
