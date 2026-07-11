"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DISPLAY, GRAD } from "../theme";
import { appNav, appMeta } from "../data";
import { AppProvider } from "./app-context";
import { useAuth } from "../lib/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, org, ready, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const seg = pathname.split("/")[2] || "dashboard";
  const meta = appMeta[seg] || appMeta.dashboard;

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Auth guard — bounce to /login once the session has finished restoring.
  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F6FA", color: "#8A93A3", fontSize: 14 }}>
        Loading your workspace…
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = (new FormData(e.target as HTMLFormElement).get("q") as string)?.trim();
    if (q) router.push(`/app/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <AppProvider>
      <div style={{ display: "flex", minHeight: "100vh", background: "#F4F6FA", animation: "sbFade .3s ease both" }}>
        {/* SIDEBAR */}
        {navOpen && <div className="sb-backdrop" onClick={() => setNavOpen(false)} />}
        <aside className={`sb-sidebar${navOpen ? " sb-open" : ""}`} style={{ width: 238, flexShrink: 0, background: "#0A1020", display: "flex", flexDirection: "column", padding: "20px 14px", position: "sticky", top: 0, height: "100vh" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 22px" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: GRAD, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2.5px solid #fff" }} />
            </div>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 19, color: "#F3F6FC" }}>Sable</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {appNav.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "10px 11px",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    color: active ? "#F3F6FC" : "#9AA6BC",
                    background: active ? "linear-gradient(135deg,rgba(47,107,255,.22),rgba(109,94,246,.22))" : "transparent",
                  }}
                >
                  <span style={{ width: 18, textAlign: "center", fontSize: 15 }}>{n.icon}</span>
                  {n.label}
                </Link>
              );
            })}
          </div>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ background: "#101A32", border: "1px solid #1D2A47", borderRadius: 12, padding: 13, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#8A93A3", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>Growth plan</div>
              <div style={{ fontSize: 12, color: "#9AA6BC", marginBottom: 8 }}>1,240 / 2,000 AI credits</div>
              <div style={{ height: 6, background: "#1D2A47", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: "62%", height: "100%", background: "linear-gradient(90deg,#2F6BFF,#6D5EF6)" }} />
              </div>
            </div>
            <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 11px", borderRadius: 10, cursor: "pointer", fontSize: 13.5, color: "#8A93A3", background: "transparent", border: "none", textAlign: "left" }}>
              <span style={{ width: 18, textAlign: "center" }}>←</span>Log out
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: GRAD, flexShrink: 0 }} />
              <div style={{ lineHeight: 1.2, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#E8EDF6", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.full_name || user.email}</div>
                <div style={{ fontSize: 11.5, color: "#71798A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org?.name ?? ""}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* TOPBAR */}
          <div className="sb-topbar" style={{ height: 66, flexShrink: 0, background: "rgba(255,255,255,.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E7ECF4", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", position: "sticky", top: 0, zIndex: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <button
                className="sb-burger"
                aria-label="Open navigation"
                onClick={() => setNavOpen(true)}
                style={{ border: "1px solid #E4E9F2", background: "#fff", cursor: "pointer", width: 38, height: 38, borderRadius: 10, fontSize: 17, color: "#0B1220", flexShrink: 0 }}
              >
                ☰
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, letterSpacing: "-.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.title}</div>
                <div className="sb-topbar-sub" style={{ fontSize: 12.5, color: "#8A93A3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.sub}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <form onSubmit={runSearch} className="sb-topbar-search" style={{ display: "flex", alignItems: "center", gap: 8, background: "#F1F4F9", border: "1px solid #E4E9F2", borderRadius: 10, padding: "6px 12px", width: 260 }}>
                <span style={{ color: "#98A1B2", fontSize: 13 }}>🔍</span>
                <input name="q" placeholder="Ask in plain English…" style={{ border: "none", background: "transparent", outline: "none", fontSize: 13.5, width: "100%", color: "#243049" }} />
              </form>
              <button
                onClick={() => router.push("/app/cfo")}
                style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#fff", background: GRAD, padding: "9px 15px", borderRadius: 10, display: "flex", alignItems: "center", gap: 7 }}
              >
                ✦ Ask CFO
              </button>
            </div>
          </div>

          <div className="sb-scroll sb-main-pad" style={{ flex: 1, overflowY: "auto", padding: "26px 28px 60px" }}>
            {children}
          </div>
        </div>
      </div>
    </AppProvider>
  );
}
