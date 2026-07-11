"use client";

import { useEffect, useState, useCallback } from "react";
import { DISPLAY } from "../../theme";
import { orgApi, apiKeysApi, ApiError, type MemberRow, type ApiKeyView } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

const ROLES = ["admin", "accountant", "manager", "employee"] as const;

export default function Settings() {
  const { org, user } = useAuth();
  const orgId = org?.id;

  const [name, setName] = useState(org?.name ?? "");
  const [currency, setCurrency] = useState(org?.currency ?? "USD");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<(typeof ROLES)[number]>("employee");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // API keys
  const [keys, setKeys] = useState<ApiKeyView[]>([]);
  const [keyName, setKeyName] = useState("");
  const [keyRole, setKeyRole] = useState<(typeof ROLES)[number]>("accountant");
  const [keyReadOnly, setKeyReadOnly] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!orgId) return;
    try {
      const { members } = await orgApi.members(orgId);
      setMembers(members);
    } catch {/* ignore */}
  }, [orgId]);

  const loadKeys = useCallback(async () => {
    if (!orgId) return;
    try {
      const { apiKeys } = await apiKeysApi.list(orgId);
      setKeys(apiKeys);
    } catch {/* ignore */}
  }, [orgId]);

  useEffect(() => {
    void loadMembers();
    void loadKeys();
  }, [loadMembers, loadKeys]);

  const createKey = async () => {
    if (!orgId || !keyName) return;
    try {
      const { key } = await apiKeysApi.create(orgId, { name: keyName, role: keyRole, readOnly: keyReadOnly });
      setNewKey(key);
      setKeyName("");
      await loadKeys();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof ApiError ? err.message : "Could not create key" });
    }
  };

  const revokeKey = async (id: string) => {
    if (!orgId) return;
    try {
      await apiKeysApi.revoke(orgId, id);
      await loadKeys();
    } catch {/* ignore */}
  };

  const saveOrg = async () => {
    if (!orgId) return;
    try {
      await orgApi.update(orgId, { name, currency });
      setMsg({ kind: "ok", text: "Organization saved." });
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof ApiError ? err.message : "Save failed" });
    }
  };

  const invite = async () => {
    if (!orgId || !inviteEmail) return;
    try {
      await orgApi.invite(orgId, inviteEmail, inviteRole);
      setInviteEmail("");
      setMsg({ kind: "ok", text: `Invited ${inviteEmail} as ${inviteRole}.` });
      await loadMembers();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof ApiError ? err.message : "Invite failed" });
    }
  };

  const remove = async (m: MemberRow) => {
    if (!orgId) return;
    try {
      await orgApi.removeMember(orgId, m.user_id);
      await loadMembers();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof ApiError ? err.message : "Remove failed" });
    }
  };

  const card = { background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 22, marginBottom: 16 } as const;
  const label = { fontSize: 12, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 6 } as const;
  const input = { width: "100%", fontSize: 14, padding: "10px 12px", border: "1px solid #DCE3EE", borderRadius: 9, outline: "none", boxSizing: "border-box" as const };
  const roleBadge = (r: string) => ({ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: r === "owner" ? "#EEF3FF" : "#F1F4F9", color: r === "owner" ? "#2F6BFF" : "#5A6472" });

  return (
    <div style={{ maxWidth: 820, animation: "sbFadeUp .4s ease both" }}>
      {msg && (
        <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontSize: 13, background: msg.kind === "ok" ? "#E9F7F0" : "#FEECEC", color: msg.kind === "ok" ? "#0E9F6E" : "#D64545" }}>
          {msg.text}
        </div>
      )}

      {/* Organization */}
      <div style={card}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Organization</div>
        <div className="sb-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={label}>Company name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={input} />
          </div>
          <div>
            <label style={label}>Base currency</label>
            <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} style={input} />
          </div>
        </div>
        <button onClick={saveOrg} style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#fff", background: "#2F6BFF", padding: "10px 18px", borderRadius: 9 }}>Save changes</button>
      </div>

      {/* Team */}
      <div style={card}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Team members</div>
        <div style={{ fontSize: 13, color: "#8A93A3", marginBottom: 16 }}>Role-based access — owner &gt; admin &gt; accountant &gt; manager &gt; employee.</div>

        {members.map((m) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F1F4F9" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{m.full_name || m.email}{m.user_id === user?.id && <span style={{ color: "#8A93A3", fontWeight: 400 }}> (you)</span>}</div>
              <div style={{ fontSize: 12, color: "#8A93A3" }}>{m.email}</div>
            </div>
            <span style={roleBadge(m.role)}>{m.role}</span>
            {m.role !== "owner" && m.user_id !== user?.id && (
              <button onClick={() => remove(m)} style={{ border: "1px solid #F3D2D2", background: "#fff", color: "#D64545", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "6px 10px", borderRadius: 8 }}>Remove</button>
            )}
          </div>
        ))}

        <div className="sb-form-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr auto", gap: 10, marginTop: 16, alignItems: "end" }}>
          <div>
            <label style={label}>Invite by email</label>
            <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@company.com" style={input} />
          </div>
          <div>
            <label style={label}>Role</label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as (typeof ROLES)[number])} style={input}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={invite} style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#fff", background: "#0B1220", padding: "10px 16px", borderRadius: 9, height: 40 }}>Invite</button>
        </div>
        <div style={{ fontSize: 12, color: "#8A93A3", marginTop: 8 }}>The person must already have a Sable account to be invited.</div>
      </div>

      {/* API keys */}
      <div style={card}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>API keys</div>
        <div style={{ fontSize: 13, color: "#8A93A3", marginBottom: 16 }}>
          Programmatic access for scripts &amp; external apps. Send as <code style={{ background: "#F1F4F9", padding: "1px 5px", borderRadius: 5 }}>X-API-Key</code> or <code style={{ background: "#F1F4F9", padding: "1px 5px", borderRadius: 5 }}>Authorization: Bearer</code>. No org header needed — the key is bound to this org.
        </div>

        {newKey && (
          <div style={{ background: "#0F1830", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#5DE0A8", fontWeight: 600, marginBottom: 8 }}>✓ Key created — copy it now, it won't be shown again</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <code className="mono" style={{ flex: 1, color: "#E8EDF6", fontSize: 13, wordBreak: "break-all" }}>{newKey}</code>
              <button onClick={() => navigator.clipboard?.writeText(newKey)} style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, color: "#fff", background: "#2F6BFF", padding: "7px 12px", borderRadius: 8 }}>Copy</button>
              <button onClick={() => setNewKey(null)} style={{ border: "1px solid #2A3A5E", cursor: "pointer", fontSize: 12, color: "#9AA6BC", background: "transparent", padding: "7px 10px", borderRadius: 8 }}>Done</button>
            </div>
          </div>
        )}

        {keys.filter((k) => !k.revokedAt).map((k) => (
          <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F1F4F9" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{k.name} {k.readOnly && <span style={{ fontSize: 11, color: "#8A93A3" }}>· read-only</span>}</div>
              <div className="mono" style={{ fontSize: 12, color: "#8A93A3" }}>{k.prefix}…  ·  {k.role}  ·  {k.lastUsedAt ? `used ${new Date(k.lastUsedAt).toLocaleDateString()}` : "never used"}</div>
            </div>
            <button onClick={() => revokeKey(k.id)} style={{ border: "1px solid #F3D2D2", background: "#fff", color: "#D64545", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "6px 10px", borderRadius: 8 }}>Revoke</button>
          </div>
        ))}
        {keys.filter((k) => !k.revokedAt).length === 0 && <div style={{ fontSize: 13, color: "#8A93A3", padding: "4px 0 12px" }}>No active keys.</div>}

        <div className="sb-form-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr auto auto", gap: 10, marginTop: 14, alignItems: "end" }}>
          <div>
            <label style={label}>New key name</label>
            <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="e.g. Zapier integration" style={input} />
          </div>
          <div>
            <label style={label}>Role</label>
            <select value={keyRole} onChange={(e) => setKeyRole(e.target.value as (typeof ROLES)[number])} style={input}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5A6472", height: 40, whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={keyReadOnly} onChange={(e) => setKeyReadOnly(e.target.checked)} /> read-only
          </label>
          <button onClick={createKey} style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#fff", background: "#0B1220", padding: "10px 16px", borderRadius: 9, height: 40 }}>Create</button>
        </div>
      </div>

      {/* Integrations + Security (roadmap-gated) */}
      <div className="sb-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Integrations</div>
          {[["Stripe billing", "Connected"], ["Plaid bank sync", "Coming soon"], ["Resend email", "Coming soon"]].map(([n, s]) => (
            <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #F1F4F9", fontSize: 13.5 }}>
              <span>{n}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: s === "Connected" ? "#0E9F6E" : "#8A93A3" }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Security</div>
          <div style={{ fontSize: 13.5, color: "#5A6472", lineHeight: 1.6 }}>
            Your data is isolated per organization with row-level security, encrypted in transit and at rest. JWT sessions expire hourly and refresh automatically.
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 13.5 }}>
            <span>Two-factor auth (2FA)</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "#8A93A3" }}>Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
