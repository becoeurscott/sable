// Skeleton shown while an app route loads (initial hard navigation into /app/*).
export default function AppLoading() {
  return (
    <div style={{ maxWidth: 1080 }}>
      <div className="r-kpi" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: "18px 20px" }}>
            <div className="sb-skeleton" style={{ width: "55%", height: 12, marginBottom: 14 }} />
            <div className="sb-skeleton" style={{ width: "70%", height: 24, marginBottom: 10 }} />
            <div className="sb-skeleton" style={{ width: "45%", height: 11 }} />
          </div>
        ))}
      </div>
      <div className="r-aside" style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 22, height: 260 }}>
          <div className="sb-skeleton" style={{ width: "40%", height: 14, marginBottom: 24 }} />
          <div className="sb-skeleton" style={{ width: "100%", height: 170 }} />
        </div>
        <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 22, height: 260 }}>
          <div className="sb-skeleton" style={{ width: "50%", height: 14, marginBottom: 18 }} />
          <div className="sb-skeleton" style={{ width: "100%", height: 120 }} />
        </div>
      </div>
      <div className="r-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 16, padding: 20, height: 200 }}>
            <div className="sb-skeleton" style={{ width: "45%", height: 14, marginBottom: 18 }} />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="sb-skeleton" style={{ width: "100%", height: 16, marginBottom: 12 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
