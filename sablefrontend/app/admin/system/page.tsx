"use client";

import { useEffect, useState } from "react";
import { adminApi, type AdminSystem, ApiError } from "../../lib/api";
import { Card, Stat } from "../ui";

function Flag({ label, on, detail }: { label: string; on: boolean; detail?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F1F4F9", fontSize: 13.5 }}>
      <span>{label}</span>
      <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: on ? "#E9F7F0" : "#F1F4F9", color: on ? "#0E9F6E" : "#8A93A3" }}>
        {detail ?? (on ? "enabled" : "off")}
      </span>
    </div>
  );
}

export default function AdminSystemPage() {
  const [data, setData] = useState<AdminSystem | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      adminApi
        .system()
        .then(setData)
        .catch((e) => setErr(e instanceof ApiError ? e.message : "Failed to load system status"));
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  if (err) return <div style={{ color: "#D64545", fontSize: 14 }}>{err}</div>;
  if (!data) return <div style={{ color: "#8A93A3", fontSize: 14 }}>Checking system…</div>;

  const up = data.runtime.uptimeSec;
  const uptime = up >= 86400 ? `${Math.floor(up / 86400)}d ${Math.floor((up % 86400) / 3600)}h` : up >= 3600 ? `${Math.floor(up / 3600)}h ${Math.floor((up % 3600) / 60)}m` : `${Math.floor(up / 60)}m`;

  return (
    <div style={{ maxWidth: 1000, animation: "sbFadeUp .4s ease both" }}>
      <div className="sb-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
        <Stat label="Status" value={data.status === "ok" ? "Healthy" : "Degraded"} sub={data.status === "ok" ? "all systems go" : "check database"} subColor={data.status === "ok" ? "#0E9F6E" : "#D64545"} />
        <Stat label="Database" value={data.db.ok ? `${data.db.latencyMs}ms` : "DOWN"} sub={data.db.ok ? "query latency" : "unreachable"} subColor={data.db.ok ? "#0E9F6E" : "#D64545"} />
        <Stat label="Uptime" value={uptime} sub={`env: ${data.runtime.env}`} />
        <Stat label="Memory" value={`${data.runtime.memoryMb} MB`} sub={`Node ${data.runtime.node}`} />
      </div>

      <div className="sb-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Integrations">
          <Flag label="Auth mode" on detail={data.integrations.authMode} />
          <Flag label="AI provider" on={data.integrations.gemma} detail={data.integrations.aiProvider ?? "heuristics only"} />
          <Flag label="Stripe billing" on={data.integrations.stripe} />
          <Flag label="Email (Resend)" on={data.integrations.email} />
          <Flag label="Master API key" on={data.integrations.masterKey} />
          <Flag label="Rate-limit store" on detail={data.integrations.rateLimitStore} />
        </Card>
        <Card title="Runtime">
          {[
            ["Node version", data.runtime.node],
            ["Environment", data.runtime.env],
            ["Host", data.runtime.host],
            ["RSS memory", `${data.runtime.memoryMb} MB`],
            ["Uptime", uptime],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F1F4F9", fontSize: 13.5 }}>
              <span style={{ color: "#5A6472" }}>{k}</span>
              <span className="mono" style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: "#8A93A3", marginTop: 12 }}>Auto-refreshes every 30 seconds.</div>
        </Card>
      </div>
    </div>
  );
}
