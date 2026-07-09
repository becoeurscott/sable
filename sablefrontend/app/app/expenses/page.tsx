"use client";

import { useMemo, useRef, useState } from "react";
import { DISPLAY } from "../../theme";
import { useApp } from "../app-context";
import { expensesApi, aiApi, ApiError, type ReceiptData } from "../../lib/api";

const CAT_COLORS = ["#2F6BFF", "#6D5EF6", "#5A87FF", "#A6B7FF", "#0E9F6E", "#F0A34A"];

export default function Expenses() {
  const { expenses, refresh } = useApp();

  // Real receipt OCR: Tesseract extracts text in-browser → backend structures it.
  const fileRef = useRef<HTMLInputElement>(null);
  const [ocrState, setOcrState] = useState<"idle" | "scanning" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [ocrErr, setOcrErr] = useState<string | null>(null);

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setOcrErr(null);
    setOcrState("scanning");
    setProgress(0);
    try {
      const Tesseract = (await import("tesseract.js")) as unknown as {
        recognize: (
          img: File,
          lang: string,
          opts?: { logger?: (m: { status: string; progress: number }) => void },
        ) => Promise<{ data: { text: string } }>;
      };
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
        },
      });
      const { receipt } = await aiApi.parseReceipt(data.text || "(no text found)");
      setReceipt(receipt);
      setOcrState("done");
    } catch (e) {
      setOcrErr(e instanceof ApiError ? e.message : "Couldn't read that image. Try a clearer photo.");
      setOcrState("idle");
    }
  };

  const confirmReceipt = async () => {
    if (!receipt) return;
    try {
      await expensesApi.create({
        amount: receipt.total ?? receipt.subtotal ?? 0,
        vendor: receipt.vendor ?? undefined,
        rawDescription: receipt.vendor ?? undefined,
        expenseDate: receipt.date ?? undefined,
        // category left blank → backend auto-categorizes
      });
      setReceipt(null);
      setOcrState("idle");
      await refresh();
    } catch (e) {
      setOcrErr(e instanceof ApiError ? e.message : "Could not file expense");
    }
  };
  const dismissReceipt = () => { setReceipt(null); setOcrState("idle"); };

  // Filters (client-side over the loaded set).
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");

  // Manual add-expense drawer.
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(expenses.map((e) => e.cat))).sort(),
    [expenses],
  );

  const filtered = expenses.filter(
    (e) =>
      (!cat || e.cat === cat) &&
      (!q || e.vendor.toLowerCase().includes(q.toLowerCase()) || e.raw.toLowerCase().includes(q.toLowerCase())),
  );

  // Live category breakdown from the loaded expenses.
  const breakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of expenses) totals[e.cat] = (totals[e.cat] ?? 0) + e.amount;
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = entries[0]?.[1] ?? 1;
    return entries.map(([name, amt], i) => ({ name, amt, pct: (amt / max) * 100, color: CAT_COLORS[i % CAT_COLORS.length] }));
  }, [expenses]);

  const addExpense = async () => {
    const amt = parseFloat(amount);
    if (!amt) return;
    try {
      await expensesApi.create({
        amount: amt,
        vendor: vendor || undefined,
        rawDescription: vendor || undefined,
        category: category || undefined, // empty → backend auto-categorizes
      });
      setShowAdd(false);
      setAmount("");
      setVendor("");
      setCategory("");
      await refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not add expense");
    }
  };

  const inputStyle = { width: "100%", fontSize: 14, padding: "10px 12px", border: "1px solid #DCE3EE", borderRadius: 9, outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ maxWidth: 1000, animation: "sbFadeUp .4s ease both" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* OCR uploader */}
        <div style={{ background: "linear-gradient(165deg,#0F1830,#0A1020)", borderRadius: 16, padding: 22, color: "#E8EDF6", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: -30, width: 150, height: 150, background: "radial-gradient(circle, rgba(47,107,255,.35), transparent 70%)" }} />
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, marginBottom: 4, position: "relative" }}>Snap a receipt</div>
          <div style={{ fontSize: 13, color: "#9AA6BC", marginBottom: 16, position: "relative" }}>Gemma reads vendor, tax and total — then files it automatically.</div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />
          {ocrState === "idle" && (
            <div onClick={() => fileRef.current?.click()} style={{ border: "1.5px dashed #2A3A5E", borderRadius: 12, padding: 26, textAlign: "center", cursor: "pointer", background: "#101A32", position: "relative" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#E8EDF6" }}>Upload a receipt photo to scan</div>
              <div style={{ fontSize: 12, color: "#71798A", marginTop: 4 }}>JPG / PNG — read on-device, then structured by AI</div>
              {ocrErr && <div style={{ fontSize: 12, color: "#FF7A7A", marginTop: 8 }}>{ocrErr}</div>}
            </div>
          )}
          {ocrState === "scanning" && (
            <div style={{ border: "1.5px solid #2A3A5E", borderRadius: 12, padding: 26, textAlign: "center", background: "#101A32", position: "relative" }}>
              <div style={{ width: 34, height: 34, margin: "0 auto 12px", border: "3px solid #2A3A5E", borderTopColor: "#2F6BFF", borderRadius: "50%", animation: "sbSpin .8s linear infinite" }} />
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#E8EDF6" }}>Reading receipt{progress ? ` — ${progress}%` : "…"}</div>
              <div style={{ fontSize: 12, color: "#71798A", marginTop: 4 }}>Extracting text, then vendor / tax / total</div>
            </div>
          )}
          {ocrState === "done" && receipt && (
            <div style={{ background: "#101A32", border: "1px solid #2A3A5E", borderRadius: 12, padding: 16, position: "relative", animation: "sbFadeUp .3s ease both" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#5DE0A8", fontWeight: 600 }}>✓ Extracted — review &amp; confirm</div>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: "#9AA6BC", background: "#1D2A47", padding: "3px 8px", borderRadius: 100 }}>{receipt.source === "gemma" ? "Gemma" : "on-device"}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontSize: 13 }}>
                <div><span style={{ color: "#71798A" }}>Vendor</span><div style={{ color: "#E8EDF6", fontWeight: 600 }}>{receipt.vendor || "—"}</div></div>
                <div><span style={{ color: "#71798A" }}>Type</span><div style={{ color: "#E8EDF6", fontWeight: 600 }}>{receipt.receiptType}</div></div>
                <div><span style={{ color: "#71798A" }}>Tax</span><div style={{ color: "#E8EDF6", fontWeight: 600 }}>{receipt.currency} {(receipt.taxAmount ?? 0).toFixed(2)}</div></div>
                <div><span style={{ color: "#71798A" }}>Total</span><div style={{ color: "#E8EDF6", fontWeight: 600 }}>{receipt.currency} {(receipt.total ?? 0).toFixed(2)}</div></div>
                {receipt.date && <div><span style={{ color: "#71798A" }}>Date</span><div style={{ color: "#E8EDF6", fontWeight: 600 }}>{receipt.date}</div></div>}
              </div>
              {ocrErr && <div style={{ fontSize: 12, color: "#FF7A7A", marginTop: 10 }}>{ocrErr}</div>}
              <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
                <button onClick={confirmReceipt} style={{ flex: 1, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#fff", background: "#2F6BFF", padding: 9, borderRadius: 9 }}>Confirm &amp; file</button>
                <button onClick={dismissReceipt} style={{ border: "1px solid #2A3A5E", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#9AA6BC", background: "transparent", padding: "9px 14px", borderRadius: 9 }}>Discard</button>
              </div>
            </div>
          )}
        </div>

        {/* live category breakdown */}
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 20 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Spend by category</div>
          {breakdown.length === 0 && <div style={{ fontSize: 13, color: "#8A93A3" }}>No expenses yet.</div>}
          {breakdown.map((c) => (
            <div key={c.name} style={{ marginBottom: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ fontWeight: 500 }}>{c.name}</span>
                <span className="mono" style={{ color: "#5A6472" }}>${Math.round(c.amt).toLocaleString()}</span>
              </div>
              <div style={{ height: 7, background: "#F1F4F9", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${c.pct}%`, height: "100%", background: c.color, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, overflow: "hidden" }}>
        {/* toolbar: filters + add */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "16px 22px", borderBottom: "1px solid #EEF1F7" }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, marginRight: "auto" }}>Recent expenses</div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Search vendor…" style={{ ...inputStyle, width: 200 }} />
          <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ ...inputStyle, width: 170 }}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setShowAdd((s) => !s)} style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#fff", background: "#2F6BFF", padding: "10px 15px", borderRadius: 9 }}>+ Add expense</button>
        </div>

        {showAdd && (
          <div style={{ padding: "18px 22px", background: "#F7F9FC", borderBottom: "1px solid #EEF1F7", animation: "sbFadeUp .3s ease both" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1.2fr auto", gap: 12, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 6 }}>Amount ($)</label>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 6 }}>Vendor / description</label>
                <input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. ADOBE *SYSTEMS" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A6472", display: "block", marginBottom: 6 }}>Category (blank = AI)</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Auto-categorize" style={inputStyle} />
              </div>
              <button onClick={addExpense} style={{ border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "#fff", background: "#0B1220", padding: "10px 16px", borderRadius: 9, height: 40 }}>Add</button>
            </div>
            {err && <div style={{ color: "#D64545", fontSize: 13, marginTop: 8 }}>{err}</div>}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr .8fr", padding: "12px 22px", fontSize: 12, color: "#8A93A3", fontWeight: 600, borderBottom: "1px solid #EEF1F7", background: "#FBFCFE" }}>
          <div>Raw description → clean</div>
          <div>Category</div>
          <div>Date</div>
          <div style={{ textAlign: "right" }}>Amount</div>
        </div>
        {filtered.length === 0 && <div style={{ padding: "20px 22px", fontSize: 13.5, color: "#8A93A3" }}>No expenses match. Add one above or snap a receipt.</div>}
        {filtered.map((e) => (
          <div key={e.backendId} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr .8fr", alignItems: "center", padding: "13px 22px", borderBottom: "1px solid #F1F4F9" }}>
            <div>
              <div className="mono" style={{ fontSize: 11.5, color: "#A6AFBE", textDecoration: "line-through" }}>{e.raw}</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{e.vendor}</div>
            </div>
            <div><span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: "#EEF3FF", color: "#2F6BFF" }}>{e.cat}</span></div>
            <div style={{ fontSize: 13.5, color: "#5A6472" }}>{e.date}</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 600, textAlign: "right" }}>−${e.amount.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
