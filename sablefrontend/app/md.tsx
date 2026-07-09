import React from "react";

// Render **bold** markdown into React nodes (ported from the prototype's md()).
export function md(text: string): React.ReactNode[] {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <b key={i} style={{ color: "#0B1220", fontWeight: 700 }}>
        {p.slice(2, -2)}
      </b>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
}
