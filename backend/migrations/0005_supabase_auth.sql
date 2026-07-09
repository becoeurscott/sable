-- ═══════════════════════════════════════════════════════════════════════════
-- 0005 — SUPABASE AUTH SYNC  (SUPABASE ONLY — skipped on local Postgres)
-- Mirrors Supabase Auth users into public.users so app FKs (memberships,
-- created_by, …) resolve. The API also upserts on /auth/me as a fallback.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any users that already exist in auth.users.
INSERT INTO public.users (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;
