"use client";

import { useEffect, useState, useCallback } from "react";
import { DISPLAY } from "../../theme";
import { aiApi } from "../../lib/api";

type Row = Record<string, unknown>;
type Result = { table: string; total: number; results: Row[]; interpreted: unknown } | null;

const money = (v: unknown) => "$" + Number(v ?? 0).toLocaleString();
const fmt = (v: unknown) => {
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v ?? "—") : d.toISOString().slice(0, 10);
};

const COLUMNS: Record<string, { key: string; label: string; render?: (r: Row) => string; align?: "right" }[]> = {
  expenses: [
    { key: "vendor", label: "Vendor", render: (r) => String(r.vendor ?? r.description ?? "—") },
    { key: "category", label: "Category" },
    { key: "expense_date", label: "Date", render: (r) => fmt(r.expense_date) },
    { key: "amount", label: "Amount", render: (r) => money(r.amount), align: "right" },
  ],
  invoices: [
    { key: "invoice_number", label: "Invoice" },
    { key: "client_name", label: "Client" },
    { key: "status", label: "Status" },
    { key: "total", label: "Total", render: (r) => money(r.total), align: "right" },
  ],
  revenues: [
    { key: "source", label: "Source" },
    { key: "revenue_date", label: "Date", render: (r) => fmt(r.revenue_date) },
    { key: "amount", label: "Amount", render: (r) => money(r.amount), align: "right" },
  ],
};

export default function Search() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      setResult(await aiApi.search(query));
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Read ?q= from the URL on mount (avoids the useSearchParams Suspense rule).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("q") ?? "";
    if (initial) {
      setQ(initial);
      void run(initial);
    }
  }, [run]);

  const cols = result ? COLUMNS[result.table] ?? COLUMNS.expenses : [];
  const grid = cols.map(() => "1fr").join(" ");

  return (
    <div style={{ maxWidth: 940, animation: "sbFadeUp .4s ease both" }}>
      <form
        onSubmit={(e) => { e.preventDefault(); run(q); }}
        style={{ display: "flex", gap: 10, marginBottom: 18 }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='e.g. "software expenses over 50 this year"'
          style={{ flex: 1, fontSize: 14.5, padding: "12px 15px", border: "1px solid #DCE3EE", borderRadius: 11, outline: "none" }}
        />
        <button type="submit" style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#fff", background: "#2F6BFF", padding: "0 22px", borderRadius: 11 }}>Search</button>
      </form>

      <div style={{ fontSize: 13, color: "#8A93A3", marginBottom: 14 }}>
        Powered by Gemma — your question is turned into a structured filter, then the database answers (§4 Feature B).
      </div>

      {loading && <div style={{ fontSize: 13.5, color: "#8A93A3" }}>Interpreting your question…</div>}

      {result && !loading && (
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", borderBottom: "1px solid #EEF1F7" }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15 }}>
              {result.total} {result.table} matched
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: "#EEF3FF", color: "#2F6BFF" }}>
              interpreted as “{result.table}”
            </span>
          </div>
          {result.results.length === 0 && <div style={{ padding: "20px 22px", fontSize: 13.5, color: "#8A93A3" }}>No matching records.</div>}
          {result.results.length > 0 && (
            <div className="sb-scroll-x sb-scroll">
              <div style={{ minWidth: 520 }}>
                <div style={{ display: "grid", gridTemplateColumns: grid, padding: "12px 22px", fontSize: 12, color: "#8A93A3", fontWeight: 600, background: "#FBFCFE", borderBottom: "1px solid #EEF1F7" }}>
                  {cols.map((c) => <div key={c.key} style={{ textAlign: c.align }}>{c.label}</div>)}
                </div>
                {result.results.map((r, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: grid, padding: "13px 22px", borderBottom: "1px solid #F1F4F9", fontSize: 13.5 }}>
                    {cols.map((c) => (
                      <div key={c.key} className={c.align === "right" ? "mono" : undefined} style={{ textAlign: c.align, fontWeight: c.align === "right" ? 600 : 400 }}>
                        {c.render ? c.render(r) : String(r[c.key] ?? "—")}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
