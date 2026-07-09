"use client";

// Auth + active-tenant context. Uses Supabase Auth when configured
// (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY), else falls back to the backend's own
// JWT auth. Either way it exposes the same interface and, after sign-in, ensures
// the user has a profile + an organization and selects it.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "./supabase";
import {
  authApi,
  orgApi,
  ApiError,
  type BackendUser,
  type BackendOrg,
} from "./api";
import {
  getToken,
  getRefreshToken,
  setTokens,
  setOrgId,
  getOrgId,
  clearSession,
} from "./session";

interface AuthState {
  user: BackendUser | null;
  org: BackendOrg | null;
  ready: boolean;
  needsEmailConfirm: boolean;
  usingSupabase: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Returns true if a session was created (logged in), false if email confirmation is pending. */
  signup: (email: string, password: string, company?: string, fullName?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const PENDING_COMPANY = "sable.pendingCompany";

async function bootstrapOrg(): Promise<BackendOrg> {
  const { organizations } = await orgApi.listMine();
  const existingId = getOrgId();
  let chosen = organizations.find((o) => o.id === existingId) ?? organizations[0];
  if (!chosen) {
    const name =
      (typeof window !== "undefined" && window.localStorage.getItem(PENDING_COMPANY)) || "My Company";
    chosen = (await orgApi.create(name)).organization;
    if (typeof window !== "undefined") window.localStorage.removeItem(PENDING_COMPANY);
  }
  setOrgId(chosen.id);
  return chosen;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [org, setOrg] = useState<BackendOrg | null>(null);
  const [ready, setReady] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  const bootstrapping = useRef(false);
  const loadedFor = useRef<string | null>(null);

  const loadProfileAndOrg = useCallback(async (userId: string) => {
    if (bootstrapping.current || loadedFor.current === userId) return;
    bootstrapping.current = true;
    try {
      const { user } = await authApi.me(); // upserts the profile in supabase mode
      const org = await bootstrapOrg();
      setUser(user);
      setOrg(org);
      loadedFor.current = userId;
    } finally {
      bootstrapping.current = false;
    }
  }, []);

  // ── Session restore + auth-change subscription ─────────────────────────────
  useEffect(() => {
    let active = true;

    if (supabase) {
      const applyToken = (session: { access_token: string; refresh_token?: string } | null) => {
        if (session) setTokens(session.access_token, session.refresh_token ?? "");
        else clearSession();
      };

      supabase.auth.getSession().then(async ({ data }) => {
        applyToken(data.session);
        if (data.session) {
          try {
            await loadProfileAndOrg(data.session.user.id);
          } catch {
            /* ignore */
          }
        }
        if (active) setReady(true);
      });

      const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
        applyToken(session);
        if (session && event !== "SIGNED_OUT") {
          try {
            await loadProfileAndOrg(session.user.id);
          } catch {
            /* ignore */
          }
        }
        if (event === "SIGNED_OUT") {
          setUser(null);
          setOrg(null);
          loadedFor.current = null;
        }
      });

      return () => {
        active = false;
        sub.subscription.unsubscribe();
      };
    }

    // Fallback: backend-issued JWT auth.
    (async () => {
      if (!getToken() && !getRefreshToken()) {
        setReady(true);
        return;
      }
      try {
        const { user } = await authApi.me();
        const org = await bootstrapOrg();
        if (active) {
          setUser(user);
          setOrg(org);
        }
      } catch {
        clearSession();
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadProfileAndOrg]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        if (data.session) {
          setTokens(data.session.access_token, data.session.refresh_token ?? "");
          await loadProfileAndOrg(data.session.user.id);
        }
        return;
      }
      const res = await authApi.login(email, password);
      setTokens(res.accessToken, res.refreshToken);
      setUser(res.user);
      setOrg(await bootstrapOrg());
    },
    [loadProfileAndOrg],
  );

  const signup = useCallback(
    async (email: string, password: string, company?: string, fullName?: string): Promise<boolean> => {
      if (company && typeof window !== "undefined") window.localStorage.setItem(PENDING_COMPANY, company);
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw new Error(error.message);
        if (data.session) {
          setTokens(data.session.access_token, data.session.refresh_token ?? "");
          await loadProfileAndOrg(data.session.user.id);
          return true; // logged in (email confirmation is off)
        }
        setNeedsEmailConfirm(true); // project has email confirmation enabled
        return false;
      }
      const res = await authApi.signup(email, password, fullName);
      setTokens(res.accessToken, res.refreshToken);
      setUser(res.user);
      setOrg(await bootstrapOrg());
      return true;
    },
    [loadProfileAndOrg],
  );

  const loginWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error("Google sign-in requires Supabase Auth");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app/dashboard` },
    });
    if (error) throw new Error(error.message);
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabase) throw new Error("Magic links require Supabase Auth");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/app/dashboard` },
    });
    if (error) throw new Error(error.message);
  }, []);

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      const rt = getRefreshToken();
      try {
        if (rt) await authApi.logout(rt);
      } catch {
        /* ignore */
      }
    }
    clearSession();
    setUser(null);
    setOrg(null);
    loadedFor.current = null;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        org,
        ready,
        needsEmailConfirm,
        usingSupabase: supabase !== null,
        login,
        signup,
        loginWithGoogle,
        sendMagicLink,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { ApiError };
