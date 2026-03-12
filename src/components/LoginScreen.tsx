"use client";

import { signIn } from "next-auth/react";

const c = {
  text:      "#1E1A2E",
  textMuted: "#A89FC0",
  logan:     "#ABA1C6",
  lavender:  "#DFDDF2",
  loganDark: "#4A4070",
};

export default function LoginScreen() {
  return (
    <div
      className="dot-grid"
      style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F3FA", padding: "24px 16px" }}
    >
      <div className="anim" style={{ width: "100%", maxWidth: 375 }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, #7B6FA8, #4A4070)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 4px 20px rgba(74,64,112,0.25)", fontSize: 24 }}>
            🧭
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 52, lineHeight: 1, color: c.text, margin: "0 0 8px" }}>
            roam
          </h1>
          <p style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 15, color: c.textMuted, margin: 0 }}>
            your personal life planner
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {["📍 places", "📅 calendar", "✨ ai magic"].map((f) => (
            <span key={f} style={{ background: c.lavender, color: c.loganDark, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.5px", borderRadius: 20, padding: "5px 12px" }}>
              {f}
            </span>
          ))}
        </div>

        {/* Auth card */}
        <div style={{ background: "rgba(255,255,255,0.96)", border: "1px solid rgba(171,161,198,0.2)", borderRadius: 20, padding: "24px 20px", boxShadow: "0 4px 24px rgba(74,64,112,0.09)" }}>
          <button
            onClick={() => signIn("google")}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", borderRadius: 13, padding: "15px 0", border: "none", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "linear-gradient(135deg, #7B6FA8, #4A4070)", color: "#fff", boxShadow: "0 4px 16px rgba(74,64,112,0.22)", transition: "opacity 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            continue with google
          </button>
        </div>

        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: c.logan, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
          by continuing you agree to our terms and privacy policy
        </p>
      </div>
    </div>
  );
}
