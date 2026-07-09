"use client";

import { useEffect, useState, useCallback } from "react";
import { DISPLAY } from "../../theme";
import { revenuesApi, ApiError, type RevenueView } from "../../lib/api";

export default function Revenue() {
  const [rows, setRows] = useState<RevenueView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await revenuesApi.list());
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load revenue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    const amt = parseFloat(amount);
    if (!source || !amt) return;
    try {
      await revenuesApi.create({ amount: amt, source, description: desc || undefined });
      setShowForm(false);
      setSource("");
      setAmount("");
      setDesc("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add revenue");
    }
  };

  const total = rows.reduce((a, b) => a + b.amount, 0);
  const bySource = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.source] = (acc[r.source] ?? 0) + r.amount;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const max = bySource[0]?.[1] ?? 1;
  const COLORS = ["#2F6BFF", "#6D5EF6", "#5A87FF", "#0E9F6E", "#A6B7FF", "#8A93A3"];

  const inputStyle = { width: "100%", fontSize: 14, padding: "10px 12px", border: "1px solid #DCE3EE", borderRadius: 9, outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ maxWidth: 1000, animation: "sbFadeUp .4s ease both" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* total */}
        <div style={{ background: "linear-gradient(135deg,#0F1830,#0A1020)", borderRadius: 16, padding: 24, color: "#E8EDF6", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -20, width: 150, height: 150, background: "radial-gradient(circle, rgba(14,159,110,.3), transparent 70%)" }} />
          <div style={{ fontSize: 12.5, color: "#9AA6BC", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", position: "relative" }}>Total revenue (YTD)</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 34, marginTop: 8, position: "relative" }}>${Math.round(total).toLocaleString()}</div>
          <div style={{ fontSize: 13, color: "#9AA6BC", marginTop: 4, position: "relative" }}>{rows.length} income record{rows.length === 1 ? "" : "s"}</div>
        </div>
        {/* source breakdown */}
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 20 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Revenue by source</div>
          {bySource.length === 0 && <div style={{ fontSize: 13, color: "#8A93A3" }}>No revenue yet.</div>}
          {bySource.map(([name, amt], i) => (
            <div key={name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ fontWeight: 500 }}>{name}</span>
                <span className="mono" style={{ color: "#5A6472" }}>${Math.round(amt).toLocaleString()}</span>
              </div>
              <div style={{ height: 7, background: "#F1F4F9", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${(amt / max) * 100}%`, height: "100%", background: COLORS[i % COLORS.length], borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid #EEF1F7" }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16 }}>Income</div>
          <button onClick={() => setShowForm((s) => !s)} style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#fff", background: "#0E9F6E", padding: "9px 15px", borderRadius: 10 }}>
            + Add revenue
          </button>
        </div>

        {showForm && (
          <div style={{ padding: "20px 22px", background: "#F7F9FC", borderBottom: "1px solid #EEF1F7", animation: "sbFadeUp .3s ease both" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.4fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 6 }}>Source</label>
                <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Client retainer" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 6 }}>Amount ($)</label>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 6 }}>Description</label>
                <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional note" style={inputStyle} />
              </div>
            </div>
            <button onClick={create} style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#fff", background: "#0B1220", padding: "10px 18px", borderRadius: 9 }}>Add income</button>
          </div>
        )}

        {error && <div style={{ padding: "12px 22px", color: "#D64545", fontSize: 13 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.5fr 1fr", padding: "12px 22px", fontSize: 12, color: "#8A93A3", fontWeight: 600, borderBottom: "1px solid #EEF1F7", background: "#FBFCFE" }}>
          <div>Source</div>
          <div>Description</div>
          <div style={{ textAlign: "right" }}>Amount · Date</div>
        </div>
        {loading && <div style={{ padding: "16px 22px", fontSize: 13, color: "#8A93A3" }}>Loading…</div>}
        {!loading && rows.length === 0 && <div style={{ padding: "20px 22px", fontSize: 13.5, color: "#8A93A3" }}>No income recorded yet. Add your first revenue above.</div>}
        {rows.map((r) => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 1.5fr 1fr", alignItems: "center", padding: "14px 22px", borderBottom: "1px solid #F1F4F9" }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{r.source}</div>
            <div style={{ fontSize: 13.5, color: "#5A6472" }}>{r.description}</div>
            <div style={{ textAlign: "right" }}>
              <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: "#0E9F6E" }}>+${r.amount.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: "#8A93A3" }}>{r.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
