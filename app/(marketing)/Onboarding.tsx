"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DISPLAY, GRAD } from "../theme";
import { Mark } from "../components/Mark";
import { obUseCases, obBanks, obNextLabels } from "../data";

export function OnboardingModal({
  open,
  onClose,
  onFinish,
}: {
  open: boolean;
  onClose: () => void;
  onFinish: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [biz, setBiz] = useState("");
  const [use, setUse] = useState("");

  if (!open) return null;

  const next = () => {
    if (step >= 3) {
      onFinish();
      router.push("/app/dashboard");
      return;
    }
    setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const dots = [0, 1, 2, 3].map((i) => ({
    w: i === step ? "22px" : "8px",
    bg: i <= step ? "#2F6BFF" : "#E4E9F2",
  }));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(8,12,22,.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "sbFade .25s ease both",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 22,
          boxShadow: "0 40px 90px -30px rgba(8,12,22,.6)",
        }}
      >
        {/* progress */}
        <div style={{ padding: "22px 28px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Mark size={26} />
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 17 }}>Sable</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {dots.map((d, i) => (
              <div key={i} style={{ width: d.w, height: 6, borderRadius: 6, background: d.bg, transition: "all .3s" }} />
            ))}
          </div>
          <span onClick={onClose} style={{ fontSize: 20, color: "#98A1B2", cursor: "pointer", lineHeight: 1 }}>
            ×
          </span>
        </div>

        <div style={{ padding: "26px 28px 28px" }}>
          {step === 0 && (
            <div style={{ animation: "sbFadeUp .3s ease both" }}>
              <h2 style={{ fontFamily: DISPLAY, fontSize: 26, letterSpacing: "-.02em", fontWeight: 700, margin: "0 0 6px" }}>
                Let&apos;s meet your AI CFO
              </h2>
              <p style={{ fontSize: 14.5, color: "#5A6472", margin: "0 0 22px" }}>Two minutes to set up. No card required.</p>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 6 }}>Your name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maya Okafor"
                style={{ width: "100%", fontSize: 15, padding: "12px 14px", border: "1.5px solid #DCE3EE", borderRadius: 11, outline: "none", marginBottom: 16 }}
              />
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 6 }}>Business name</label>
              <input
                value={biz}
                onChange={(e) => setBiz(e.target.value)}
                placeholder="Northwind Studio"
                style={{ width: "100%", fontSize: 15, padding: "12px 14px", border: "1.5px solid #DCE3EE", borderRadius: 11, outline: "none" }}
              />
            </div>
          )}

          {step === 1 && (
            <div style={{ animation: "sbFadeUp .3s ease both" }}>
              <h2 style={{ fontFamily: DISPLAY, fontSize: 26, letterSpacing: "-.02em", fontWeight: 700, margin: "0 0 6px" }}>
                What describes you best?
              </h2>
              <p style={{ fontSize: 14.5, color: "#5A6472", margin: "0 0 20px" }}>Sable tailors your dashboard to fit.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {obUseCases.map((u) => {
                  const active = use === u.k;
                  return (
                    <div
                      key={u.k}
                      onClick={() => setUse(u.k)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 13,
                        padding: "14px 16px",
                        border: `1.5px solid ${active ? "#2F6BFF" : "#EAEEF5"}`,
                        background: active ? "#F0F4FF" : "#fff",
                        borderRadius: 12,
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{u.icon}</span>
                      <div>
                        <div style={{ fontSize: 14.5, fontWeight: 600 }}>{u.title}</div>
                        <div style={{ fontSize: 12.5, color: "#8A93A3" }}>{u.sub}</div>
                      </div>
                      <span style={{ marginLeft: "auto", color: active ? "#2F6BFF" : "transparent", fontSize: 16 }}>
                        {active ? "●" : "○"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: "sbFadeUp .3s ease both" }}>
              <h2 style={{ fontFamily: DISPLAY, fontSize: 26, letterSpacing: "-.02em", fontWeight: 700, margin: "0 0 6px" }}>
                Connect your bank
              </h2>
              <p style={{ fontSize: 14.5, color: "#5A6472", margin: "0 0 20px" }}>
                Secure, read-only sync via Plaid. Sable never stores your login.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {obBanks.map((b) => (
                  <div
                    key={b.name}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", border: "1.5px solid #EAEEF5", borderRadius: 11, cursor: "pointer" }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: b.color }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#8A93A3", background: "#F7F9FC", borderRadius: 10, padding: "11px 13px" }}>
                🔒 Bank-grade encryption · SOC 2 · You can also import a CSV later
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", padding: "10px 0", animation: "sbFadeUp .3s ease both" }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  margin: "0 auto 18px",
                  borderRadius: 16,
                  background: GRAD,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  boxShadow: "0 14px 30px rgba(47,107,255,.35)",
                }}
              >
                ✦
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontSize: 26, letterSpacing: "-.02em", fontWeight: 700, margin: "0 0 8px" }}>
                Your AI CFO is ready
              </h2>
              <p style={{ fontSize: 14.5, color: "#5A6472", margin: "0 auto 8px", maxWidth: 360, lineHeight: 1.55 }}>
                Gemma has categorized your transactions and drafted your first dashboard. Ask it anything.
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            {step > 0 && (
              <button
                onClick={back}
                style={{ border: "1px solid #DCE3EE", cursor: "pointer", fontWeight: 600, fontSize: 14.5, color: "#5A6472", background: "#fff", padding: "13px 20px", borderRadius: 11 }}
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="sb-btn"
              style={{
                flex: 1,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14.5,
                color: "#fff",
                background: "#2F6BFF",
                padding: 13,
                borderRadius: 11,
                boxShadow: "0 8px 18px rgba(47,107,255,.28)",
              }}
            >
              {obNextLabels[step] || "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
