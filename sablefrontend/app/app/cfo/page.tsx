"use client";

import { useState } from "react";
import { GRAD } from "../../theme";
import { suggestedQuestions } from "../../data";
import { md } from "../../md";
import { useApp } from "../app-context";

export default function CfoChat() {
  const { chat, thinking, askCFO } = useApp();
  const [input, setInput] = useState("");

  const send = () => {
    const q = input.trim();
    if (!q || thinking) return;
    askCFO(q);
    setInput("");
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", animation: "sbFadeUp .4s ease both" }}>
      <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column", height: "calc(100vh - 200px)", minHeight: 440 }}>
        <div className="sb-scroll" style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {chat.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "ai" ? "flex-start" : "flex-end", marginBottom: 16 }}>
              {m.role === "ai" ? (
                <div style={{ display: "flex", gap: 10, maxWidth: "82%" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: GRAD, flexShrink: 0 }} />
                  <div style={{ background: "#F4F6FA", border: "1px solid #EAEEF5", padding: "13px 16px", borderRadius: "14px 14px 14px 4px", fontSize: 14.5, lineHeight: 1.6, color: "#243049" }}>
                    {md(m.text)}
                  </div>
                </div>
              ) : (
                <div style={{ background: "#2F6BFF", color: "#fff", padding: "12px 16px", borderRadius: "14px 14px 4px 14px", fontSize: 14.5, maxWidth: "82%" }}>
                  {m.text}
                </div>
              )}
            </div>
          ))}
          {thinking && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: GRAD, flexShrink: 0 }} />
              <div style={{ background: "#F4F6FA", border: "1px solid #EAEEF5", padding: "15px 18px", borderRadius: 14, display: "flex", gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#9AA6BC", animation: "sbBlink 1s infinite" }} />
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#9AA6BC", animation: "sbBlink 1s infinite .2s" }} />
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#9AA6BC", animation: "sbBlink 1s infinite .4s" }} />
              </div>
            </div>
          )}
        </div>
        <div style={{ borderTop: "1px solid #EAEEF5", padding: "16px 18px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => askCFO(q)}
                style={{ border: "1px solid #DDE6FF", background: "#F0F4FF", color: "#1B4DE0", cursor: "pointer", fontSize: 12.5, fontWeight: 500, padding: "7px 12px", borderRadius: 100 }}
              >
                {q}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 9, alignItems: "center", background: "#F4F6FA", border: "1px solid #E4E9F2", borderRadius: 12, padding: "6px 6px 6px 15px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Ask about profit, runway, expenses…"
              style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#243049" }}
            />
            <button onClick={send} style={{ border: "none", background: "#2F6BFF", color: "#fff", width: 36, height: 36, borderRadius: 9, cursor: "pointer", fontSize: 15 }}>↑</button>
          </div>
        </div>
      </div>
    </div>
  );
}
