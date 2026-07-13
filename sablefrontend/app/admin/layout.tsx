"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DISPLAY } from "../theme";
import { adminApi } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { ADMIN_GRAD } from "./ui";

const NAV = [
  { href: "/admin", icon: "◫", label: "Overview" },
  { href: "/admin/users", icon: "👤", label: "Users" },
  { href: "/admin/orgs", icon: "🏢", label: "Organizations" },
  { href: "/admin/plans", icon: "💳", label: "Plans & pricing" },
  { href: "/admin/usage", icon: "⚡", label: "Usage & AI" },
  { href: "/admin/audit", icon: "🧾", label: "Audit log" },
  { href: "/admin/system", icon: "🖥", label: "System health" },
];

const TITLES: Record<string, { title: string; sub: string }> = {
  "/admin": { title: "Overview", sub: "The whole SaaS at a glance" },
  "/admin/users": { title: "Users", sub: "Every account on the platform" },
  "/admin/orgs": { title: "Organizations", sub: "Tenants, plans and activity" },
  "/admin/plans": { title: "Plans & pricing", sub: "Edit tiers, quotas and visibility" },
  "/admin/usage": { title: "Usage & AI", sub: "Platform-wide metering this cycle" },
  "/admin/audit": { title: "Audit log", sub: "Cross-tenant action trail" },
  "/admin/system": { title: "System health", sub: "Backend, integrations and runtime" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    adminApi
      .access()
      .then((r) => setAllowed(r.isAdmin))
      .catch(() => setAllowed(false));
  }, [user]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (!ready || !user || allowed === null) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F6FA", color: "#8A93A3", fontSize: 14 }}>
        Checking admin access…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F6FA", padding: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 18, padding: 36, maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 34, marginBottom: 12 }}>🔒</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Admin access required</div>
          <div style={{ fontSize: 14, color: "#5A6472", lineHeight: 1.6, marginBottom: 20 }}>
            Your account isn&apos;t a platform admin. Ask an existing admin to promote you, or add your
            email to <code style={{ background: "#F1F4F9", padding: "1px 6px", borderRadius: 5 }}>PLATFORM_ADMIN_EMAILS</code> on the backend.
          </div>
          <Link href="/app/dashboard" style={{ fontWeight: 600, fontSize: 14, color: "#2F6BFF" }}>← Back to the app</Link>
        </div>
      </div>
    );
  }

  const meta =
    TITLES[pathname] ??
    (pathname.startsWith("/admin/orgs/")
      ? { title: "Organization detail", sub: "Tenant drill-down" }
      : TITLES["/admin"]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F6FA", animation: "sbFade .3s ease both" }}>
      {navOpen && <div className="sb-backdrop" onClick={() => setNavOpen(false)} />}
      <aside className={`sb-sidebar${navOpen ? " sb-open" : ""}`} style={{ width: 238, flexShrink: 0, background: "#160F02", display: "flex", flexDirection: "column", padding: "20px 14px", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 22px" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: ADMIN_GRAD, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2.5px solid #fff" }} />
          </div>
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 19, color: "#FCF7EE" }}>Sable</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: "#F0A34A", background: "rgba(240,163,74,.14)", border: "1px solid rgba(240,163,74,.35)", padding: "3px 8px", borderRadius: 100 }}>ADMIN</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV.map((n) => {
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
                  color: active ? "#FCF7EE" : "#B8A98E",
                  background: active ? "linear-gradient(135deg,rgba(240,163,74,.22),rgba(214,69,69,.18))" : "transparent",
                }}
              >
                <span style={{ width: 18, textAlign: "center", fontSize: 15 }}>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </div>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
          <Link href="/app/dashboard" style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 11px", borderRadius: 10, fontSize: 13.5, color: "#B8A98E" }}>
            <span style={{ width: 18, textAlign: "center" }}>←</span>Back to app
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: ADMIN_GRAD, flexShrink: 0 }} />
            <div style={{ lineHeight: 1.2, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "#FCF7EE", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.full_name || user.email}</div>
              <div style={{ fontSize: 11.5, color: "#8C7F63" }}>Platform admin</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
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
              <div className="sb-topbar-sub" style={{ fontSize: 12.5, color: "#8A93A3" }}>{meta.sub}</div>
            </div>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", color: "#B45309", background: "#FFF4E5", border: "1px solid #FBE3C4", padding: "5px 12px", borderRadius: 100, whiteSpace: "nowrap" }}>
            CROSS-TENANT
          </span>
        </div>
        <div className="sb-scroll sb-main-pad" style={{ flex: 1, overflowY: "auto", padding: "26px 28px 60px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
