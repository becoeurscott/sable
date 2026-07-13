"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DISPLAY } from "../../../theme";
import { adminApi, type AdminOrgDetail, type AdminPlanRow, ApiError } from "../../../lib/api";
import { Card, StatusBadge, fmtCents, fmtDate, fmtDateTime, fmtMoney, inputStyle } from "../../ui";

const METER_LABELS: Record<string, string> = {
  ai_credits: "AI credits",
  ocr: "Receipt OCR",
  invoices: "Invoices",
  expenses: "Expenses",
  api_calls: "API calls",
  storage_mb: "Storage (MB)",
};

const SUB_STATUSES = ["trialing", "active", "past_due", "canceled", "paused"];

export default function AdminOrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AdminOrgDetail | null>(null);
  const [plans, setPlans] = useState<AdminPlanRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [planCode, setPlanCode] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await adminApi.orgDetail(id);
      setData(d);
      setPlanCode(d.subscription?.plan_code ?? "");
      setStatus(d.subscription?.status ?? "");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to load organization");
    }
  }, [id]);

  useEffect(() => {
    void load();
    adminApi.plans().then((r) => setPlans(r.plans)).catch(() => {});
  }, [load]);

  const applySubscription = async () => {
    setErr(null);
    setOk(null);
    try {
      await adminApi.setOrgSubscription(id, {
        planCode: planCode || undefined,
        status: status || undefined,
      });
      setOk("Subscription updated.");
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Update failed");
    }
  };

  if (err && !data) return <div style={{ color: "#D64545", fontSize: 14 }}>{err}</div>;
  if (!data) return <div style={{ color: "#8A93A3", fontSize: 14 }}>Loading organization…</div>;

  const { org, members, subscription, usage, counts, audit } = data;

  return (
    <div style={{ maxWidth: 1000, animation: "sbFadeUp .4s ease both" }}>
      <Link href="/admin/orgs" style={{ fontSize: 13, fontWeight: 600, color: "#2F6BFF", display: "inline-block", marginBottom: 14 }}>← All organizations</Link>

      {err && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "#FEECEC", color: "#D64545" }}>{err}</div>}
      {ok && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "#E9F7F0", color: "#0E9F6E" }}>{ok}</div>}

      {/* header */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 24, letterSpacing: "-.02em" }}>{org.name}</div>
            <div className="mono" style={{ fontSize: 12.5, color: "#8A93A3", marginTop: 3 }}>{org.slug} · {org.currency}{org.country ? ` · ${org.country}` : ""}</div>
            <div style={{ fontSize: 13.5, color: "#5A6472", marginTop: 8 }}>
              Owner: <b>{org.owner_name || org.owner_email}</b> ({org.owner_email}) · Created {fmtDate(org.created_at)}
            </div>
          </div>
          <StatusBadge status={subscription?.status ?? null} />
        </div>
      </Card>

      {/* money + volume */}
      <div className="sb-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
        {[
          ["Revenue recorded", fmtMoney(Number(counts.revenue_total))],
          ["Expenses recorded", fmtMoney(Number(counts.expense_total))],
          ["Invoices (paid $)", fmtMoney(Number(counts.invoiced_paid))],
          ["Records", `${Number(counts.invoices) + Number(counts.expenses) + Number(counts.revenues)}`],
        ].map(([label, v]) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, color: "#8A93A3", fontWeight: 600, marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20 }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="sb-split" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* subscription management */}
        <Card title="Subscription">
          <div style={{ fontSize: 13.5, color: "#5A6472", marginBottom: 14 }}>
            Current: <b>{subscription?.plan_name ?? "No plan"}</b>
            {subscription?.price_monthly != null && <> · {fmtCents(subscription.price_monthly)}/mo</>}
            {subscription?.current_period_end && <> · renews {fmtDate(subscription.current_period_end)}</>}
            {subscription?.cancel_at_period_end && <span style={{ color: "#D64545" }}> · cancels at period end</span>}
          </div>
          <div className="sb-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 6 }}>Plan</label>
              <select value={planCode} onChange={(e) => setPlanCode(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
                <option value="">(keep current)</option>
                {plans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 6 }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
                <option value="">(keep current)</option>
                {SUB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={applySubscription} style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#fff", background: "#0B1220", padding: "10px 16px", borderRadius: 9, height: 40 }}>
              Apply
            </button>
          </div>
          <div style={{ fontSize: 12, color: "#8A93A3", marginTop: 10 }}>
            Direct override — bypasses Stripe. Use it to comp a plan, pause, or fix a broken subscription.
          </div>
        </Card>

        {/* usage this cycle */}
        <Card title="Usage this cycle">
          {usage.length === 0 && <div style={{ fontSize: 13, color: "#8A93A3" }}>No usage recorded this month.</div>}
          {usage.map((u) => (
            <div key={u.metric} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F1F4F9", fontSize: 13.5 }}>
              <span>{METER_LABELS[u.metric] ?? u.metric}</span>
              <span className="mono" style={{ fontWeight: 600 }}>{Number(u.used).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13.5 }}>
            <span>Active API keys</span>
            <span className="mono" style={{ fontWeight: 600 }}>{counts.api_keys}</span>
          </div>
        </Card>
      </div>

      <div className="sb-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* members */}
        <Card title={`Members (${members.length})`}>
          {members.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F1F4F9" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.full_name || m.email}</div>
                <div style={{ fontSize: 12, color: "#8A93A3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: m.role === "owner" ? "#EEF3FF" : "#F1F4F9", color: m.role === "owner" ? "#2F6BFF" : "#5A6472" }}>{m.role}</span>
            </div>
          ))}
        </Card>

        {/* audit trail */}
        <Card title="Recent activity">
          {audit.length === 0 && <div style={{ fontSize: 13, color: "#8A93A3" }}>No audit entries.</div>}
          {audit.map((a) => (
            <div key={a.id} style={{ padding: "7px 0", borderBottom: "1px solid #F1F4F9" }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                <span className="mono" style={{ color: "#B45309" }}>{a.action}</span>
                {a.resource_type && <span style={{ color: "#8A93A3" }}> · {a.resource_type}</span>}
              </div>
              <div style={{ fontSize: 11.5, color: "#8A93A3" }}>{a.actor_email ?? "system"} · {fmtDateTime(a.created_at)}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
