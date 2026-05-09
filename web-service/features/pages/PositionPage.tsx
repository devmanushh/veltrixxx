export default function PositionPage() {
  return (
    <section style={{ gridColumn: "span 3", minHeight: 0, border: "1px solid var(--app-border, #20242d)", borderRadius: 8, background: "var(--app-panel, #11141c)", padding: 14 }}>
      <h1 style={{ margin: 0, fontSize: 18 }}>Positions</h1>
      <p style={{ margin: "14px 0 0", color: "#71717a", fontSize: 13 }}>No open positions.</p>
    </section>
  );
}
