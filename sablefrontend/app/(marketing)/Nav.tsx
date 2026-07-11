"use client";

import Link from "next/link";
import { useState } from "react";
import { DISPLAY, GRAD } from "../theme";
import { useOnboarding } from "./onboarding-context";

export function Nav() {
  const { openOnboard } = useOnboarding();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  const menuLink = {
    padding: "13px 24px",
    fontSize: 15,
    fontWeight: 500 as const,
    color: "#0B1220",
    borderBottom: "1px solid #F1F4F9",
  };

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
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Link href="/" onClick={close} style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer", color: "inherit" }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: GRAD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(47,107,255,.32)",
            }}
          >
            <div style={{ width: 11, height: 11, borderRadius: "50%", border: "2.5px solid #fff" }} />
          </div>
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, letterSpacing: "-.02em" }}>Sable</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div className="sb-nav-links" style={{ display: "flex", gap: 26, fontSize: 14.5, color: "#4A5566", fontWeight: 500 }}>
            <Link href="/" style={{ cursor: "pointer", color: "inherit" }}>Product</Link>
            <Link href="/pricing" style={{ cursor: "pointer", color: "inherit" }}>Pricing</Link>
            <Link href="/" style={{ cursor: "pointer", color: "inherit" }}>Customers</Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/login" className="sb-nav-signin" style={{ cursor: "pointer", fontSize: 14.5, fontWeight: 600, color: "#0B1220" }}>
              Sign in
            </Link>
            <button
              onClick={() => { close(); openOnboard(); }}
              style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14.5, color: "#fff", background: "#0B1220", padding: "10px 18px", borderRadius: 10, whiteSpace: "nowrap" }}
            >
              Join the beta
            </button>
            <button
              className="sb-burger"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
              style={{ border: "1px solid #EAEEF5", background: "#fff", cursor: "pointer", width: 40, height: 40, borderRadius: 10, fontSize: 18, color: "#0B1220" }}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="sb-mobile-menu" style={{ background: "#fff", borderBottom: "1px solid #EAEEF5", animation: "sbFade .2s ease both" }}>
          <Link href="/" onClick={close} style={menuLink}>Product</Link>
          <Link href="/pricing" onClick={close} style={menuLink}>Pricing</Link>
          <Link href="/" onClick={close} style={menuLink}>Customers</Link>
          <Link href="/login" onClick={close} style={{ ...menuLink, fontWeight: 600, borderBottom: "none" }}>Sign in</Link>
        </div>
      )}
    </div>
  );
}
