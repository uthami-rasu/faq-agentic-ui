"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body style={{ margin: 0 }}><main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f8f9fc", color: "#202124", fontFamily: "Inter, Arial, sans-serif" }}>
    <section style={{ width: "min(520px, 100%)", textAlign: "center" }}>
      <div aria-hidden="true" style={{ marginBottom: 22, fontSize: 82, fontWeight: 800, letterSpacing: -8 }}><span style={{ color: "#8b7cf8" }}>5</span><span style={{ color: "#6c5ce7" }}>0</span><span style={{ color: "#5546d4" }}>0</span></div>
      <h1 style={{ margin: "0 0 10px", fontSize: 30, letterSpacing: -0.7 }}>Something went off script</h1>
      <p style={{ margin: "0 auto", maxWidth: 440, color: "#5f6368", fontSize: 15, lineHeight: 1.65 }}>QueryDesk couldn’t finish loading, but a fresh attempt usually gets everything moving again.</p>
      <button onClick={reset} style={{ marginTop: 25, padding: "11px 22px", border: 0, borderRadius: 8, color: "white", background: "#6c5ce7", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 5px 15px rgba(108,92,231,.22)" }}>Reload QueryDesk</button>
    </section>
  </main></body></html>;
}
