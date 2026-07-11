"use client";

import Link from "next/link";
import { useState } from "react";
import { DISPLAY, GRAD, GRAD_TEXT } from "../theme";
import { features, steps, compare, stats } from "../data";
import { Footer } from "./Footer";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const joinWaitlist = () => {
    if (email.includes("@")) setJoined(true);
  };

  const emailInputHero = (
    <div className="sb-email-row" style={{ display: "flex", gap: 10, maxWidth: 440, marginBottom: 16 }}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        style={{ flex: 1, minWidth: 0, fontSize: 15, padding: "14px 16px", border: "1.5px solid #DCE3EE", borderRadius: 12, outline: "none", color: "#0B1220" }}
      />
      <button
        onClick={joinWaitlist}
        style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 15, color: "#fff", background: "#2F6BFF", padding: "14px 22px", borderRadius: 12, whiteSpace: "nowrap", boxShadow: "0 8px 20px rgba(47,107,255,.28)" }}
      >
        Join the beta
      </button>
    </div>
  );

  return (
    <div>
      {/* HERO */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: -180,
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 520,
            background: "radial-gradient(ellipse at center, rgba(47,107,255,.16), rgba(109,94,246,.05) 45%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div className="sb-hero-grid sb-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "76px 28px 40px", position: "relative", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 52, alignItems: "center" }}>
          <div style={{ animation: "sbFadeUp .7s ease both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#F0F4FF", border: "1px solid #DDE6FF", color: "#1B4DE0", padding: "6px 13px", borderRadius: 100, fontSize: 13, fontWeight: 600, marginBottom: 22 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2F6BFF", animation: "sbGlow 2s ease infinite" }} />
              Launching on Product Hunt · Powered by Gemma AI
            </div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(36px, 8vw, 59px)", lineHeight: 1.02, letterSpacing: "-.03em", fontWeight: 700, margin: "0 0 20px" }}>
              Your AI CFO,
              <br />
              working{" "}
              <span style={{ background: GRAD_TEXT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>24/7.</span>
            </h1>
            <p style={{ fontSize: 18.5, lineHeight: 1.55, color: "#4A5566", maxWidth: 490, margin: "0 0 30px" }}>
              Sable categorizes expenses, forecasts cash flow, spots anomalies, and answers your money questions in plain English. Built for founders who want insights — not spreadsheets.
            </p>
            {emailInputHero}
            {joined && (
              <div style={{ fontSize: 14, color: "#0E9F6E", fontWeight: 600, marginBottom: 14 }}>
                ✓ You&apos;re on the list. Check your inbox for early access.
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "10px 20px", flexWrap: "wrap", fontSize: 13.5, color: "#71798A", fontWeight: 500 }}>
              <span>✓ $0 free tier</span>
              <span>✓ 5-minute setup</span>
              <span>✓ No card required</span>
            </div>
            <Link href="/app/dashboard" style={{ marginTop: 26, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14.5, fontWeight: 600, color: "#0B1220" }}>
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#F0F4FF", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#2F6BFF" }}>▶</span>
              Try the live demo — no signup
            </Link>
          </div>

          {/* HERO VISUAL: AI CFO chat mock */}
          <div style={{ animation: "sbFadeUp .7s .1s ease both", position: "relative" }}>
            <div style={{ position: "absolute", inset: "-16px -10px", background: "linear-gradient(135deg,rgba(47,107,255,.12),rgba(109,94,246,.12))", borderRadius: 28, filter: "blur(6px)" }} />
            <div style={{ position: "relative", background: "#0B1020", borderRadius: 20, padding: 20, boxShadow: "0 30px 70px -20px rgba(11,16,32,.5)", border: "1px solid #1C2740" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: GRAD, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", border: "2px solid #fff" }} />
                </div>
                <span style={{ color: "#E8EDF6", fontWeight: 600, fontSize: 14 }}>Sable CFO</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#5DE0A8", background: "rgba(16,185,129,.14)", padding: "3px 9px", borderRadius: 100, fontWeight: 600 }}>● online</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <div style={{ background: "#2F6BFF", color: "#fff", padding: "11px 15px", borderRadius: "14px 14px 4px 14px", fontSize: 13.5, maxWidth: "78%" }}>
                  What was my net profit last month?
                </div>
              </div>
              <div style={{ display: "flex", gap: 9, marginBottom: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: GRAD, flexShrink: 0 }} />
                <div style={{ background: "#141C30", border: "1px solid #212C46", color: "#D7DEEC", padding: "13px 15px", borderRadius: "14px 14px 14px 4px", fontSize: 13.5, lineHeight: 1.5, maxWidth: "82%" }}>
                  Your <b style={{ color: "#fff" }}>net profit in June was $18,420</b> — up 12% from May. Revenue held at $52,900 while software spend dropped $1,100.
                  <div style={{ marginTop: 11, display: "flex", alignItems: "flex-end", gap: 5, height: 44 }}>
                    <div style={{ flex: 1, background: "#243050", borderRadius: 3, height: "52%" }} />
                    <div style={{ flex: 1, background: "#243050", borderRadius: 3, height: "64%" }} />
                    <div style={{ flex: 1, background: "#243050", borderRadius: 3, height: "48%" }} />
                    <div style={{ flex: 1, background: "#243050", borderRadius: 3, height: "70%" }} />
                    <div style={{ flex: 1, background: "linear-gradient(#6D5EF6,#2F6BFF)", borderRadius: 3, height: "100%" }} />
                  </div>
                </div>
              </div>
            </div>
            {/* floating KPI chip */}
            <div className="sb-kpi-chip" style={{ position: "absolute", bottom: -22, left: -26, background: "#fff", border: "1px solid #E7ECF4", borderRadius: 14, padding: "13px 16px", boxShadow: "0 16px 34px -12px rgba(11,16,32,.28)" }}>
              <div style={{ fontSize: 11, color: "#8A93A3", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Cash runway</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22 }}>
                14.2 <span style={{ fontSize: 13, color: "#0E9F6E" }}>months</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LOGO STRIP */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "44px 28px 8px" }}>
        <div style={{ textAlign: "center", fontSize: 12.5, color: "#98A1B2", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 22 }}>
          Trusted by fast-moving small businesses
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 52, flexWrap: "wrap", opacity: 0.6 }}>
          {["Northwind", "Lumen&Co", "Basecamp42", "Frameworq", "Palette"].map((n) => (
            <span key={n} style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 21, color: "#6B7488" }}>{n}</span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 28px 20px" }}>
        <div style={{ maxWidth: 640, marginBottom: 44 }}>
          <div style={{ color: "#2F6BFF", fontWeight: 600, fontSize: 14, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 12 }}>The AI CFO</div>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px, 5.5vw, 38px)", lineHeight: 1.08, letterSpacing: "-.025em", fontWeight: 700, margin: "0 0 14px" }}>
            Everything QuickBooks does — minus the accountant.
          </h2>
          <p style={{ fontSize: 17, color: "#4A5566", lineHeight: 1.55, margin: 0 }}>Six things Sable does automatically, from day one.</p>
        </div>
        <div className="sb-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {features.map((f) => (
            <div key={f.title} style={{ background: "#F7F9FC", border: "1px solid #EBEFF6", borderRadius: 18, padding: 26 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 18 }}>{f.icon}</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 18, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 14.5, color: "#5A6472", lineHeight: 1.55 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS (dark) */}
      <div style={{ background: "#0A1020", marginTop: 80, padding: "80px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 50px" }}>
            <div style={{ color: "#6D9CFF", fontWeight: 600, fontSize: 14, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px, 5.5vw, 38px)", lineHeight: 1.08, letterSpacing: "-.025em", fontWeight: 700, margin: 0, color: "#F3F6FC" }}>
              From messy bank feed to clear answers in 5 minutes.
            </h2>
          </div>
          <div className="sb-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {steps.map((st) => (
              <div key={st.n} style={{ background: "#0F1830", border: "1px solid #1D2A47", borderRadius: 18, padding: 28 }}>
                <div className="mono" style={{ color: "#6D9CFF", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{st.n}</div>
                <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 20, color: "#F3F6FC", marginBottom: 10 }}>{st.title}</div>
                <div style={{ fontSize: 14.5, color: "#9AA6BC", lineHeight: 1.6 }}>{st.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COMPARISON */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "80px 28px 20px" }}>
        <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 40px" }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px, 5.5vw, 36px)", lineHeight: 1.1, letterSpacing: "-.025em", fontWeight: 700, margin: "0 0 12px" }}>Why teams switch to Sable</h2>
          <p style={{ fontSize: 16.5, color: "#4A5566", margin: 0 }}>Legacy tools were built for accountants. Sable is built for you.</p>
        </div>
        <div className="sb-scroll-x sb-scroll" style={{ border: "1px solid #E7ECF4", borderRadius: 18, boxShadow: "0 20px 44px -26px rgba(11,16,32,.18)" }}>
          <div style={{ minWidth: 640 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", background: "#0B1220", color: "#E8EDF6" }}>
              <div style={{ padding: "16px 22px", fontSize: 13, color: "#9AA6BC", fontWeight: 600 }}>Feature</div>
              <div style={{ padding: "16px 12px", textAlign: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, background: "linear-gradient(135deg,rgba(47,107,255,.28),rgba(109,94,246,.28))" }}>Sable</div>
              <div style={{ padding: "16px 12px", textAlign: "center", fontSize: 14, fontWeight: 600, color: "#9AA6BC" }}>QuickBooks</div>
              <div style={{ padding: "16px 12px", textAlign: "center", fontSize: 14, fontWeight: 600, color: "#9AA6BC" }}>Xero</div>
            </div>
            {compare.map((row) => (
              <div key={row.label} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", borderTop: "1px solid #EEF1F7", background: row.bg }}>
                <div style={{ padding: "15px 22px", fontSize: 14.5, fontWeight: 500 }}>{row.label}</div>
                <div style={{ padding: "15px 12px", textAlign: "center", fontSize: 14, fontWeight: 600, color: "#1B4DE0", background: "rgba(47,107,255,.05)" }}>{row.sable}</div>
                <div style={{ padding: "15px 12px", textAlign: "center", fontSize: 14, color: "#8A93A3" }}>{row.qb}</div>
                <div style={{ padding: "15px 12px", textAlign: "center", fontSize: 14, color: "#8A93A3" }}>{row.xero}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* METRICS BAND */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "70px 28px" }}>
        <div className="sb-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, textAlign: "center" }}>
          {stats.map((m) => (
            <div key={m.l}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "clamp(32px, 6vw, 44px)", letterSpacing: "-.02em", background: GRAD_TEXT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{m.v}</div>
              <div style={{ fontSize: 14, color: "#5A6472", marginTop: 6 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIAL */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 28px 70px" }}>
        <div style={{ background: "#F7F9FC", border: "1px solid #EBEFF6", borderRadius: 22, padding: "clamp(24px, 5vw, 44px)" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 4vw, 25px)", lineHeight: 1.4, letterSpacing: "-.01em", fontWeight: 500, marginBottom: 24 }}>
            &quot;I asked Sable &apos;can I afford to hire?&apos; and it walked me through my runway in seconds. It replaced a $2k/mo bookkeeper in our first week.&quot;
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: GRAD }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Maya Okafor</div>
              <div style={{ fontSize: 13.5, color: "#8A93A3" }}>Founder, Northwind Studio</div>
            </div>
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ background: "#0A1020", padding: "80px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -140, left: "50%", transform: "translateX(-50%)", width: 760, height: 400, background: "radial-gradient(ellipse at center, rgba(47,107,255,.28), transparent 70%)" }} />
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(32px, 7vw, 44px)", lineHeight: 1.06, letterSpacing: "-.03em", fontWeight: 700, color: "#F3F6FC", margin: "0 0 16px" }}>Meet your AI CFO today.</h2>
          <p style={{ fontSize: 18, color: "#9AA6BC", margin: "0 0 30px" }}>Join 2,400+ founders on the beta waitlist. Free tier, live forever.</p>
          <div className="sb-email-row" style={{ display: "flex", gap: 10, maxWidth: 460, margin: "0 auto 16px" }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{ flex: 1, minWidth: 0, fontSize: 15, padding: "15px 16px", border: "1px solid #263252", borderRadius: 12, outline: "none", background: "#0F1830", color: "#F3F6FC" }}
            />
            <button
              onClick={joinWaitlist}
              style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 15, color: "#fff", background: "#2F6BFF", padding: "15px 24px", borderRadius: 12, whiteSpace: "nowrap" }}
            >
              Join the beta
            </button>
          </div>
          {joined && <div style={{ fontSize: 14, color: "#5DE0A8", fontWeight: 600 }}>✓ You&apos;re in. Welcome to Sable.</div>}
        </div>
      </div>

      <Footer links={[{ label: "Pricing", href: "/pricing" }, { label: "Security" }, { label: "Docs" }, { label: "Twitter/X" }]} />
    </div>
  );
}
