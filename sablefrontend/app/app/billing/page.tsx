"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DISPLAY, GRAD } from "../../theme";
import { usage as staticUsage, receipts } from "../../data";
import { billingApi, type UsageSummary } from "../../lib/api";

const METER_LABELS: Record<string, string> = {
  ai_credits: "AI credits",
  ocr: "Receipt OCR",
  invoices: "Invoices",
  expenses: "Expenses",
  storage_mb: "Storage (MB)",
};

export default function Billing() {
  const router = useRouter();
  const [planName, setPlanName] = useState("Free Trial");
  const [status, setStatus] = useState("Trialing");
  const [usageData, setUsageData] = useState<UsageSummary | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [{ plans }, { subscription }] = await Promise.all([
          billingApi.plans(),
          billingApi.subscription(),
        ]);
        if (active) {
          const matched = plans.find((p) => p.id === subscription.plan_id);
          setPlanName(matched?.name ?? "Free Trial");
          setStatus(subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1));
        }
      } catch {/* keep defaults */}
      try {
        const u = await billingApi.usage();
        if (active) setUsageData(u);
      } catch {/* keep static */}
    })();
    return () => { active = false; };
  }, []);

  // Live usage meters (AI credits first), fall back to placeholders while loading.
  const usage = usageData
    ? ["ai_credits", "ocr", "invoices"].map((m) => {
        const met = usageData.metrics[m];
        const limit = met?.limit ?? null;
        return {
          label: METER_LABELS[m] ?? m,
          used: `${met?.used ?? 0}${limit != null ? ` / ${limit}` : ""}`,
          pct: `${met?.pct ?? 0}%`,
          color: met?.nearLimit ? "#D64545" : "linear-gradient(90deg,#2F6BFF,#6D5EF6)",
          note: limit == null ? "Unlimited" : `${met?.remaining ?? 0} remaining`,
        };
      })
    : staticUsage;

  return (
    <div style={{ maxWidth: 1000, animation: "sbFadeUp .4s ease both" }}>
      <div className="sb-split" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* current plan */}
        <div style={{ background: "linear-gradient(135deg,#0F1830,#0A1020)", borderRadius: 16, padding: 24, color: "#E8EDF6", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -20, width: 150, height: 150, background: "radial-gradient(circle, rgba(109,94,246,.35), transparent 70%)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
            <div>
              <div style={{ fontSize: 12.5, color: "#9AA6BC", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Current plan</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 30, marginTop: 6 }}>{planName}</div>
              <div style={{ fontSize: 13.5, color: "#9AA6BC", marginTop: 2 }}>Manage your subscription and usage</div>
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "#5DE0A8", background: "rgba(16,185,129,.14)", padding: "4px 11px", borderRadius: 100 }}>● {status}</span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20, position: "relative" }}>
            <button onClick={() => router.push("/pricing")} style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#fff", background: GRAD, padding: "10px 16px", borderRadius: 9 }}>
              Upgrade to Pro
            </button>
            <button style={{ border: "1px solid #2A3A5E", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#9AA6BC", background: "transparent", padding: "10px 16px", borderRadius: 9 }}>
              Manage plan
            </button>
          </div>
        </div>
        {/* payment method */}
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 22 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Payment method</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 13, border: "1px solid #EAEEF5", borderRadius: 11 }}>
            <div style={{ width: 40, height: 27, borderRadius: 5, background: GRAD }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Visa •••• 4242</div>
              <div style={{ fontSize: 12, color: "#8A93A3" }}>Expires 08/28</div>
            </div>
            <span style={{ fontSize: 12.5, color: "#2F6BFF", fontWeight: 600, cursor: "pointer" }}>Edit</span>
          </div>
          <div style={{ fontSize: 12.5, color: "#8A93A3", marginTop: 12 }}>
            Next charge <b style={{ color: "#0B1220" }}>$468</b> on Jan 3, 2027
          </div>
        </div>
      </div>

      {/* usage */}
      <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 22, marginBottom: 16 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, marginBottom: 18 }}>Usage this cycle</div>
        <div className="sb-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {usage.map((u) => (
            <div key={u.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 7 }}>
                <span style={{ fontWeight: 500 }}>{u.label}</span>
                <span className="mono" style={{ color: "#5A6472" }}>{u.used}</span>
              </div>
              <div style={{ height: 8, background: "#F1F4F9", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: u.pct, height: "100%", background: u.color, borderRadius: 6 }} />
              </div>
              <div style={{ fontSize: 11.5, color: "#8A93A3", marginTop: 6 }}>{u.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="sb-split" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
        {/* referral */}
        <div style={{ background: "linear-gradient(135deg,#F0F4FF,#F3F0FF)", border: "1px solid #E1E8FF", borderRadius: 16, padding: 22 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Earn free months 🎁</div>
          <div style={{ fontSize: 13.5, color: "#5A6472", lineHeight: 1.55, marginBottom: 14 }}>
            Every friend who upgrades earns you 1 free month. You&apos;ve earned <b style={{ color: "#1B4DE0" }}>2 months</b> so far.
          </div>
          <div style={{ display: "flex", gap: 8, background: "#fff", border: "1px solid #DDE6FF", borderRadius: 10, padding: "5px 5px 5px 13px", alignItems: "center" }}>
            <span className="mono" style={{ flex: 1, fontSize: 12.5, color: "#5A6472" }}>sable.app/r/maya-9f2</span>
            <button style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12.5, color: "#fff", background: "#2F6BFF", padding: "8px 13px", borderRadius: 8 }}>Copy</button>
          </div>
        </div>
        {/* receipts */}
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #EEF1F7", fontFamily: DISPLAY, fontWeight: 600, fontSize: 15 }}>Billing history</div>
          {receipts.map((r) => (
            <div key={r.date} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: "1px solid #F1F4F9" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{r.date}</div>
                <div style={{ fontSize: 12, color: "#8A93A3" }}>{r.desc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="mono" style={{ fontSize: 13.5, fontWeight: 600 }}>{r.amt}</span>
                <span style={{ fontSize: 12.5, color: "#2F6BFF", fontWeight: 600, cursor: "pointer" }}>PDF</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
