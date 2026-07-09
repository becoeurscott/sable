"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DISPLAY, GRAD } from "../theme";
import { appNav, appMeta } from "../data";
import { Mark } from "../components/Mark";
import { AppProvider } from "./app-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const seg = pathname.split("/")[2] || "dashboard";
  const meta = appMeta[seg] || appMeta.dashboard;

  // Mobile drawer state — closes automatically whenever the route changes.
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <AppProvider>
      <div style={{ display: "flex", minHeight: "100vh", background: "#F4F6FA", animation: "sbFade .3s ease both" }}>
        {/* dark overlay behind the drawer on mobile */}
        <div
          className={"sb-nav-overlay" + (navOpen ? " show" : "")}
          onClick={() => setNavOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(8,12,22,.5)", zIndex: 85 }}
        />

        {/* SIDEBAR */}
        <aside
          className={"sb-sidebar" + (navOpen ? " open" : "")}
          style={{ width: 238, flexShrink: 0, background: "#0A1020", display: "flex", flexDirection: "column", padding: "20px 14px", position: "sticky", top: 0, height: "100vh" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 22px" }}>
            <Mark size={28} className="sb-logo" />
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 19, color: "#F3F6FC" }}>Sable</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {appNav.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setNavOpen(false)}
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
            <Link href="/" onClick={() => setNavOpen(false)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 11px", borderRadius: 10, cursor: "pointer", fontSize: 13.5, color: "#8A93A3" }}>
              <span style={{ width: 18, textAlign: "center" }}>←</span>Back to site
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: GRAD, flexShrink: 0 }} />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, color: "#E8EDF6", fontWeight: 600 }}>Maya Okafor</div>
                <div style={{ fontSize: 11.5, color: "#71798A" }}>Northwind Studio</div>
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
                className="sb-hamburger"
                onClick={() => setNavOpen(true)}
                aria-label="Open menu"
                style={{ border: "1px solid #E4E9F2", background: "#F1F4F9", borderRadius: 10, width: 38, height: 38, alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", color: "#0B1220", flexShrink: 0 }}
              >
                ☰
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.title}</div>
                <div style={{ fontSize: 12.5, color: "#8A93A3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.sub}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <div className="sb-topbar-search" style={{ display: "flex", alignItems: "center", gap: 8, background: "#F1F4F9", border: "1px solid #E4E9F2", borderRadius: 10, padding: "8px 13px", width: 220, color: "#98A1B2", fontSize: 13.5 }}>🔍 Search…</div>
              <button
                onClick={() => router.push("/app/cfo")}
                className="sb-btn"
                style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#fff", background: GRAD, padding: "9px 15px", borderRadius: 10, display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}
              >
                ✦ Ask CFO
              </button>
            </div>
          </div>

          <div className="sb-scroll sb-main" style={{ flex: 1, overflowY: "auto", padding: "26px 28px 60px" }}>
            {children}
          </div>
        </div>
      </div>
    </AppProvider>
  );
}
