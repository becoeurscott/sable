"use client";

import { DISPLAY } from "../../theme";
import { useApp } from "../app-context";
import { invoicesApi } from "../../lib/api";

export default function Invoices() {
  const {
    invoices,
    showInvoiceForm,
    invClient,
    invAmount,
    invItem,
    setInvClient,
    setInvAmount,
    setInvItem,
    toggleInvoiceForm,
    createInvoice,
    refresh,
  } = useApp();

  const act = async (fn: Promise<unknown>) => {
    try {
      await fn;
      await refresh();
    } catch {/* surfaced elsewhere */}
  };

  const paid = invoices.filter((i) => i.status === "Paid").reduce((a, b) => a + b.amount, 0);
  const out = invoices.filter((i) => i.status !== "Paid").reduce((a, b) => a + b.amount, 0);
  const over = invoices.filter((i) => i.status === "Overdue").reduce((a, b) => a + b.amount, 0);
  const invStats = [
    { label: "Paid (30 days)", value: "$" + paid.toLocaleString(), color: "#0E9F6E" },
    { label: "Outstanding", value: "$" + out.toLocaleString(), color: "#0B1220" },
    { label: "Overdue", value: "$" + over.toLocaleString(), color: "#D64545" },
    { label: "Total invoices", value: String(invoices.length), color: "#0B1220" },
  ];

  const badge = (status: string) =>
    status === "Paid"
      ? { bg: "#E9F7F0", color: "#0E9F6E" }
      : status === "Overdue"
      ? { bg: "#FEECEC", color: "#D64545" }
      : { bg: "#EEF3FF", color: "#2F6BFF" };

  const inputStyle = { width: "100%", fontSize: 14, padding: "10px 12px", border: "1px solid #DCE3EE", borderRadius: 9, outline: "none" } as const;

  return (
    <div style={{ maxWidth: 1000, animation: "sbFadeUp .4s ease both" }}>
      <div className="sb-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        {invStats.map((k) => (
          <div key={k.label} style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: "#8A93A3", fontWeight: 600, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid #EEF1F7" }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16 }}>All invoices</div>
          <button onClick={toggleInvoiceForm} style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#fff", background: "#2F6BFF", padding: "9px 15px", borderRadius: 10 }}>
            + New invoice
          </button>
        </div>

        {showInvoiceForm && (
          <div style={{ padding: "20px 22px", background: "#F7F9FC", borderBottom: "1px solid #EEF1F7", animation: "sbFadeUp .3s ease both" }}>
            <div className="sb-form-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 6 }}>Client</label>
                <input value={invClient} onChange={(e) => setInvClient(e.target.value)} placeholder="Client name" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 6 }}>Amount ($)</label>
                <input value={invAmount} onChange={(e) => setInvAmount(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 6 }}>Line item</label>
                <input value={invItem} onChange={(e) => setInvItem(e.target.value)} placeholder="e.g. Design retainer" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={createInvoice} style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#fff", background: "#0B1220", padding: "10px 18px", borderRadius: 9 }}>
                Create &amp; send
              </button>
              <button onClick={toggleInvoiceForm} style={{ border: "1px solid #DCE3EE", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#5A6472", background: "#fff", padding: "10px 18px", borderRadius: 9 }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="sb-scroll-x sb-scroll">
          <div style={{ minWidth: 680 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr .9fr .9fr 1.1fr", padding: "12px 22px", fontSize: 12, color: "#8A93A3", fontWeight: 600, borderBottom: "1px solid #EEF1F7", background: "#FBFCFE" }}>
              <div>Invoice</div>
              <div>Client</div>
              <div>Due</div>
              <div style={{ textAlign: "right" }}>Amount</div>
              <div style={{ textAlign: "right" }}>Actions</div>
            </div>
            {invoices.length === 0 && (
              <div style={{ padding: "20px 22px", fontSize: 13.5, color: "#8A93A3" }}>No invoices yet. Create your first one above.</div>
            )}
            {invoices.map((r, i) => {
              const b = badge(r.status);
              const actBtn = { border: "1px solid #DCE3EE", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 8 } as const;
              return (
                <div key={r.id + i} style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr .9fr .9fr 1.1fr", alignItems: "center", padding: "14px 22px", borderBottom: "1px solid #F1F4F9" }}>
                  <div className="mono" style={{ fontSize: 13, color: "#5A6472" }}>{r.id}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{r.client}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 100, background: b.bg, color: b.color }}>{r.status}</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: "#5A6472" }}>{r.due}</div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 600, textAlign: "right" }}>${r.amount.toLocaleString()}</div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    {r.status === "Draft" && (
                      <button onClick={() => act(invoicesApi.send(r.backendId))} style={{ ...actBtn, color: "#2F6BFF", borderColor: "#DDE6FF" }}>Send</button>
                    )}
                    {r.status !== "Paid" && (
                      <button onClick={() => act(invoicesApi.markPaid(r.backendId))} style={{ ...actBtn, color: "#0E9F6E", borderColor: "#CFEBDD" }}>Mark paid</button>
                    )}
                    {r.status === "Paid" && <span style={{ fontSize: 12, color: "#8A93A3" }}>—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
