"use client";

import { useState } from "react";
import { DISPLAY, GRAD } from "../../theme";
import { buildPlans, addons, faqs } from "../../data";
import { useOnboarding } from "../onboarding-context";
import { Footer } from "../Footer";

export default function Pricing() {
  const { openOnboard } = useOnboarding();
  const [annual, setAnnual] = useState(true);
  const plans = buildPlans(annual);

  return (
    <div style={{ animation: "sbFade .4s ease both" }}>
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -160, left: "50%", transform: "translateX(-50%)", width: 800, height: 420, background: "radial-gradient(ellipse at center, rgba(47,107,255,.12), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "66px 28px 30px", textAlign: "center", position: "relative" }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(32px, 7vw, 48px)", lineHeight: 1.05, letterSpacing: "-.03em", fontWeight: 700, margin: "0 0 14px" }}>Simple pricing that scales with you</h1>
          <p style={{ fontSize: 18, color: "#4A5566", margin: "0 0 28px" }}>Start free. Upgrade when your AI CFO starts paying for itself.</p>
          <div style={{ display: "inline-flex", background: "#F0F3F9", border: "1px solid #E4E9F2", borderRadius: 12, padding: 4, gap: 4 }}>
            <button
              onClick={() => setAnnual(false)}
              style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, padding: "9px 20px", borderRadius: 9, background: !annual ? "#fff" : "transparent", color: !annual ? "#0B1220" : "#71798A" }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, padding: "9px 20px", borderRadius: 9, background: annual ? "#fff" : "transparent", color: annual ? "#0B1220" : "#71798A" }}
            >
              Annual <span style={{ color: "#0E9F6E", fontSize: 12 }}>−20%</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 28px 40px" }}>
        <div className="sb-plans-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, alignItems: "stretch" }}>
          {plans.map((p) => (
            <div key={p.name} style={{ background: p.cardBg, border: p.border, borderRadius: 18, padding: "24px 20px", display: "flex", flexDirection: "column", position: "relative", boxShadow: p.shadow }}>
              {p.popular && (
                <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: GRAD, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 100, whiteSpace: "nowrap", letterSpacing: ".03em" }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, color: p.nameColor, marginBottom: 6 }}>{p.name}</div>
              <div style={{ minHeight: 34, fontSize: 12.5, color: p.subColor, lineHeight: 1.4, marginBottom: 14 }}>{p.tagline}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 4 }}>
                <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 34, letterSpacing: "-.02em", color: p.priceColor }}>{p.price}</span>
                <span style={{ fontSize: 13, color: p.subColor }}>{p.per}</span>
              </div>
              <div style={{ minHeight: 18, fontSize: 12, color: p.subColor, marginBottom: 18 }}>{p.billed}</div>
              <button
                onClick={openOnboard}
                style={{ border: p.btnBorder, cursor: "pointer", fontWeight: 600, fontSize: 14, padding: 11, borderRadius: 10, background: p.btnBg, color: p.btnColor, marginBottom: 20 }}
              >
                {p.cta}
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {p.feats.map((ft) => (
                  <div key={ft} style={{ display: "flex", gap: 9, fontSize: 13, color: p.featColor, lineHeight: 1.4 }}>
                    <span style={{ color: p.checkColor, flexShrink: 0 }}>✓</span>
                    <span>{ft}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD-ONS */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 28px 20px" }}>
        <h3 style={{ fontFamily: DISPLAY, fontSize: 24, letterSpacing: "-.02em", fontWeight: 700, margin: "0 0 6px" }}>Premium add-ons</h3>
        <p style={{ fontSize: 15, color: "#5A6472", margin: "0 0 22px" }}>Bolt on exactly what your business needs.</p>
        <div className="sb-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {addons.map((a) => (
            <div key={a.name} style={{ border: "1px solid #EBEFF6", background: "#F7F9FC", borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</span>
                <span className="mono" style={{ fontSize: 13, color: "#1B4DE0", fontWeight: 600 }}>{a.price}</span>
              </div>
              <div style={{ fontSize: 13, color: "#5A6472", lineHeight: 1.5 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "50px 28px 80px" }}>
        <h3 style={{ fontFamily: DISPLAY, fontSize: 26, letterSpacing: "-.02em", fontWeight: 700, margin: "0 0 22px", textAlign: "center" }}>Questions, answered</h3>
        {faqs.map((q) => (
          <div key={q.q} style={{ borderBottom: "1px solid #EDF0F6", padding: "20px 0" }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 7 }}>{q.q}</div>
            <div style={{ fontSize: 14.5, color: "#5A6472", lineHeight: 1.6 }}>{q.a}</div>
          </div>
        ))}
      </div>

      <Footer links={[{ label: "Product", href: "/" }, { label: "Security" }, { label: "Docs" }]} />
    </div>
  );
}
