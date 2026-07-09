"use client";

import Link from "next/link";
import { DISPLAY } from "../theme";
import { Mark } from "../components/Mark";
import { useOnboarding } from "./onboarding-context";

export function Nav() {
  const { openOnboard } = useOnboarding();
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid #EAEEF5",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer", color: "inherit" }}>
          <Mark size={30} shadow className="sb-logo" />
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, letterSpacing: "-.02em" }}>Sable</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div className="sb-nav-links" style={{ display: "flex", gap: 26, fontSize: 14.5, color: "#4A5566", fontWeight: 500 }}>
            <Link href="/" className="sb-navlink" style={{ cursor: "pointer", color: "inherit" }}>Product</Link>
            <Link href="/pricing" className="sb-navlink" style={{ cursor: "pointer", color: "inherit" }}>Pricing</Link>
            <Link href="/" className="sb-navlink" style={{ cursor: "pointer", color: "inherit" }}>Customers</Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/app/dashboard" className="sb-nav-signin" style={{ cursor: "pointer", fontSize: 14.5, fontWeight: 600, color: "#0B1220" }}>
              Sign in
            </Link>
            <button
              onClick={openOnboard}
              className="sb-btn"
              style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14.5, color: "#fff", background: "#0B1220", padding: "10px 18px", borderRadius: 10 }}
            >
              Join the beta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
