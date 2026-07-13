"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, type AdminOverview, ApiError } from "../lib/api";
import { Card, Stat, fmtCents, fmtDate } from "./ui";

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .overview()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load overview"));
  }, []);

  if (error) return <div style={{ color: "#D64545", fontSize: 14 }}>{error}</div>;
  if (!data) return <div style={{ color: "#8A93A3", fontSize: 14 }}>Loading platform data…</div>;

  const c = data.counts;
  const maxSignups = Math.max(1, ...data.signups.map((s) => Number(s.users)));
  const totalPlanOrgs = Math.max(1, data.plans.reduce((a, p) => a + Number(p.orgs), 0));

  return (
    <div style={{ maxWidth: 1080, animation: "sbFadeUp .4s ease both" }}>
      {/* headline stats */}
      <div className="sb-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
        <Stat label="Total users" value={Number(c.users).toLocaleString()} sub={`+${c.users_30d} in 30 days`} subColor="#0E9F6E" />
        <Stat label="Organizations" value={Number(c.orgs).toLocaleString()} sub={`${c.api_keys_active} active API keys`} />
        <Stat label="MRR" value={fmtCents(Number(c.mrr_cents))} sub={`${c.subs_active} paying subscriptions`} subColor="#0E9F6E" />
        <Stat label="AI credits (month)" value={Number(c.ai_credits_month).toLocaleString()} sub="across all tenants" />
      </div>

      {/* subscriptions strip */}
      <div className="sb-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
        <Stat label="Active subs" value={c.subs_active} subColor="#0E9F6E" sub="billing normally" />
        <Stat label="Trialing" value={c.subs_trialing} sub="not yet converted" subColor="#2F6BFF" />
        <Stat label="Past due" value={c.subs_past_due} sub="payment failing" subColor={Number(c.subs_past_due) > 0 ? "#D64545" : "#8A93A3"} />
        <Stat label="Canceled" value={c.subs_canceled} sub="churned" />
      </div>

      <div className="sb-split" style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* signup chart */}
        <Card title="Signups — last 12 months">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
            {data.signups.map((s) => (
              <div key={s.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                <div
                  title={`${s.month}: ${s.users} users, ${s.orgs} orgs`}
                  style={{ width: "100%", maxWidth: 26, background: "linear-gradient(#F0A34A,#E07B39)", borderRadius: "4px 4px 0 0", height: `${(Number(s.users) / maxSignups) * 100}%`, minHeight: Number(s.users) > 0 ? 4 : 1 }}
                />
                <span style={{ fontSize: 10, color: "#8A93A3" }}>{s.month.slice(5)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* plan distribution */}
        <Card title="Plan distribution">
          {data.plans.map((p) => (
            <div key={p.code} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ fontWeight: 500 }}>{p.name}</span>
                <span className="mono" style={{ color: "#5A6472" }}>{p.orgs}</span>
              </div>
              <div style={{ height: 7, background: "#F1F4F9", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${(Number(p.orgs) / totalPlanOrgs) * 100}%`, height: "100%", background: "#F0A34A", borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="sb-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* data volume */}
        <Card title="Data on the platform">
          {[
            ["Invoices", c.invoices],
            ["Expenses", c.expenses],
            ["Revenue records", c.revenues],
          ].map(([label, v]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F1F4F9", fontSize: 14 }}>
              <span>{label}</span>
              <span className="mono" style={{ fontWeight: 600 }}>{Number(v).toLocaleString()}</span>
            </div>
          ))}
          <Link href="/admin/usage" style={{ display: "inline-block", marginTop: 12, fontSize: 13, fontWeight: 600, color: "#2F6BFF" }}>
            View usage metering →
          </Link>
        </Card>

        {/* recent signups */}
        <Card title="Recent signups" right={<Link href="/admin/users" style={{ fontSize: 12.5, color: "#2F6BFF", fontWeight: 600 }}>All users →</Link>}>
          {data.recent.length === 0 && <div style={{ fontSize: 13, color: "#8A93A3" }}>No users yet.</div>}
          {data.recent.map((u) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #F1F4F9" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.full_name || u.email}</div>
                <div style={{ fontSize: 12, color: "#8A93A3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}{u.org_name ? ` · ${u.org_name}` : ""}</div>
              </div>
              <span style={{ fontSize: 12, color: "#8A93A3", whiteSpace: "nowrap" }}>{fmtDate(u.created_at)}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
