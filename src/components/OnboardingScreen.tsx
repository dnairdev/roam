"use client";

import { useState } from "react";

interface Props {
  prefillName: string;
  prefillEmail: string;
  prefillPhone?: string;
  onComplete: () => void;
}

const c = {
  text:      "#1E1A2E",
  textMid:   "#6B6480",
  textMuted: "#A89FC0",
  logan:     "#ABA1C6",
  loganDeep: "#7B6FA8",
  lavender:  "#DFDDF2",
  lavDeep:   "#C9C5E8",
  surface:   "rgba(255,255,255,0.96)",
};

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  hint,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <label
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: focused ? c.loganDeep : c.logan,
            transition: "color 0.15s",
          }}
        >
          {label}
        </label>
        {required && (
          <span style={{ color: "#F2B8CB", fontSize: 10, lineHeight: 1 }}>*</span>
        )}
        {!required && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 7,
              letterSpacing: "1px",
              color: c.lavDeep,
              textTransform: "uppercase",
            }}
          >
            optional
          </span>
        )}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          borderRadius: 11,
          border: `1px solid ${focused ? "rgba(123,111,168,0.45)" : "rgba(171,161,198,0.25)"}`,
          background: c.surface,
          padding: "13px 14px",
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
          color: c.text,
          outline: "none",
          boxSizing: "border-box",
          boxShadow: focused
            ? "0 3px 16px rgba(74,64,112,0.10)"
            : "0 1px 6px rgba(74,64,112,0.04)",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      />
      {hint && (
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            color: c.textMuted,
            marginTop: 5,
            lineHeight: 1.5,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function fmtPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  if (d.length > 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length > 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length > 0) return `(${d}`;
  return "";
}

export default function OnboardingScreen({ prefillName, prefillEmail, prefillPhone = "", onComplete }: Props) {
  const [name,  setName]  = useState(prefillName);
  const [phone, setPhone] = useState(prefillPhone ? fmtPhone(prefillPhone) : "");
  const [email, setEmail] = useState(prefillEmail);
  const phoneVerified = !!prefillPhone;
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10 && !phoneVerified) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: cleaned, onboarded: true }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onComplete();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Format phone as user types: (555) 867-5309
  function handlePhone(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    let formatted = digits;
    if (digits.length > 6)
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    else if (digits.length > 3)
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    else if (digits.length > 0)
      formatted = `(${digits}`;
    setPhone(formatted);
  }

  return (
    <div
      className="dot-grid"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F5F3FA",
        padding: "24px 16px",
      }}
    >
      <div className="anim" style={{ width: "100%", maxWidth: 400 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: "linear-gradient(135deg, #7B6FA8, #4A4070)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 4px 20px rgba(74,64,112,0.22)",
              fontSize: 22,
            }}
          >
            🧭
          </div>
          <h1
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontStyle: "italic",
              fontSize: 32,
              color: c.text,
              margin: "0 0 8px",
              lineHeight: 1.1,
            }}
          >
            one last thing
          </h1>
          <p
            style={{
              fontFamily: "'Lora', serif",
              fontStyle: "italic",
              fontSize: 14,
              color: c.textMuted,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            just a few details before we get started
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: c.surface,
            border: "1px solid rgba(171,161,198,0.2)",
            borderRadius: 20,
            padding: "28px 24px 24px",
            boxShadow: "0 4px 24px rgba(74,64,112,0.09), 0 1px 4px rgba(74,64,112,0.05)",
          }}
        >
          <Field
            label="your name"
            value={name}
            onChange={setName}
            placeholder="e.g. diya"
            required
          />

          <Field
            label="phone number"
            type="tel"
            value={phone}
            onChange={phoneVerified ? () => {} : handlePhone}
            placeholder="(555) 867-5309"
            required={!phoneVerified}
            hint={phoneVerified ? "✓ verified via sms" : "used for plan reminders — never shared"}
          />

          <Field
            label="email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="your@email.com"
            hint="pre-filled from google — change if needed"
          />

          {/* Error */}
          {error && (
            <div
              style={{
                background: "#FADCE4",
                border: "1px solid rgba(242,184,203,0.5)",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 16,
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#C2617A",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%",
              marginTop: 4,
              background: saving
                ? "rgba(123,111,168,0.5)"
                : "linear-gradient(135deg, #7B6FA8, #4A4070)",
              color: "#fff",
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              borderRadius: 13,
              padding: "16px 0",
              border: "none",
              cursor: saving ? "default" : "pointer",
              boxShadow: saving ? "none" : "0 4px 20px rgba(74,64,112,0.22)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            {saving ? "saving..." : "let's go →"}
          </button>
        </form>

        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            color: c.logan,
            textAlign: "center",
            marginTop: 16,
            letterSpacing: "0.5px",
          }}
        >
          your info is only used to personalize your experience
        </p>
      </div>
    </div>
  );
}
