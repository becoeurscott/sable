import Link from "next/link";
import { DISPLAY } from "../theme";
import { Mark } from "../components/Mark";

type FooterLink = { label: string; href?: string };

export function Footer({ links }: { links: FooterLink[] }) {
  return (
    <div style={{ background: "#070B16", padding: "44px 28px", borderTop: "1px solid #16203A" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <Mark size={26} />
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 17, color: "#E8EDF6" }}>Sable</span>
          <span style={{ fontSize: 13, color: "#5B667E", marginLeft: 8 }}>© 2026 · Your AI CFO</span>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 13.5, color: "#8A93A3" }}>
          {links.map((l) =>
            l.href ? (
              <Link key={l.label} href={l.href} style={{ cursor: "pointer", color: "inherit" }}>
                {l.label}
              </Link>
            ) : (
              <span key={l.label} style={{ cursor: "pointer" }}>
                {l.label}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
