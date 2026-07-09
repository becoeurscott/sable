import { GRAD } from "../theme";

// Distinctive Sable brand mark: an ascending line-chart glyph in the gradient
// square — reads as "finance / growth", replacing the generic ring.
export function Mark({
  size = 30,
  radius,
  shadow = false,
  className,
}: {
  size?: number;
  radius?: number;
  shadow?: boolean;
  className?: string;
}) {
  const r = radius ?? Math.round(size * 0.3);
  const g = size / 32;
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: GRAD,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: shadow ? "0 6px 16px rgba(47,107,255,.32)" : undefined,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <polyline
          points="7,21 13,14 17,17 25,8"
          fill="none"
          stroke="#fff"
          strokeWidth={2.6 * g > 1.4 ? 2.6 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="25" cy="8" r={2.1} fill="#fff" />
      </svg>
    </div>
  );
}
