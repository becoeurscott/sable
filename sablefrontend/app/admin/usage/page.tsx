"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError } from "../../lib/api";
import { Card, Stat } from "../ui";

const METER_LABELS: Record<string, string> = {
  ai_credits: "AI credits",
  ocr: "Receipt OCR",
  invoices: "Invoices",
  expenses: "Expenses",
  api_calls: "API calls",
  storage_mb: "Storage (MB)",
};

type Usage = {
  byMetric: { metric: string; used: string; orgs: number }[];
  topOrgs: { id: string; name: string; ai_credits: string; plan_name: string | null; ai_limit: string | null }[];
};

export default function AdminUsage() {
  const [data, setData] = useState<Usage | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .usage()
      .then(setData)
      .catch((e) => setErr(e instanceof ApiError ? e.message : "Failed to load usage"));
  }, []);

  if (err) return <div style={{ color: "#D64545", fontSize: 14 }}>{err}</div>;
  if (!data) return <div style={{ color: "#8A93A3", fontSize: 14 }}>Loading usage…</div>;

  return (
    <div style={{ maxWidth: 1000, animation: "sbFadeUp .4s ease both" }}>
      <div className="sb-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
        {data.byMetric.length === 0 && <div style={{ fontSize: 13.5, color: "#8A93A3" }}>No usage recorded this cycle yet.</div>}
        {data.byMetric.map((m) => (
          <Stat
            key={m.metric}
            label={METER_LABELS[m.metric] ?? m.metric}
            value={Number(m.used).toLocaleString()}
            sub={`${m.orgs} org${m.orgs === 1 ? "" : "s"} this cycle`}
          />
        ))}
      </div>

      <Card title="Top organizations by AI credits" style={{ padding: 0, overflow: "hidden" }}>
        <div className="sb-scroll-x sb-scroll">
          <div style={{ minWidth: 560 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1.4fr", padding: "12px 22px", fontSize: 12, color: "#8A93A3", fontWeight: 600, borderBottom: "1px solid #EEF1F7", background: "#FBFCFE" }}>
              <div>Organization</div>
              <div>Plan</div>
              <div style={{ textAlign: "right" }}>Used</div>
              <div>Vs limit</div>
            </div>
            {data.topOrgs.length === 0 && <div style={{ padding: "18px 22px", fontSize: 13.5, color: "#8A93A3" }}>No AI usage this cycle.</div>}
            {data.topOrgs.map((o) => {
              const used = Number(o.ai_credits);
              const limit = o.ai_limit != null ? Number(o.ai_limit) : null;
              const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
              return (
                <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1.4fr", alignItems: "center", padding: "12px 22px", borderBottom: "1px solid #F1F4F9" }}>
                  <Link href={`/admin/orgs/${o.id}`} style={{ fontSize: 14, fontWeight: 500, color: "#0B1220", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.name}</Link>
                  <div style={{ fontSize: 13, color: "#5A6472" }}>{o.plan_name ?? "—"}</div>
                  <div className="mono" style={{ fontSize: 13.5, fontWeight: 600, textAlign: "right" }}>{used.toLocaleString()}</div>
                  <div style={{ paddingLeft: 14 }}>
                    {limit ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 7, background: "#F1F4F9", borderRadius: 6, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: pct >= 90 ? "#D64545" : pct >= 70 ? "#F0A34A" : "#2F6BFF", borderRadius: 6 }} />
                        </div>
                        <span className="mono" style={{ fontSize: 11.5, color: "#8A93A3", width: 40 }}>{Math.round(pct)}%</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "#8A93A3" }}>unlimited</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
