"use client";

import { useRouter } from "next/navigation";
import { DISPLAY } from "../../theme";
import { kpis, chartBars, recentTx, outstanding } from "../../data";

export default function Dashboard() {
  const router = useRouter();

  return (
    <div style={{ maxWidth: 1080, animation: "sbFadeUp .4s ease both" }}>
      <div className="r-kpi" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
        {kpis.map((k) => (
          <div key={k.label} className="sb-card" style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 12.5, color: "#8A93A3", fontWeight: 600, marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 27, letterSpacing: "-.02em" }}>{k.value}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: k.deltaColor, marginTop: 5 }}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="r-aside" style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* chart */}
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16 }}>Revenue vs Expenses</div>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#5A6472" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: "#2F6BFF" }} />Revenue
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: "#D5DEEC" }} />Expenses
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 180 }}>
            {chartBars.map((b) => (
              <div key={b.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", display: "flex", gap: 5, alignItems: "flex-end", height: "100%" }}>
                  <div style={{ flex: 1, background: "linear-gradient(#2F6BFF,#5A87FF)", borderRadius: "5px 5px 0 0", height: b.rev, transformOrigin: "bottom", animation: "sbBar .6s ease both" }} />
                  <div style={{ flex: 1, background: "#D5DEEC", borderRadius: "5px 5px 0 0", height: b.exp, transformOrigin: "bottom", animation: "sbBar .6s ease both" }} />
                </div>
                <span style={{ fontSize: 11.5, color: "#8A93A3" }}>{b.m}</span>
              </div>
            ))}
          </div>
        </div>
        {/* AI insight */}
        <div style={{ background: "linear-gradient(165deg,#0F1830,#0A1020)", borderRadius: 16, padding: 22, color: "#E8EDF6", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: "radial-gradient(circle, rgba(109,94,246,.35), transparent 70%)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, position: "relative" }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg,#2F6BFF,#6D5EF6)" }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>CFO insight</span>
          </div>
          <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "#C9D3E6", position: "relative" }}>
            Your net profit is up <b style={{ color: "#5DE0A8" }}>12%</b> this month. But I spotted a <b style={{ color: "#fff" }}>duplicate $99 Notion charge</b> on Jun 18 and two invoices worth <b style={{ color: "#fff" }}>$8,700</b> going overdue.
          </div>
          <button
            onClick={() => router.push("/app/cfo")}
            className="sb-btn"
            style={{ marginTop: 18, border: "1px solid #2A3A5E", background: "#101A32", color: "#E8EDF6", cursor: "pointer", fontWeight: 600, fontSize: 13, padding: "9px 14px", borderRadius: 9, position: "relative" }}
          >
            Review with CFO →
          </button>
        </div>
      </div>

      <div className="r-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 20 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Recent transactions</div>
          {recentTx.map((t) => (
            <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid #F1F4F9" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "#F1F4F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{t.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#8A93A3" }}>{t.cat}</div>
              </div>
              <div className="mono" style={{ fontSize: 13.5, fontWeight: 500, color: t.color }}>{t.amt}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15 }}>Outstanding invoices</div>
            <span onClick={() => router.push("/app/invoices")} style={{ fontSize: 12.5, color: "#2F6BFF", cursor: "pointer", fontWeight: 600 }}>View all →</span>
          </div>
          {outstanding.map((o) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid #F1F4F9" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{o.client}</div>
                <div style={{ fontSize: 12, color: "#8A93A3" }}>{o.id} · due {o.due}</div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 100, background: o.badgeBg, color: o.badgeColor }}>{o.status}</span>
              <div className="mono" style={{ fontSize: 13.5, fontWeight: 500, width: 64, textAlign: "right" }}>{o.amt}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
