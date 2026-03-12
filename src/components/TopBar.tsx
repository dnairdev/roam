"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

interface Props {
  userName?: string | null;
  userImage?: string | null;
  notificationCount?: number;
  onNotificationClick?: () => void;
}

export default function TopBar({ userName, userImage, notificationCount = 0, onNotificationClick }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const now = new Date();
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const dateStr = `${days[now.getDay()]} · ${months[now.getMonth()]} ${String(now.getDate()).padStart(2, "0")}`;

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <header
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(171,161,198,0.15)",
        background: "rgba(245,243,250,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "0 16px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 80 }}>
        <span
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontStyle: "italic",
            fontSize: 30,
            lineHeight: 1,
            color: "#1E1A2E",
          }}
        >
          roam
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            background: "#DFDDF2",
            color: "#7B6FA8",
            padding: "3px 6px",
            borderRadius: 20,
          }}
        >
          beta
        </span>
      </div>

      {/* Center: Date */}
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
          color: "#ABA1C6",
          letterSpacing: "0.5px",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        {dateStr}
      </span>

      {/* Right: Bell + Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 80, justifyContent: "flex-end" }}>
        {/* Notification bell */}
        <button
          onClick={onNotificationClick}
          style={{
            position: "relative",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: notificationCount > 0 ? "#7B6FA8" : "#ABA1C6",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}>
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
          </svg>
          {notificationCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 1,
                right: 1,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#F2B8CB",
                border: "1.5px solid rgba(245,243,250,0.9)",
              }}
            />
          )}
        </button>

        {/* Avatar / menu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {userImage ? (
              <img
                src={userImage}
                alt=""
                style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #DFDDF2" }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7B6FA8, #4A4070)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: "#fff",
                }}
              >
                {initials}
              </div>
            )}
          </button>

          {menuOpen && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(false)} />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: 8,
                  zIndex: 20,
                  width: 160,
                  background: "rgba(255,255,255,0.96)",
                  border: "1px solid rgba(171,161,198,0.2)",
                  borderRadius: 14,
                  boxShadow: "0 8px 30px rgba(74,64,112,0.12)",
                  overflow: "hidden",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid rgba(171,161,198,0.1)" }}>
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      color: "#1E1A2E",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      margin: 0,
                    }}
                  >
                    {userName}
                  </p>
                </div>
                <button
                  onClick={() => signOut()}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: "#A89FC0",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#1E1A2E";
                    e.currentTarget.style.background = "rgba(171,161,198,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#A89FC0";
                    e.currentTarget.style.background = "none";
                  }}
                >
                  sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
