"use client";

export interface Notification {
  id: string;
  type: "reminder" | "confirmed" | "suggestion" | "pending";
  icon: string;
  text: string;
  sub: string;
  read: boolean;
  time: string;
}

interface Props {
  notifications: Notification[];
}

const c = {
  text: "#1E1A2E",
  textMid: "#6B6480",
  textMuted: "#A89FC0",
  logan: "#ABA1C6",
  loganDeep: "#7B6FA8",
  lavender: "#DFDDF2",
  lavDeep: "#C9C5E8",
  pink: "#FADCE4",
  pinkDeep: "#F2B8CB",
  green: "#D4EDDA",
  greenDeep: "#4A9E54",
  greenDot: "#72B97A",
  surface: "rgba(255,255,255,0.96)",
};

const TYPE_CONFIG = {
  reminder: { border: "#F2B8CB", pill: { bg: "#FADCE4", color: "#C2617A", label: "reminder" } },
  confirmed: { border: "#72B97A", pill: { bg: "#D4EDDA", color: "#4A9E54", label: "confirmed" } },
  suggestion: { border: "#ABA1C6", pill: { bg: "#DFDDF2", color: "#7B6FA8", label: "suggestion" } },
  pending:    { border: "#F2B8CB", pill: { bg: "#FADCE4", color: "#C2617A", label: "pending" } },
};

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

function NotifCard({ notif }: { notif: Notification }) {
  const conf = TYPE_CONFIG[notif.type];
  return (
    <div
      style={{
        background: notif.read ? c.surface : "rgba(255,255,255,1)",
        border: "1px solid rgba(171,161,198,0.18)",
        borderRadius: 14,
        display: "flex",
        overflow: "hidden",
        boxShadow: notif.read
          ? "0 1px 6px rgba(74,64,112,0.04)"
          : "0 2px 14px rgba(74,64,112,0.08)",
      }}
    >
      {/* Colored left border */}
      <div
        style={{
          width: 3,
          flexShrink: 0,
          background: notif.read ? c.lavDeep : conf.border,
          borderRadius: "2px 0 0 2px",
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: 36,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingLeft: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: notif.read ? c.lavender : conf.border + "44",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
          }}
        >
          {notif.icon}
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1, padding: "12px 10px 12px 10px", minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: notif.read ? c.textMid : c.text,
            margin: "0 0 3px",
            lineHeight: 1.4,
          }}
        >
          {notif.text}
        </p>
        {notif.sub && (
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              color: c.textMuted,
              margin: "0 0 6px",
            }}
          >
            {notif.sub}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 8,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              background: conf.pill.bg,
              color: conf.pill.color,
              padding: "2px 7px",
              borderRadius: 20,
            }}
          >
            {conf.pill.label}
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: c.logan }}>
            {timeAgo(notif.time)}
          </span>
        </div>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <div style={{ padding: "14px 12px 0 0" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: conf.border }} />
        </div>
      )}
    </div>
  );
}

export default function InboxView({ notifications }: Props) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="anim">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontStyle: "italic",
            fontSize: 22,
            color: "#1E1A2E",
            margin: 0,
          }}
        >
          inbox
        </h2>
        {unreadCount > 0 && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              background: "#FADCE4",
              color: "#C2617A",
              padding: "4px 10px",
              borderRadius: 20,
            }}
          >
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Notifications */}
      {notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "#DFDDF2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 24,
            }}
          >
            ◎
          </div>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 18, color: "#1E1A2E", margin: "0 0 8px" }}>
            all clear
          </p>
          <p style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 13, color: "#A89FC0" }}>
            notifications will appear here
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map((notif, i) => (
            <div key={notif.id} className={`anim d${Math.min(i + 1, 6) as 1 | 2 | 3 | 4 | 5 | 6}`}>
              <NotifCard notif={notif} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
