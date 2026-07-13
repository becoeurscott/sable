"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, type AdminOrgRow, ApiError } from "../../lib/api";
import { Card, Pager, StatusBadge, fmtDate, inputStyle } from "../ui";

export default function AdminOrgs() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminOrgRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (query: string, p: number) => {
    setLoading(true);
    try {
      const res = await adminApi.orgs({ q: query || undefined, page: p });
      setRows(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
      setErr(null);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(q, page), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, page, load]);

  return (
    <div style={{ maxWidth: 1080, animation: "sbFadeUp .4s ease both" }}>
      {err && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "#FEECEC", color: "#D64545" }}>{err}</div>}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", padding: "16px 22px", borderBottom: "1px solid #EEF1F7" }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{total.toLocaleString()} organization{total === 1 ? "" : "s"}</div>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="🔍 Search name, slug or owner…"
            className="sb-tool-input"
            style={{ ...inputStyle, width: 260 }}
          />
        </div>
        <div className="sb-scroll-x sb-scroll">
          <div style={{ minWidth: 820 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.5fr 1fr 1fr .6fr .6fr .8fr", padding: "12px 22px", fontSize: 12, color: "#8A93A3", fontWeight: 600, borderBottom: "1px solid #EEF1F7", background: "#FBFCFE" }}>
              <div>Organization</div>
              <div>Owner</div>
              <div>Plan</div>
              <div>Status</div>
              <div>Members</div>
              <div>Invoices</div>
              <div>Created</div>
            </div>
            {loading && <div style={{ padding: "16px 22px", fontSize: 13, color: "#8A93A3" }}>Loading…</div>}
            {!loading && rows.length === 0 && <div style={{ padding: "20px 22px", fontSize: 13.5, color: "#8A93A3" }}>No organizations match.</div>}
            {!loading && rows.map((o) => (
              <div
                key={o.id}
                onClick={() => router.push(`/admin/orgs/${o.id}`)}
                style={{ display: "grid", gridTemplateColumns: "1.7fr 1.5fr 1fr 1fr .6fr .6fr .8fr", alignItems: "center", padding: "12px 22px", borderBottom: "1px solid #F1F4F9", cursor: "pointer" }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.name}</div>
                  <div className="mono" style={{ fontSize: 11.5, color: "#8A93A3" }}>{o.slug}</div>
                </div>
                <div style={{ fontSize: 13, color: "#5A6472", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.owner_email}</div>
                <div style={{ fontSize: 13 }}>{o.plan_name ?? <span style={{ color: "#8A93A3" }}>none</span>}</div>
                <div><StatusBadge status={o.subscription_status} /></div>
                <div className="mono" style={{ fontSize: 13.5 }}>{o.member_count}</div>
                <div className="mono" style={{ fontSize: 13.5 }}>{o.invoice_count}</div>
                <div style={{ fontSize: 12.5, color: "#8A93A3" }}>{fmtDate(o.created_at)}</div>
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
