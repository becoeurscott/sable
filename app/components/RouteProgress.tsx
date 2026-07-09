"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GRAD } from "../theme";

// Thin gradient bar that sweeps across the top on route changes — the small
// signal that makes navigation feel like a real app rather than static pages.
export function RouteProgress() {
  const pathname = usePathname();
  const first = useRef(true);
  const [tick, setTick] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setTick((t) => t + 1);
    setShow(true);
    const t = setTimeout(() => setShow(false), 650);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!show) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 1200, pointerEvents: "none" }}>
      <div
        key={tick}
        style={{
          height: "100%",
          background: GRAD,
          boxShadow: "0 0 10px rgba(47,107,255,.6)",
          animation: "sbRouteBar .6s cubic-bezier(.4,0,.2,1) both",
        }}
      />
    </div>
  );
}
