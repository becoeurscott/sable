// Supabase browser client for Auth (email/password, Google OAuth, magic link).
// Null when env vars are absent, so the app falls back to backend auth cleanly.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Created from env presence (inlined on both server and client) — NOT gated on
// `typeof window`, so `usingSupabase` is identical during SSR and on the client
// and the login page hydrates without a mismatch. supabase-js falls back to an
// in-memory store when there's no browser, so server construction is safe.
export const supabase: SupabaseClient | null =
  url && anon
    ? createClient(url, anon, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

export const supabaseEnabled = (): boolean => supabase !== null;
