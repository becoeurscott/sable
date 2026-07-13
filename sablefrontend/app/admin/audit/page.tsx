"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminAuditRow, ApiError } from "../../lib/api";
import { Card, Pager, fmtDateTime, inputStyle } from "../ui";

export default function AdminAudit() {
  const [rows, setRows] = useState<AdminAuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (a: string, p: number) => {
    setLoading(true);
    try {
      const res = await adminApi.audit({ action: a || undefined, page: p });
      setRows(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
      setErr(null);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(action, page), action ? 300 : 0);
    return () => clearTimeout(t);
  }, [action, page, load]);

  return (
    <div style={{ maxWidth: 1000, animation: "sbFadeUp .4s ease both" }}>
      {err && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "#FEECEC", color: "#D64545" }}>{err}</div>}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", padding: "16px 22px", borderBottom: "1px solid #EEF1F7" }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{total.toLocaleString()} entries</div>
          <input
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            placeholder="🔍 Filter by action (e.g. invoice.send)…"
            className="sb-tool-input"
            style={{ ...inputStyle, width: 280 }}
          />
        </div>
        <div className="sb-scroll-x sb-scroll">
          <div style={{ minWidth: 720 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.3fr 1.3fr 1fr", padding: "12px 22px", fontSize: 12, color: "#8A93A3", fontWeight: 600, borderBottom: "1px solid #EEF1F7", background: "#FBFCFE" }}>
              <div>Action</div>
              <div>Actor</div>
              <div>Organization</div>
              <div style={{ textAlign: "right" }}>When</div>
            </div>
            {loading && <div style={{ padding: "16px 22px", fontSize: 13, color: "#8A93A3" }}>Loading…</div>}
            {!loading && rows.length === 0 && <div style={{ padding: "20px 22px", fontSize: 13.5, color: "#8A93A3" }}>No audit entries match.</div>}
            {!loading && rows.map((a) => (
              <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.3fr 1.3fr 1fr", alignItems: "center", padding: "11px 22px", borderBottom: "1px solid #F1F4F9" }}>
                <div>
                  <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: "#B45309" }}>{a.action}</span>
                  {a.resource_type && <div style={{ fontSize: 11.5, color: "#8A93A3" }}>{a.resource_type}</div>}
                </div>
                <div style={{ fontSize: 13, color: "#5A6472", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.actor_email ?? "system"}</div>
                <div style={{ fontSize: 13, color: "#5A6472", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.org_name ?? "—"}</div>
                <div style={{ fontSize: 12.5, color: "#8A93A3", textAlign: "right", whiteSpace: "nowrap" }}>{fmtDateTime(a.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "0 22px 14px" }}>
          <Pager page={page} totalPages={totalPages} onPage={setPage} />
        </div>
      </Card>
    </div>
  );
}
