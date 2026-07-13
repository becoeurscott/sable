"use client";

import { useCallback, useEffect, useState } from "react";
import { DISPLAY } from "../../theme";
import { adminApi, type AdminPlanRow, ApiError } from "../../lib/api";
import { Card, fmtCents, inputStyle } from "../ui";

const QUOTA_LABELS: Record<string, string> = {
  seats: "Seats",
  invoices_mo: "Invoices / mo",
  expenses_mo: "Expenses / mo",
  ai_credits_mo: "AI credits / mo",
  ocr_mo: "OCR scans / mo",
  storage_mb: "Storage (MB)",
  api_calls_mo: "API calls / mo",
};

function PlanCard({ plan, onSaved }: { plan: AdminPlanRow; onSaved: () => void }) {
  const [monthly, setMonthly] = useState(String(plan.price_monthly / 100));
  const [annual, setAnnual] = useState(plan.price_annual != null ? String(plan.price_annual / 100) : "");
  const [quotas, setQuotas] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(plan.quotas ?? {}).map(([k, v]) => [k, v == null ? "" : String(v)])),
  );
  const [isPublic, setIsPublic] = useState(plan.is_public);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await adminApi.updatePlan(plan.id, {
        priceMonthly: Math.round(parseFloat(monthly || "0") * 100),
        priceAnnual: annual === "" ? null : Math.round(parseFloat(annual) * 100),
        quotas: Object.fromEntries(
          Object.entries(quotas).map(([k, v]) => [k, v === "" ? null : Number(v)]),
        ),
        isPublic,
      });
      setMsg({ ok: true, text: "Saved." });
      onSaved();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 17 }}>{plan.name}</div>
        <span className="mono" style={{ fontSize: 12, color: "#8A93A3" }}>{plan.code}</span>
      </div>
      <div style={{ fontSize: 12.5, color: "#8A93A3", marginBottom: 14 }}>
        {plan.active_orgs} active org{plan.active_orgs === 1 ? "" : "s"} · currently {fmtCents(plan.price_monthly)}/mo
      </div>

      <div className="sb-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 5 }}>Monthly ($)</label>
          <input value={monthly} onChange={(e) => setMonthly(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 5 }}>Annual ($/mo)</label>
          <input value={annual} onChange={(e) => setAnnual(e.target.value)} placeholder="—" style={{ ...inputStyle, width: "100%" }} />
        </div>
      </div>

      {Object.keys(quotas).length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#5A6472", marginBottom: 8 }}>Quotas (blank = unlimited)</div>
          <div className="sb-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {Object.entries(quotas).map(([k, v]) => (
              <div key={k}>
                <label style={{ fontSize: 11.5, color: "#8A93A3", display: "block", marginBottom: 3 }}>{QUOTA_LABELS[k] ?? k}</label>
                <input value={v} onChange={(e) => setQuotas((s) => ({ ...s, [k]: e.target.value }))} style={{ ...inputStyle, width: "100%", padding: "7px 10px", fontSize: 13 }} />
              </div>
            ))}
          </div>
        </>
      )}

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#5A6472", marginBottom: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        Visible on the public pricing page
      </label>

      {msg && <div style={{ fontSize: 12.5, marginBottom: 10, color: msg.ok ? "#0E9F6E" : "#D64545", fontWeight: 600 }}>{msg.text}</div>}
      <button onClick={save} disabled={busy} style={{ width: "100%", border: "none", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, fontWeight: 600, fontSize: 13.5, color: "#fff", background: "#0B1220", padding: 10, borderRadius: 9 }}>
        {busy ? "Saving…" : "Save plan"}
      </button>
    </Card>
  );
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<AdminPlanRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    adminApi
      .plans()
      .then((r) => setPlans(r.plans))
      .catch((e) => setErr(e instanceof ApiError ? e.message : "Failed to load plans"));
  }, []);

  useEffect(() => void load(), [load]);

  if (err) return <div style={{ color: "#D64545", fontSize: 14 }}>{err}</div>;
  if (plans.length === 0) return <div style={{ color: "#8A93A3", fontSize: 14 }}>Loading plans…</div>;

  return (
    <div style={{ maxWidth: 1080, animation: "sbFadeUp .4s ease both" }}>
      <div style={{ fontSize: 13, color: "#8A93A3", marginBottom: 16 }}>
        Prices are stored in cents and shown in dollars. Changes apply to the pricing page and quota
        enforcement immediately — existing Stripe subscriptions keep their Stripe price until changed there.
      </div>
      <div className="sb-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {plans.map((p) => <PlanCard key={p.id} plan={p} onSaved={load} />)}
      </div>
    </div>
  );
}
