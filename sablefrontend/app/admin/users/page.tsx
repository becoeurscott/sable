"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminUserRow, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { Card, Pager, fmtDate, inputStyle } from "../ui";

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async (query: string, p: number) => {
    setLoading(true);
    try {
      const res = await adminApi.users({ q: query || undefined, page: p });
      setRows(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(q, page), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, page, load]);

  const toggleAdmin = async (u: AdminUserRow) => {
    setMsg(null);
    try {
      await adminApi.setUserAdmin(u.id, !u.is_platform_admin);
      await load(q, page);
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Update failed");
    }
  };

  const remove = async (u: AdminUserRow) => {
    if (!window.confirm(`Permanently delete ${u.email}? This cannot be undone.`)) return;
    setMsg(null);
    try {
      await adminApi.deleteUser(u.id);
      await load(q, page);
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Delete failed");
    }
  };

  const actBtn = { border: "1px solid #DCE3EE", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 8, whiteSpace: "nowrap" as const };

  return (
    <div style={{ maxWidth: 1000, animation: "sbFadeUp .4s ease both" }}>
      {msg && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "#FEECEC", color: "#D64545" }}>{msg}</div>}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", padding: "16px 22px", borderBottom: "1px solid #EEF1F7" }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{total.toLocaleString()} user{total === 1 ? "" : "s"}</div>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="🔍 Search email or name…"
            className="sb-tool-input"
            style={{ ...inputStyle, width: 240 }}
          />
        </div>
        <div className="sb-scroll-x sb-scroll">
          <div style={{ minWidth: 680 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr .7fr .9fr 1.2fr", padding: "12px 22px", fontSize: 12, color: "#8A93A3", fontWeight: 600, borderBottom: "1px solid #EEF1F7", background: "#FBFCFE" }}>
              <div>User</div>
              <div>Joined</div>
              <div>Orgs</div>
              <div>Role</div>
              <div style={{ textAlign: "right" }}>Actions</div>
            </div>
            {loading && <div style={{ padding: "16px 22px", fontSize: 13, color: "#8A93A3" }}>Loading…</div>}
            {!loading && rows.length === 0 && <div style={{ padding: "20px 22px", fontSize: 13.5, color: "#8A93A3" }}>No users match.</div>}
            {!loading && rows.map((u) => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr .7fr .9fr 1.2fr", alignItems: "center", padding: "12px 22px", borderBottom: "1px solid #F1F4F9" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.full_name || "—"}{u.id === me?.id && <span style={{ color: "#8A93A3", fontWeight: 400 }}> (you)</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#8A93A3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                </div>
                <div style={{ fontSize: 13, color: "#5A6472" }}>{fmtDate(u.created_at)}</div>
                <div className="mono" style={{ fontSize: 13.5 }}>{u.org_count}</div>
                <div>
                  {u.is_platform_admin ? (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "#FFF4E5", color: "#B45309" }}>ADMIN</span>
                  ) : (
                    <span style={{ fontSize: 12, color: "#8A93A3" }}>member</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button onClick={() => toggleAdmin(u)} disabled={u.id === me?.id && u.is_platform_admin} style={{ ...actBtn, color: u.is_platform_admin ? "#5A6472" : "#B45309", opacity: u.id === me?.id && u.is_platform_admin ? 0.45 : 1 }}>
                    {u.is_platform_admin ? "Revoke admin" : "Make admin"}
                  </button>
                  <button onClick={() => remove(u)} disabled={u.id === me?.id} style={{ ...actBtn, color: "#D64545", borderColor: "#F3D2D2", opacity: u.id === me?.id ? 0.45 : 1 }}>
                    Delete
                  </button>
                </div>
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
