"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DISPLAY, GRAD, C } from "../theme";
import { useAuth } from "../lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, loginWithGoogle, sendMagicLink, usingSupabase } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const wrap = async (fn: () => Promise<void>, onOk?: () => void) => {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await fn();
      onOk?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Is everything running?");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    wrap(
      async () => {
        if (mode === "signup") {
          await signup(email, password, company || undefined, fullName || undefined);
          if (usingSupabase) setNotice("Check your email to confirm your account, then log in.");
        } else {
          await login(email, password);
        }
      },
      () => {
        // Only redirect if we actually have a session (not pending email confirm).
        if (!(mode === "signup" && usingSupabase)) router.push("/app/dashboard");
      },
    );
  };

  const magicLink = () => {
    if (!email) { setError("Enter your email first."); return; }
    wrap(async () => {
      await sendMagicLink(email);
      setNotice("Magic link sent — check your email to sign in.");
    });
  };

  const input = {
    width: "100%",
    fontSize: 14,
    padding: "11px 13px",
    border: "1px solid #DCE3EE",
    borderRadius: 10,
    outline: "none",
    marginBottom: 12,
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F6FA", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", border: "1px solid #EAEEF5", borderRadius: 18, padding: 32, boxShadow: "0 24px 50px -18px rgba(11,16,32,.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: GRAD, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", border: "2.5px solid #fff" }} />
          </div>
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, color: C.ink }}>Sable</span>
        </div>

        <h1 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, color: C.ink, margin: "0 0 4px" }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p style={{ fontSize: 13.5, color: C.slate, margin: "0 0 22px" }}>
          {mode === "login" ? "Log in to your AI CFO." : "Start your 14-day free trial — no card."}
        </p>

        {usingSupabase && (
          <>
            <button
              onClick={() => wrap(loginWithGoogle)}
              disabled={busy}
              style={{ width: "100%", border: "1px solid #DCE3EE", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, color: C.ink, padding: "11px", borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}
            >
              <span style={{ fontWeight: 700, color: "#4285F4" }}>G</span> Continue with Google
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 14px", color: C.slate, fontSize: 12 }}>
              <div style={{ flex: 1, height: 1, background: "#EAEEF5" }} /> or <div style={{ flex: 1, height: 1, background: "#EAEEF5" }} />
            </div>
          </>
        )}

        <form onSubmit={submit}>
          {mode === "signup" && (
            <>
              <input style={input} placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <input style={input} placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} />
            </>
          )}
          <input style={input} type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={input} type="password" placeholder="Password (min 8 chars)" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />

          {error && <div style={{ background: "#FEECEC", color: C.red, fontSize: 13, padding: "9px 12px", borderRadius: 9, marginBottom: 12 }}>{error}</div>}
          {notice && <div style={{ background: "#E9F7F0", color: C.green, fontSize: 13, padding: "9px 12px", borderRadius: 9, marginBottom: 12 }}>{notice}</div>}

          <button type="submit" disabled={busy} style={{ width: "100%", border: "none", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, fontWeight: 600, fontSize: 14.5, color: "#fff", background: GRAD, padding: "12px", borderRadius: 10 }}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        {usingSupabase && (
          <button onClick={magicLink} disabled={busy} style={{ width: "100%", border: "none", background: "none", color: C.blue, cursor: "pointer", fontWeight: 600, fontSize: 13, marginTop: 12 }}>
            Email me a magic link instead
          </button>
        )}

        <div style={{ fontSize: 13, color: C.slate, marginTop: 18, textAlign: "center" }}>
          {mode === "login" ? "New to Sable? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setNotice(null); }} style={{ border: "none", background: "none", color: C.blue, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <Link href="/" style={{ fontSize: 12.5, color: C.slate, textDecoration: "none" }}>← Back to site</Link>
        </div>
      </div>
    </div>
  );
}
