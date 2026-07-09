"use client";

import { DISPLAY } from "../../theme";
import { forecastBars, plRows } from "../../data";

export default function Reports() {
  return (
    <div style={{ maxWidth: 1040, animation: "sbFadeUp .4s ease both" }}>
      {/* forecast */}
      <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 22, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 17 }}>90-day cash-flow forecast</div>
            <div style={{ fontSize: 13, color: "#8A93A3", marginTop: 2 }}>Projected balance based on your patterns</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 24, color: "#0E9F6E" }}>$518K</div>
            <div style={{ fontSize: 12, color: "#8A93A3" }}>projected in 90 days</div>
          </div>
        </div>
        {/* line-ish area chart via bars */}
        <div style={{ position: "relative", height: 190, display: "flex", alignItems: "flex-end", gap: 6, paddingTop: 10 }}>
          {forecastBars.map((f) => (
            <div key={f.w} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
              <div style={{ width: "100%", background: `linear-gradient(180deg,${f.top},${f.bottom})`, borderRadius: "4px 4px 0 0", height: f.h, transformOrigin: "bottom", animation: "sbBar .6s ease both" }} />
              <span style={{ fontSize: 10, color: "#A6AFBE" }}>{f.w}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "flex-start", background: "#F0F4FF", border: "1px solid #DDE6FF", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg,#2F6BFF,#6D5EF6)", flexShrink: 0 }} />
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "#243049" }}>
            <b>CFO narrative:</b> Expect a cash dip in <b>week 3 of August</b> as two large software renewals and payroll overlap. You&apos;ll stay above $380K throughout — no action needed, but avoid new commitments that week.
          </div>
        </div>
      </div>

      <div className="r-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* P&L */}
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 22 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Profit &amp; Loss — June</div>
          {plRows.map((p) => (
            <div key={p.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${p.border}` }}>
              <span style={{ fontSize: 14, fontWeight: p.weight, color: p.labelColor }}>{p.label}</span>
              <span className="mono" style={{ fontSize: 14, fontWeight: p.weight, color: p.valColor }}>{p.value}</span>
            </div>
          ))}
          <button style={{ marginTop: 16, width: "100%", border: "1px solid #DCE3EE", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#0B1220", background: "#F7F9FC", padding: 10, borderRadius: 9 }}>
            ↓ Export PDF
          </button>
        </div>
        {/* burn / runway */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 12.5, color: "#8A93A3", fontWeight: 600, marginBottom: 8 }}>Monthly burn rate</div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 28 }}>$31,200</div>
            <div style={{ fontSize: 12.5, color: "#0E9F6E", fontWeight: 600, marginTop: 4 }}>↓ 4% — trending down</div>
          </div>
          <div style={{ background: "linear-gradient(165deg,#0F1830,#0A1020)", borderRadius: 16, padding: 20, color: "#E8EDF6" }}>
            <div style={{ fontSize: 12.5, color: "#9AA6BC", fontWeight: 600, marginBottom: 8 }}>Cash runway</div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 28 }}>14.2 months</div>
            <div style={{ height: 7, background: "#1D2A47", borderRadius: 6, overflow: "hidden", marginTop: 12 }}>
              <div style={{ width: "71%", height: "100%", background: "linear-gradient(90deg,#2F6BFF,#6D5EF6)" }} />
            </div>
            <div style={{ fontSize: 12, color: "#71798A", marginTop: 8 }}>Healthy — above the 12-month safety line</div>
          </div>
        </div>
      </div>
    </div>
  );
}
