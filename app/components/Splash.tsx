"use client";

import { useEffect, useState } from "react";
import { DISPLAY, GRAD } from "../theme";
import { Mark } from "./Mark";

// Branded loading splash shown once on the initial full-page load, then fades
// out. Lives in the root layout, so client-side navigations don't re-trigger it.
export function Splash() {
  const [gone, setGone] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 750);
    const t2 = setTimeout(() => setGone(true), 1250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#0A1020",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        opacity: fading ? 0 : 1,
        transition: "opacity .5s ease",
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 13, animation: "sbSplashPulse 1.4s ease infinite" }}>
        <Mark size={42} shadow />
        <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 30, letterSpacing: "-.02em", color: "#F3F6FC" }}>
          Sable
        </span>
      </div>
      <div style={{ width: 168, height: 4, borderRadius: 4, background: "#1D2A47", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: "100%",
            background: GRAD,
            transformOrigin: "left",
            animation: "sbTrackFill 1s cubic-bezier(.5,.05,.2,1) both",
          }}
        />
      </div>
      <div style={{ fontSize: 12.5, color: "#71798A", letterSpacing: ".04em" }}>Warming up your AI CFO…</div>
    </div>
  );
}
