"use client";
import { useState } from "react";

export default function AcceptButton({ ideaId }: { ideaId: string }) {
  const [accepted, setAccepted] = useState(false);

  return accepted ? (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(114,185,122,0.15)", border: "1px solid rgba(74,158,84,0.3)", borderRadius: 13, padding: "14px 28px", marginBottom: 14 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#4A9E54" }}>✓ you're going!</span>
      </div>
      <div>
        <a href="/" style={{ display: "inline-block", background: "linear-gradient(135deg, #7B6FA8, #4A4070)", color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "2.5px", textTransform: "uppercase", borderRadius: 13, padding: "14px 28px", textDecoration: "none", boxShadow: "0 4px 20px rgba(74,64,112,0.25)" }}>
          open in roam →
        </a>
      </div>
    </div>
  ) : (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
      <button
        onClick={() => setAccepted(true)}
        style={{ display: "inline-block", background: "linear-gradient(135deg, #7B6FA8, #4A4070)", color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "2.5px", textTransform: "uppercase", borderRadius: 13, padding: "15px 32px", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(74,64,112,0.25)" }}
      >
        ✓ accept invite
      </button>
      <a href="/" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#ABA1C6", textDecoration: "none", letterSpacing: "0.5px" }}>
        view on roam →
      </a>
    </div>
  );
}
