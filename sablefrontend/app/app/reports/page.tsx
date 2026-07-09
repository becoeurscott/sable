"use client";

import { useCallback, useEffect, useState } from "react";
import { DISPLAY } from "../../theme";
import { reportsApi, dashboardApi, aiApi } from "../../lib/api";

type Pl = { revenue: number; expenses: number; netProfit: number; expensesByCategory: { category: string; total: number }[] };
type Point = { month: string; revenue: string; expenses: string };
type Forecast = { averageMonthlyNet: number; trend: string; projection: { month: string; projectedNet: number }[]; note: string };

const money = (n: number) => (n < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString();

export default function Reports() {
  const [tab, setTab] = useState<"pl" | "cashflow">("pl");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pl, setPl] = useState<Pl | null>(null);
  const [series, setSeries] = useState<Point[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);

  const load = useCallback(async () => {
    const [plRes, cf, fc] = await Promise.allSettled([
      reportsApi.pl(from || undefined, to || undefined),
      dashboardApi.cashflow(),
      aiApi.forecast(),
    ]);
    if (plRes.status === "fulfilled") setPl(plRes.value);
    if (cf.status === "fulfilled") setSeries(cf.value.series);
    if (fc.status === "fulfilled") setForecast(fc.value.forecast);
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const cfMax = Math.max(1, ...series.flatMap((p) => [Number(p.revenue), Number(p.expenses)]));
  const projectedTotal = forecast ? forecast.projection.reduce((a, b) => a + b.projectedNet, 0) : 0;

  const input = { fontSize: 13, padding: "8px 10px", border: "1px solid #DCE3EE", borderRadius: 9, outline: "none" } as const;
  const tabBtn = (active: boolean) => ({ border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, padding: "8px 14px", borderRadius: 9, background: active ? "#0B1220" : "#F0F3F9", color: active ? "#fff" : "#5A6472" });

  return (
    <div style={{ maxWidth: 1040, animation: "sbFadeUp .4s ease both" }}>
      {/* controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <button style={tabBtn(tab === "pl")} onClick={() => setTab("pl")}>Profit &amp; Loss</button>
        <button style={tabBtn(tab === "cashflow")} onClick={() => setTab("cashflow")}>Cash Flow</button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, color: "#8A93A3" }}>
          <span>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={input} />
          <span>to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={input} />
        </div>
      </div>

      {/* forecast (live, §5 #12) */}
      <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 22, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 17 }}>Cash-flow forecast</div>
            <div style={{ fontSize: 13, color: "#8A93A3", marginTop: 2 }}>Projected net over the next 3 months</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 24, color: projectedTotal >= 0 ? "#0E9F6E" : "#D64545" }}>{money(projectedTotal)}</div>
            <div style={{ fontSize: 12, color: "#8A93A3" }}>trend: {forecast?.trend ?? "…"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {(forecast?.projection ?? []).map((p) => (
            <div key={p.month} style={{ flex: 1, background: "#F7F9FC", border: "1px solid #EEF1F7", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, color: "#8A93A3" }}>{p.month}</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: p.projectedNet >= 0 ? "#0E9F6E" : "#D64545", marginTop: 4 }}>{money(p.projectedNet)}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "flex-start", background: "#F0F4FF", border: "1px solid #DDE6FF", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg,#2F6BFF,#6D5EF6)", flexShrink: 0 }} />
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "#243049" }}>
            <b>CFO narrative:</b> {forecast ? `Your average monthly net is ${money(forecast.averageMonthlyNet)} and the trend is ${forecast.trend}. ${forecast.note}` : "Building your forecast…"}
          </div>
        </div>
      </div>

      {tab === "pl" ? (
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 22 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Profit &amp; Loss</div>
          {pl ? (
            <>
              {[
                { label: "Revenue", value: money(pl.revenue), w: 500, c: "#0B1220" },
                { label: "Operating expenses", value: money(-pl.expenses), w: 400, c: "#5A6472" },
                { label: "Net profit", value: money(pl.netProfit), w: 700, c: pl.netProfit >= 0 ? "#0E9F6E" : "#D64545" },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid #F1F4F9" }}>
                  <span style={{ fontSize: 14, fontWeight: r.w, color: r.c }}>{r.label}</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: r.w, color: r.c }}>{r.value}</span>
                </div>
              ))}
              {pl.expensesByCategory.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12.5, color: "#8A93A3", fontWeight: 600, marginBottom: 8 }}>Expenses by category</div>
                  {pl.expensesByCategory.map((c) => (
                    <div key={c.category} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13.5 }}>
                      <span style={{ color: "#5A6472" }}>{c.category}</span>
                      <span className="mono" style={{ color: "#5A6472" }}>{money(c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => reportsApi.exportCsv().then((b) => { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "profit-and-loss.csv"; a.click(); URL.revokeObjectURL(u); }).catch(() => {})} style={{ marginTop: 16, width: "100%", border: "1px solid #DCE3EE", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#0B1220", background: "#F7F9FC", padding: 10, borderRadius: 9 }}>
                ↓ Export CSV
              </button>
            </>
          ) : (
            <div style={{ fontSize: 13.5, color: "#8A93A3" }}>Loading P&amp;L…</div>
          )}
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 22 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, marginBottom: 20 }}>Cash flow — last 6 months</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 180, marginBottom: 16 }}>
            {series.map((p) => (
              <div key={p.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", display: "flex", gap: 5, alignItems: "flex-end", height: "100%" }}>
                  <div style={{ flex: 1, background: "linear-gradient(#2F6BFF,#5A87FF)", borderRadius: "5px 5px 0 0", height: `${(Number(p.revenue) / cfMax) * 100}%` }} />
                  <div style={{ flex: 1, background: "#D5DEEC", borderRadius: "5px 5px 0 0", height: `${(Number(p.expenses) / cfMax) * 100}%` }} />
                </div>
                <span style={{ fontSize: 11, color: "#8A93A3" }}>{p.month.slice(5)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", fontSize: 12, color: "#8A93A3", fontWeight: 600, padding: "8px 0", borderBottom: "1px solid #EEF1F7" }}>
            <div>Month</div><div style={{ textAlign: "right" }}>Inflow</div><div style={{ textAlign: "right" }}>Outflow</div><div style={{ textAlign: "right" }}>Net</div>
          </div>
          {series.map((p) => {
            const net = Number(p.revenue) - Number(p.expenses);
            return (
              <div key={p.month} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "10px 0", borderBottom: "1px solid #F1F4F9", fontSize: 13.5 }}>
                <div>{p.month}</div>
                <div className="mono" style={{ textAlign: "right", color: "#0E9F6E" }}>{money(Number(p.revenue))}</div>
                <div className="mono" style={{ textAlign: "right", color: "#5A6472" }}>{money(Number(p.expenses))}</div>
                <div className="mono" style={{ textAlign: "right", fontWeight: 600, color: net >= 0 ? "#0E9F6E" : "#D64545" }}>{money(net)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
