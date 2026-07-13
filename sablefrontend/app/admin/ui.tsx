"use client";

// Small shared building blocks for the admin pages — same visual language as
// the app (white cards on #F4F6FA), with amber as the admin accent.
import { DISPLAY } from "../theme";

export const ADMIN_ACCENT = "#F0A34A";
export const ADMIN_GRAD = "linear-gradient(135deg,#F0A34A,#D64545)";

export const cardStyle = {
  background: "#fff",
  border: "1px solid #EAEEF5",
  borderRadius: 16,
  padding: 20,
} as const;

export const inputStyle = {
  fontSize: 14,
  padding: "10px 12px",
  border: "1px solid #DCE3EE",
  borderRadius: 9,
  outline: "none",
  boxSizing: "border-box" as const,
  background: "#fff",
  color: "#0B1220",
};

export function Card({
  title,
  right,
  children,
  style,
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ ...cardStyle, ...style }}>
      {(title || right) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10 }}>
          {title && <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15 }}>{title}</div>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Stat({ label, value, sub, subColor }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 12.5, color: "#8A93A3", fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 26, letterSpacing: "-.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, fontWeight: 600, color: subColor ?? "#8A93A3", marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: "#E9F7F0", color: "#0E9F6E" },
  trialing: { bg: "#EEF3FF", color: "#2F6BFF" },
  past_due: { bg: "#FFF4E5", color: "#B45309" },
  canceled: { bg: "#FEECEC", color: "#D64545" },
  paused: { bg: "#F1F4F9", color: "#5A6472" },
};

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span style={{ fontSize: 12, color: "#8A93A3" }}>—</span>;
  const c = STATUS_COLORS[status] ?? { bg: "#F1F4F9", color: "#5A6472" };
  return (
    <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: c.bg, color: c.color, whiteSpace: "nowrap" }}>
      {status.replace("_", " ")}
    </span>
  );
}

export function Pager({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const btn = (disabled: boolean) => ({
    border: "1px solid #DCE3EE",
    background: "#fff",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.45 : 1,
    fontSize: 13,
    fontWeight: 600,
    padding: "7px 13px",
    borderRadius: 8,
    color: "#0B1220",
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0 2px", justifyContent: "flex-end" }}>
      <button style={btn(page <= 1)} disabled={page <= 1} onClick={() => onPage(page - 1)}>← Prev</button>
      <span style={{ fontSize: 13, color: "#5A6472" }}>Page {page} of {totalPages}</span>
      <button style={btn(page >= totalPages)} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  );
}

export const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();
export const fmtCents = (cents: number) => "$" + (cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
export const fmtDateTime = (d: string) => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString() + " " + dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
export const fmtDate = (d: string) => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString();
};
