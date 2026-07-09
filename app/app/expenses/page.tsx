"use client";

import { useRef, useState } from "react";
import { DISPLAY } from "../../theme";
import { catBreakdown } from "../../data";
import { useApp } from "../app-context";

function fmtSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

export default function Expenses() {
  const { expenses, ocrState, receipt, uploadReceipt, scanReceipt, confirmReceipt, dismissReceipt } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const onFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (f) uploadReceipt(f);
  };

  // Small preview of the actual uploaded file (thumbnail for images, icon for PDFs).
  const filePreview = receipt && (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #22304D" }}>
      {receipt.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={receipt.url} alt={receipt.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8, border: "1px solid #2A3A5E" }} />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: 8, background: "#1B2740", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📄</div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: "#E8EDF6", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{receipt.name}</div>
        <div style={{ fontSize: 11, color: "#71798A" }}>{fmtSize(receipt.size)}</div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, animation: "sbFadeUp .4s ease both" }}>
      <div className="r-aside" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* OCR uploader */}
        <div style={{ background: "linear-gradient(165deg,#0F1830,#0A1020)", borderRadius: 16, padding: 22, color: "#E8EDF6", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: -30, width: 150, height: 150, background: "radial-gradient(circle, rgba(47,107,255,.35), transparent 70%)" }} />
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, marginBottom: 4, position: "relative" }}>Snap a receipt</div>
          <div style={{ fontSize: 13, color: "#9AA6BC", marginBottom: 16, position: "relative" }}>Gemma reads vendor, tax and total — then files it automatically.</div>

          {ocrState === "idle" && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                onFiles(e.dataTransfer.files);
              }}
              style={{
                border: `1.5px dashed ${dragOver ? "#2F6BFF" : "#2A3A5E"}`,
                borderRadius: 12,
                padding: 26,
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "#12203C" : "#101A32",
                position: "relative",
                transition: "border-color .2s ease, background .2s ease",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  onFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#E8EDF6" }}>Drop a receipt or click to upload</div>
              <div style={{ fontSize: 12, color: "#71798A", marginTop: 4 }}>PNG, JPG or PDF · up to 10&nbsp;MB</div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  scanReceipt();
                }}
                style={{ fontSize: 12, color: "#6D9CFF", marginTop: 10, fontWeight: 600, display: "inline-block" }}
              >
                Or try the demo →
              </div>
            </div>
          )}

          {ocrState === "scanning" && (
            <div style={{ border: "1.5px solid #2A3A5E", borderRadius: 12, padding: 22, background: "#101A32", position: "relative" }}>
              {filePreview}
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 34, height: 34, margin: "0 auto 12px", border: "3px solid #2A3A5E", borderTopColor: "#2F6BFF", borderRadius: "50%", animation: "sbSpin .8s linear infinite" }} />
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#E8EDF6" }}>Reading receipt with Gemma…</div>
                <div style={{ fontSize: 12, color: "#71798A", marginTop: 4 }}>Extracting vendor, tax & total</div>
              </div>
            </div>
          )}

          {ocrState === "done" && (
            <div style={{ background: "#101A32", border: "1px solid #2A3A5E", borderRadius: 12, padding: 16, position: "relative", animation: "sbFadeUp .3s ease both" }}>
              {filePreview}
              <div style={{ fontSize: 12, color: "#5DE0A8", fontWeight: 600, marginBottom: 12 }}>✓ Extracted &amp; categorized</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontSize: 13 }}>
                <div><span style={{ color: "#71798A" }}>Vendor</span><div style={{ color: "#E8EDF6", fontWeight: 600 }}>Figma Inc.</div></div>
                <div><span style={{ color: "#71798A" }}>Category</span><div style={{ color: "#E8EDF6", fontWeight: 600 }}>Software</div></div>
                <div><span style={{ color: "#71798A" }}>Tax</span><div style={{ color: "#E8EDF6", fontWeight: 600 }}>$0.00</div></div>
                <div><span style={{ color: "#71798A" }}>Total</span><div style={{ color: "#E8EDF6", fontWeight: 600 }}>$15.00</div></div>
              </div>
              <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
                <button onClick={confirmReceipt} style={{ flex: 1, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#fff", background: "#2F6BFF", padding: 9, borderRadius: 9 }}>
                  Confirm &amp; file
                </button>
                <button onClick={dismissReceipt} style={{ border: "1px solid #2A3A5E", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#9AA6BC", background: "transparent", padding: "9px 14px", borderRadius: 9 }}>
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
        {/* category breakdown */}
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 20 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Spend by category</div>
          {catBreakdown.map((c) => (
            <div key={c.name} style={{ marginBottom: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ fontWeight: 500 }}>{c.name}</span>
                <span className="mono" style={{ color: "#5A6472" }}>{c.amt}</span>
              </div>
              <div style={{ height: 7, background: "#F1F4F9", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: c.pct, height: "100%", background: c.color, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #EEF1F7", fontFamily: DISPLAY, fontWeight: 600, fontSize: 16 }}>Recent expenses</div>
        <div className="sb-xscroll">
          <div className="sb-xscroll-inner">
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr .8fr", padding: "12px 22px", fontSize: 12, color: "#8A93A3", fontWeight: 600, borderBottom: "1px solid #EEF1F7", background: "#FBFCFE" }}>
              <div>Raw description → clean</div>
              <div>Category</div>
              <div>Date</div>
              <div style={{ textAlign: "right" }}>Amount</div>
            </div>
            {expenses.map((e, i) => (
              <div key={e.raw + i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr .8fr", alignItems: "center", padding: "13px 22px", borderBottom: "1px solid #F1F4F9" }}>
                <div>
                  <div className="mono" style={{ fontSize: 11.5, color: "#A6AFBE", textDecoration: "line-through" }}>{e.raw}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{e.vendor}</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: "#EEF3FF", color: "#2F6BFF" }}>{e.cat}</span>
                </div>
                <div style={{ fontSize: 13.5, color: "#5A6472" }}>{e.date}</div>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600, textAlign: "right" }}>−${e.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
