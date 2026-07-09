// Shared design tokens ported from the Sable prototype.

// Font-family stacks. The actual font faces are loaded in app/layout.tsx via
// next/font and exposed as CSS variables on <html>.
export const DISPLAY = "var(--font-space), 'Space Grotesk', sans-serif";
export const SANS = "var(--font-plex), 'IBM Plex Sans', system-ui, sans-serif";
export const MONO = "var(--font-mono), 'IBM Plex Mono', monospace";

// Core palette
export const C = {
  ink: "#0B1220",
  blue: "#2F6BFF",
  blueDark: "#1B4DE0",
  indigo: "#6D5EF6",
  green: "#0E9F6E",
  greenLt: "#5DE0A8",
  red: "#D64545",
  navy: "#0A1020",
  navy2: "#0F1830",
  muted: "#4A5566",
  muted2: "#5A6472",
  slate: "#8A93A3",
  line: "#EAEEF5",
} as const;

export const GRAD = "linear-gradient(135deg,#2F6BFF,#6D5EF6)";
export const GRAD_TEXT = "linear-gradient(120deg,#2F6BFF,#6D5EF6)";
