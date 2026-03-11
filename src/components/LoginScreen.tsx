"use client";

import { signIn } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

const c = {
  text:      "#1E1A2E",
  textMuted: "#A89FC0",
  logan:     "#ABA1C6",
  loganDeep: "#7B6FA8",
  loganDark: "#4A4070",
  lavender:  "#DFDDF2",
  lavDeep:   "#C9C5E8",
  pink:      "#FADCE4",
  surface:   "rgba(255,255,255,0.96)",
};

type PhoneStep = "idle" | "enter-phone" | "enter-code";

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length > 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length > 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length > 0) return `(${d}`;
  return "";
}

export default function LoginScreen() {
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("idle");
  const [phone, setPhone]         = useState("");
  const [code, setCode]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [resendSecs, setResendSecs] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  // Resend countdown
  useEffect(() => {
    if (resendSecs <= 0) return;
    const t = setTimeout(() => setResendSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSecs]);

  // Auto-focus code input
  useEffect(() => {
    if (phoneStep === "enter-code") setTimeout(() => codeRef.current?.focus(), 80);
  }, [phoneStep]);

  async function sendCode() {
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) { setError("Enter a valid 10-digit US number."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits }),
      });
      if (!res.ok) { setError("Couldn't send code. Try again."); return; }
      const data = await res.json();
      if (data.devCode) setDevCode(data.devCode);
      setPhoneStep("enter-code");
      setCode("");
      setResendSecs(30);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setError("");
    if (code.length !== 6) { setError("Enter the 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await signIn("phone-otp", {
        phone: phone.replace(/\D/g, ""),
        code,
        redirect: false,
      });
      if (res?.error || !res?.ok) setError("Incorrect or expired code. Try again.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const btnBase: React.CSSProperties = {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    letterSpacing: "2.5px",
    textTransform: "uppercase",
    borderRadius: 13,
    padding: "15px 0",
    border: "none",
    cursor: "pointer",
    width: "100%",
    transition: "opacity 0.15s",
  };

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
        {phoneStep === "idle" && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
            {["📍 places", "📅 calendar", "✨ ai magic"].map((f) => (
              <span key={f} style={{ background: c.lavender, color: c.loganDark, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.5px", borderRadius: 20, padding: "5px 12px" }}>
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Auth card */}
        <div style={{ background: c.surface, border: "1px solid rgba(171,161,198,0.2)", borderRadius: 20, padding: "24px 20px", boxShadow: "0 4px 24px rgba(74,64,112,0.09)" }}>

          {/* ── Step: idle or enter-phone (Google always visible here) ── */}
          {phoneStep !== "enter-code" && (
            <>
              {/* Google button */}
              <button
                onClick={() => signIn("google")}
                style={{ ...btnBase, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "linear-gradient(135deg, #7B6FA8, #4A4070)", color: "#fff", boxShadow: "0 4px 16px rgba(74,64,112,0.22)" }}
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

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(171,161,198,0.2)" }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: c.logan }}>or</span>
                <div style={{ flex: 1, height: 1, background: "rgba(171,161,198,0.2)" }} />
              </div>
            </>
          )}

          {/* ── Phone idle: show ghost button ── */}
          {phoneStep === "idle" && (
            <button
              onClick={() => setPhoneStep("enter-phone")}
              style={{ ...btnBase, background: "transparent", border: "1px solid rgba(171,161,198,0.3)", color: c.loganDeep }}
              onMouseEnter={(e) => { e.currentTarget.style.background = c.lavender; e.currentTarget.style.borderColor = "transparent"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(171,161,198,0.3)"; }}
            >
              continue with phone
            </button>
          )}

          {/* ── Phone step 1: enter number ── */}
          {phoneStep === "enter-phone" && (
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: c.logan, margin: "0 0 8px" }}>
                phone number
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", background: c.lavender, borderRadius: 10, padding: "0 10px", flexShrink: 0, gap: 4 }}>
                  <span style={{ fontSize: 14 }}>🇺🇸</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: c.loganDeep }}>+1</span>
                </div>
                <input
                  autoFocus
                  type="tel"
                  value={phone}
                  onChange={(e) => { setError(""); setPhone(formatPhone(e.target.value)); }}
                  onKeyDown={(e) => { if (e.key === "Enter") sendCode(); }}
                  placeholder="(555) 867-5309"
                  style={{ flex: 1, borderRadius: 10, border: "1px solid rgba(171,161,198,0.25)", background: c.surface, padding: "13px 12px", fontFamily: "'DM Mono', monospace", fontSize: 14, color: c.text, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(123,111,168,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(171,161,198,0.25)")}
                />
              </div>

              {error && <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C2617A", marginBottom: 10 }}>{error}</p>}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setPhoneStep("idle"); setPhone(""); setError(""); }}
                  style={{ flex: 1, padding: "12px 0", background: "transparent", border: "1px solid rgba(171,161,198,0.25)", borderRadius: 11, fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: c.logan, cursor: "pointer" }}
                >
                  back
                </button>
                <button
                  onClick={sendCode}
                  disabled={loading}
                  style={{ flex: 2, padding: "12px 0", background: loading ? "rgba(123,111,168,0.45)" : "linear-gradient(135deg, #7B6FA8, #4A4070)", border: "none", borderRadius: 11, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", cursor: loading ? "default" : "pointer", boxShadow: loading ? "none" : "0 3px 12px rgba(74,64,112,0.2)" }}
                >
                  {loading ? "sending..." : "send code →"}
                </button>
              </div>
            </div>
          )}

          {/* ── Phone step 2: enter OTP ── */}
          {phoneStep === "enter-code" && (
            <div>
              <button
                onClick={() => { setPhoneStep("enter-phone"); setCode(""); setError(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}
              >
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: c.loganDeep }}>←</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: c.logan }}>back</span>
              </button>

              <p style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 22, color: c.text, margin: "0 0 4px" }}>
                check your phone
              </p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: c.textMuted, margin: "0 0 18px", lineHeight: 1.5 }}>
                sent a 6-digit code to {phone}
              </p>

              {devCode && (
                <div style={{ background: "#FFFBEA", border: "1px solid #F0D97A", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "#A07A10", margin: "0 0 4px" }}>dev mode — no sms configured</p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, letterSpacing: "8px", color: "#5C4A00", margin: 0 }}>{devCode}</p>
                </div>
              )}

              <input
                ref={codeRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => { setError(""); setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); }}
                onKeyDown={(e) => { if (e.key === "Enter") verifyCode(); }}
                placeholder="• • • • • •"
                style={{ width: "100%", borderRadius: 11, border: "1px solid rgba(171,161,198,0.25)", background: "#FAFAFA", padding: "18px 14px", fontFamily: "'DM Mono', monospace", fontSize: 24, letterSpacing: "10px", color: c.text, outline: "none", boxSizing: "border-box", textAlign: "center", marginBottom: 12 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(123,111,168,0.45)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(171,161,198,0.25)")}
              />

              {error && (
                <div style={{ background: c.pink, border: "1px solid rgba(242,184,203,0.4)", borderRadius: 10, padding: "10px 12px", marginBottom: 12, fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C2617A" }}>
                  {error}
                </div>
              )}

              <button
                onClick={verifyCode}
                disabled={loading || code.length !== 6}
                style={{ ...btnBase, background: loading || code.length !== 6 ? "rgba(123,111,168,0.35)" : "linear-gradient(135deg, #7B6FA8, #4A4070)", color: "#fff", cursor: loading || code.length !== 6 ? "default" : "pointer", boxShadow: loading || code.length !== 6 ? "none" : "0 4px 16px rgba(74,64,112,0.22)", marginBottom: 14 }}
              >
                {loading ? "verifying..." : "verify →"}
              </button>

              <p style={{ textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: 10, color: c.textMuted, margin: 0 }}>
                didn't get it?{" "}
                <button
                  onClick={() => { if (resendSecs > 0) return; setCode(""); setError(""); sendCode(); }}
                  style={{ background: "none", border: "none", padding: 0, fontFamily: "'DM Mono', monospace", fontSize: 10, color: resendSecs > 0 ? c.lavDeep : c.loganDeep, cursor: resendSecs > 0 ? "default" : "pointer", textDecoration: resendSecs > 0 ? "none" : "underline", textDecorationColor: "rgba(123,111,168,0.3)" }}
                >
                  {resendSecs > 0 ? `resend in ${resendSecs}s` : "resend"}
                </button>
              </p>
            </div>
          )}
        </div>

        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: c.logan, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
          by continuing you agree to our terms and privacy policy
        </p>
      </div>
    </div>
  );
}
