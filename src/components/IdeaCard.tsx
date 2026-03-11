"use client";

import { useState } from "react";
import { formatDuration } from "@/lib/duration";

interface Idea {
  id: string;
  title: string;
  notes: string;
  placeName: string;
  placeAddress: string;
  estimatedMinutes: number;
  suggestedTime: string;
  suggestedTimes: string;
  category: string;
  planType: string;
  savedLink: string;
  covers: number;
  calendarEventId: string;
  invitees: string;
  taskNotes: string;
}

interface Props {
  idea: Idea;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Idea>) => void;
  enriching?: boolean;
}

const c = {
  text:       "#1E1A2E",
  textMid:    "#6B6480",
  textMuted:  "#A89FC0",
  logan:      "#ABA1C6",
  loganDeep:  "#7B6FA8",
  loganDark:  "#4A4070",
  lavender:   "#DFDDF2",
  lavDeep:    "#C9C5E8",
  green:      "#D4EDDA",
  greenDeep:  "#4A9E54",
  greenDot:   "#72B97A",
  surface:    "rgba(255,255,255,0.96)",
};

function getDateParts(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return {
      day:   d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      time:  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
  } catch {
    return null;
  }
}

function formatSlotLabel(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const dayStr = isToday
      ? "Today"
      : isTomorrow
      ? "Tomorrow"
      : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${dayStr} · ${timeStr}`;
  } catch {
    return "";
  }
}

export default function IdeaCard({ idea, onDelete, onUpdate, enriching }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [calendarLink, setCalendarLink] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const mapsQuery = encodeURIComponent(idea.placeName || idea.title);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const isScheduled = !!(idea.calendarEventId || calendarLink);
  const dateParts = idea.suggestedTime ? getDateParts(idea.suggestedTime) : null;

  const accentColor = isScheduled ? c.greenDot : idea.suggestedTime ? c.loganDeep : c.lavDeep;

  let alternativeSlots: { start: string; label: string; yelpAvailable?: boolean; yelpUrl?: string }[] = [];
  try {
    const parsed = JSON.parse(idea.suggestedTimes || "[]");
    alternativeSlots = parsed
      .slice(0, 5)
      .map((s: { start: string; yelpAvailable?: boolean; yelpUrl?: string }) => ({
        start: s.start,
        label: formatSlotLabel(s.start),
        yelpAvailable: s.yelpAvailable,
        yelpUrl: s.yelpUrl,
      }))
      .filter((s: { label: string }) => s.label);
  } catch {
    alternativeSlots = [];
  }

  const hasYelpData = alternativeSlots.some((s) => s.yelpAvailable);
  const covers = idea.covers ?? 2;

  function copyShareLink() {
    const url = `${window.location.origin}/share/${idea.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  async function addToCalendar() {
    if (!idea.suggestedTime || scheduling) return;
    setScheduling(true);
    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId: idea.id,
          title: idea.title,
          startTime: idea.suggestedTime,
          durationMinutes: idea.estimatedMinutes,
          location: idea.placeAddress || idea.placeName,
          notes: idea.notes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarLink(data.eventLink || null);
        onUpdate(idea.id, { calendarEventId: data.eventId });
      }
    } catch {
      /* silent */
    } finally {
      setScheduling(false);
    }
  }

  return (
    <div
      style={{
        background: c.surface,
        border: "1px solid rgba(171,161,198,0.2)",
        borderRadius: 16,
        boxShadow: expanded
          ? "0 4px 28px rgba(74,64,112,0.11), 0 1px 4px rgba(74,64,112,0.06)"
          : "0 2px 18px rgba(74,64,112,0.07), 0 1px 3px rgba(74,64,112,0.04)",
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        position: "relative",
      }}
    >
      {/* Card header row */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            padding: 0,
            display: "flex",
          }}
        >
          {/* Date box */}
          <div
            style={{
              width: 56,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 0",
            }}
          >
            {dateParts ? (
              <>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 26,
                    fontWeight: 500,
                    lineHeight: 1,
                    color: c.loganDark,
                  }}
                >
                  {dateParts.day}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 8,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: c.logan,
                    marginTop: 3,
                  }}
                >
                  {dateParts.month}
                </span>
              </>
            ) : (
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 20,
                  color: c.lavDeep,
                  lineHeight: 1,
                }}
              >
                —
              </span>
            )}
          </div>

          {/* Accent strip */}
          <div
            style={{
              width: 3,
              flexShrink: 0,
              alignSelf: "stretch",
              background: accentColor,
              borderRadius: 2,
              margin: "10px 10px 10px 4px",
              transition: "background 0.3s",
            }}
          />

          {/* Content */}
          <div style={{ flex: 1, padding: "14px 40px 14px 0", minWidth: 0 }}>
            {/* Title */}
            <p
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 17,
                color: c.text,
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              {idea.title || "Untitled"}
            </p>

            {enriching ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <svg
                  className="animate-spin"
                  style={{ width: 11, height: 11, color: c.loganDeep }}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: c.textMuted,
                  }}
                >
                  finding place & time...
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 5,
                  flexWrap: "wrap",
                }}
              >
                {idea.placeName && (
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      color: c.textMid,
                    }}
                  >
                    📍 {idea.placeName}
                  </span>
                )}
                {idea.placeName && idea.estimatedMinutes && (
                  <span style={{ color: c.lavDeep, fontSize: 10 }}>·</span>
                )}
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: c.textMuted,
                  }}
                >
                  ~{formatDuration(idea.estimatedMinutes)}
                </span>
                {isScheduled && (
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 8,
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      background: c.green,
                      color: c.greenDeep,
                      padding: "3px 8px",
                      borderRadius: 20,
                      border: `1px solid rgba(74,158,84,0.2)`,
                    }}
                  >
                    ✓ scheduled
                  </span>
                )}
              </div>
            )}
          </div>
        </button>

        {/* Delete button */}
        {!confirmDelete ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(true);
            }}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
              color: c.lavDeep,
              opacity: 0,
              transition: "opacity 0.15s, color 0.15s",
            }}
            className="group-hover-delete"
            aria-label="Delete"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#E57373";
              e.currentTarget.style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = c.lavDeep;
            }}
            onFocus={(e) => (e.currentTarget.style.opacity = "1")}
            onBlur={(e) => (e.currentTarget.style.opacity = "0")}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 15, height: 15 }}>
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#fff",
              border: "1px solid rgba(229,115,115,0.25)",
              borderRadius: 10,
              padding: "6px 10px",
              boxShadow: "0 2px 12px rgba(229,115,115,0.12)",
            }}
          >
            <span
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#E57373", letterSpacing: "0.5px" }}
            >
              delete?
            </span>
            <button
              onClick={() => onDelete(idea.id)}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                fontWeight: 700,
                color: "#D32F2F",
                background: "none",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
            >
              yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                color: c.textMuted,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              no
            </button>
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid rgba(171,161,198,0.12)",
            padding: "16px 20px 18px",
          }}
        >
          {/* Location */}
          {(idea.placeName || idea.placeAddress) && (
            <div style={{ marginBottom: 14 }}>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 8,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: c.logan,
                  margin: "0 0 6px",
                }}
              >
                Location
              </p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: c.loganDeep,
                  textDecoration: "none",
                }}
              >
                <span>📍</span>
                <span style={{ textDecoration: "underline", textDecorationColor: "rgba(123,111,168,0.3)" }}>
                  {idea.placeName || idea.placeAddress}
                </span>
                {idea.placeName && idea.placeAddress && (
                  <span style={{ color: c.textMuted, textDecoration: "none" }}>{idea.placeAddress}</span>
                )}
                <span style={{ color: c.logan }}>↗</span>
              </a>
            </div>
          )}

          {/* Duration */}
          <div style={{ marginBottom: 14 }}>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 8,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: c.logan,
                margin: "0 0 6px",
              }}
            >
              Duration
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[30, 60, 90, 120, 150, 180].map((m) => (
                <button
                  key={m}
                  onClick={() => onUpdate(idea.id, { estimatedMinutes: m })}
                  style={{
                    padding: "6px 12px",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    borderRadius: 9,
                    border: "none",
                    cursor: "pointer",
                    background:
                      idea.estimatedMinutes === m
                        ? "linear-gradient(135deg, #7B6FA8, #4A4070)"
                        : c.lavender,
                    color:
                      idea.estimatedMinutes === m ? "#fff" : c.textMid,
                    transition: "all 0.15s",
                  }}
                >
                  {formatDuration(m)}
                </button>
              ))}
            </div>
          </div>

          {/* Party size */}
          <div style={{ marginBottom: 14 }}>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 8,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: c.logan,
                margin: "0 0 6px",
              }}
            >
              Party size
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => onUpdate(idea.id, { covers: Math.max(1, covers - 1) })}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: c.lavender,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 16,
                  color: c.loganDeep,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                −
              </button>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 14,
                  fontWeight: 500,
                  color: c.text,
                  minWidth: 20,
                  textAlign: "center",
                }}
              >
                {covers}
              </span>
              <button
                onClick={() => onUpdate(idea.id, { covers: Math.min(8, covers + 1) })}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: c.lavender,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 16,
                  color: c.loganDeep,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                +
              </button>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: c.textMuted }}>
                {covers === 1 ? "person" : "people"}
              </span>
            </div>
          </div>

          {/* Free windows */}
          {alternativeSlots.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 8,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: c.logan,
                  margin: "0 0 6px",
                }}
              >
                Free windows
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {alternativeSlots.map((slot) => (
                  <div key={slot.start} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      onClick={() => onUpdate(idea.id, { suggestedTime: slot.start })}
                      style={{
                        padding: "6px 12px",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10,
                        borderRadius: 9,
                        border: "none",
                        cursor: "pointer",
                        background:
                          idea.suggestedTime === slot.start
                            ? "linear-gradient(135deg, #7B6FA8, #4A4070)"
                            : c.lavender,
                        color:
                          idea.suggestedTime === slot.start ? "#fff" : c.loganDeep,
                        transition: "all 0.15s",
                      }}
                    >
                      {slot.label}
                    </button>
                    {slot.yelpAvailable && slot.yelpUrl && (
                      <a
                        href={slot.yelpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          padding: "6px 10px",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 10,
                          borderRadius: 9,
                          background: c.green,
                          color: c.greenDeep,
                          border: `1px solid rgba(74,158,84,0.2)`,
                          textDecoration: "none",
                        }}
                      >
                        Reserve ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  color: c.logan,
                  marginTop: 6,
                }}
              >
                {hasYelpData ? "✓ yelp reservation available" : "based on your google calendar"}
              </p>
            </div>
          )}

          {/* Add to Calendar */}
          {idea.suggestedTime && (
            <div style={{ marginBottom: 14 }}>
              {isScheduled ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: c.green,
                      border: `1px solid rgba(74,158,84,0.2)`,
                      borderRadius: 10,
                      padding: "10px 16px",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      letterSpacing: "1px",
                      color: c.greenDeep,
                    }}
                  >
                    <span>✓</span>
                    <span>added to google calendar</span>
                  </div>
                  {calendarLink && (
                    <a
                      href={calendarLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10,
                        color: c.loganDeep,
                        textDecoration: "underline",
                        textDecorationColor: "rgba(123,111,168,0.3)",
                      }}
                    >
                      view ↗
                    </a>
                  )}
                </div>
              ) : (
                <button
                  onClick={addToCalendar}
                  disabled={scheduling}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "linear-gradient(135deg, #7B6FA8, #4A4070)",
                    color: "#fff",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    borderRadius: 11,
                    padding: "12px 18px",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 12px rgba(74,64,112,0.2)",
                    opacity: scheduling ? 0.7 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {scheduling ? (
                    <>
                      <svg
                        className="animate-spin"
                        style={{ width: 12, height: 12 }}
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      scheduling...
                    </>
                  ) : (
                    <>📅 add to google calendar</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: 14 }}>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 8,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: c.logan,
                margin: "0 0 6px",
              }}
            >
              Notes
            </p>
            {editingNotes ? (
              <textarea
                value={idea.notes}
                onChange={(e) => onUpdate(idea.id, { notes: e.target.value })}
                onBlur={() => setEditingNotes(false)}
                autoFocus
                rows={3}
                style={{
                  width: "100%",
                  borderRadius: 10,
                  border: "1px solid rgba(171,161,198,0.25)",
                  background: c.lavender + "55",
                  padding: "10px 12px",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: c.text,
                  outline: "none",
                  resize: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(123,111,168,0.4)")}
                placeholder="add a note..."
              />
            ) : (
              <button
                onClick={() => setEditingNotes(true)}
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: idea.notes ? c.textMid : c.textMuted,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: 0,
                  width: "100%",
                  transition: "color 0.15s",
                }}
              >
                {idea.notes || "add a note..."}
              </button>
            )}
          </div>

          {/* Saved link */}
          {idea.savedLink && (
            <div style={{ marginBottom: 14 }}>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 8,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: c.logan,
                  margin: "0 0 6px",
                }}
              >
                Link
              </p>
              <a
                href={idea.savedLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: c.loganDeep,
                  textDecoration: "underline",
                  textDecorationColor: "rgba(123,111,168,0.3)",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {idea.savedLink}
              </a>
            </div>
          )}

          {/* Invitees */}
          {(() => {
            let inviteeList: string[] = [];
            try { inviteeList = JSON.parse(idea.invitees || "[]"); } catch { inviteeList = []; }
            if (inviteeList.length === 0) return null;
            return (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: c.logan, margin: "0 0 8px" }}>
                  Invited
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {inviteeList.map((name) => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(223,221,242,0.5)", border: "1px solid rgba(171,161,198,0.2)", borderRadius: 20, padding: "5px 10px 5px 6px" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, #7B6FA8, #4A4070)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#fff", fontWeight: 600 }}>{name[0]}</span>
                      </div>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: c.textMid }}>{name}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: c.textMuted, letterSpacing: "0.5px" }}>pending</span>
                    </div>
                  ))}
                </div>
                {idea.taskNotes && (
                  <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(223,221,242,0.35)", borderRadius: 9, border: "1px solid rgba(171,161,198,0.15)" }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase", color: c.logan, margin: "0 0 4px" }}>Tasks</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: c.textMid, margin: 0 }}>{idea.taskNotes}</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Footer */}
          <div
            style={{
              paddingTop: 10,
              borderTop: "1px solid rgba(171,161,198,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: c.logan,
              }}
            >
              {idea.planType === "friends" ? "👥 with friends" : "🙋 solo"}
            </span>
            <button
              onClick={() => setShowShare(!showShare)}
              style={{
                background: showShare ? c.lavender : "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: c.loganDeep,
                padding: "5px 10px",
                borderRadius: 8,
                transition: "background 0.15s",
              }}
            >
              invite ↗
            </button>
          </div>

          {/* Share sheet */}
          {showShare && (
            <div
              style={{
                marginTop: 12,
                padding: "14px 16px",
                background: c.lavender + "88",
                borderRadius: 12,
                border: "1px solid rgba(171,161,198,0.2)",
              }}
            >
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: c.logan, margin: "0 0 10px" }}>
                share this plan
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div
                  style={{
                    flex: 1,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: c.textMid,
                    background: "rgba(255,255,255,0.8)",
                    borderRadius: 9,
                    padding: "9px 12px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    border: "1px solid rgba(171,161,198,0.2)",
                  }}
                >
                  {typeof window !== "undefined" ? `${window.location.origin}/share/${idea.id}` : `/share/${idea.id}`}
                </div>
                <button
                  onClick={copyShareLink}
                  style={{
                    flexShrink: 0,
                    background: copied ? "rgba(114,185,122,0.2)" : "linear-gradient(135deg, #7B6FA8, #4A4070)",
                    color: copied ? c.greenDeep : "#fff",
                    border: copied ? "1px solid rgba(74,158,84,0.3)" : "none",
                    borderRadius: 9,
                    padding: "9px 14px",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {copied ? "✓ copied" : "copy link"}
                </button>
              </div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: c.textMuted, marginTop: 8, margin: "8px 0 0" }}>
                anyone with this link can view the plan
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hover reveal delete — CSS trick via parent hover */}
      <style>{`
        div:hover .group-hover-delete { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
