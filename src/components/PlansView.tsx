"use client";

import { useState, useMemo } from "react";
import IdeaCard from "./IdeaCard";

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
  rating: number;
  calendarEventId: string;
  openingHours: string;
  invitees: string;
  acceptedBy: string;
  taskNotes: string;
  createdAt: string;
}

interface Props {
  ideas: Idea[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Idea>) => void;
  enrichingIds: Set<string>;
}

const c = {
  text: "#1E1A2E",
  textMuted: "#A89FC0",
  logan: "#ABA1C6",
  loganDeep: "#7B6FA8",
  loganDark: "#4A4070",
  lavender: "#DFDDF2",
  lavDeep: "#C9C5E8",
  green: "#D4EDDA",
  greenDeep: "#4A9E54",
  surface: "rgba(255,255,255,0.96)",
};

type PlanTab = "upcoming" | "past" | "calendar";

function StarRating({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate(star === rating ? 0 : star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontSize: 14,
            color: star <= (hover || rating) ? "#F2B8CB" : c.lavDeep,
            transition: "color 0.1s",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function PastCard({ idea, onRate }: { idea: Idea; onRate: (r: number) => void }) {
  const date = idea.suggestedTime ? new Date(idea.suggestedTime) : new Date(idea.createdAt);
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

  return (
    <div
      style={{
        background: c.surface,
        border: "1px solid rgba(171,161,198,0.15)",
        borderRadius: 14,
        display: "flex",
        overflow: "hidden",
        boxShadow: "0 1px 8px rgba(74,64,112,0.04)",
        opacity: 0.85,
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
          padding: "14px 0",
          background: "rgba(171,161,198,0.06)",
        }}
      >
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 500, lineHeight: 1, color: c.logan }}>{day}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: "2px", textTransform: "uppercase", color: c.logan, marginTop: 2 }}>{month}</span>
      </div>

      {/* Divider */}
      <div style={{ width: 3, background: c.lavDeep, borderRadius: 2, margin: "8px 10px 8px 4px", flexShrink: 0 }} />

      {/* Content */}
      <div style={{ flex: 1, padding: "12px 14px 12px 0" }}>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: "#6B6480", lineHeight: 1.3, margin: "0 0 6px" }}>
          {idea.title}
        </p>
        <StarRating rating={idea.rating} onRate={onRate} />
      </div>
    </div>
  );
}

function CalendarView({ ideas }: { ideas: Idea[] }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const dateMap = useMemo(() => {
    const map: Record<string, Idea[]> = {};
    for (const idea of ideas) {
      if (!idea.suggestedTime) continue;
      const d = new Date(idea.suggestedTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      (map[key] ??= []).push(idea);
    }
    return map;
  }, [ideas]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const selectedIdeas = selectedKey ? (dateMap[selectedKey] ?? []) : [];

  return (
    <div className="anim">
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button
          onClick={prevMonth}
          style={{ background: c.lavender, border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 12, color: c.loganDeep }}
        >
          ←
        </button>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: c.text }}>
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          style={{ background: c.lavender, border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 12, color: c.loganDeep }}
        >
          →
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "1px", color: c.logan }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = `${viewYear}-${viewMonth}-${day}`;
          const hasPlans = !!dateMap[key];
          const isToday = now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day;
          const isSelected = selectedKey === key;

          return (
            <button
              key={day}
              onClick={() => hasPlans && setSelectedKey(isSelected ? null : key)}
              style={{
                aspectRatio: "1",
                borderRadius: 10,
                border: "none",
                background: isSelected
                  ? "linear-gradient(135deg, #7B6FA8, #4A4070)"
                  : isToday
                  ? c.lavender
                  : "transparent",
                color: isSelected ? "#fff" : isToday ? c.loganDark : hasPlans ? c.text : c.logan,
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                cursor: hasPlans ? "pointer" : "default",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                fontWeight: hasPlans ? 500 : 400,
                transition: "all 0.15s",
              }}
            >
              {day}
              {hasPlans && (
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: isSelected ? "rgba(255,255,255,0.8)" : c.loganDeep,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day plans */}
      {selectedIdeas.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(171,161,198,0.15)" }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: c.logan, marginBottom: 10 }}>
            {selectedIdeas.length} plan{selectedIdeas.length > 1 ? "s" : ""} this day
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selectedIdeas.map((idea) => {
              const t = new Date(idea.suggestedTime);
              const timeStr = t.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
              return (
                <div
                  key={idea.id}
                  style={{
                    background: c.surface,
                    border: "1px solid rgba(171,161,198,0.2)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ width: 3, height: 32, borderRadius: 2, background: idea.calendarEventId ? "#72B97A" : c.loganDeep, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: c.text, margin: 0, lineHeight: 1.3 }}>{idea.title}</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: c.textMuted, margin: "3px 0 0" }}>{timeStr}</p>
                  </div>
                  {idea.calendarEventId && (
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, background: c.green, color: c.greenDeep, padding: "3px 8px", borderRadius: 20 }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.keys(dateMap).length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0 20px" }}>
          <p style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 13, color: c.textMuted }}>
            no plans on the calendar yet
          </p>
        </div>
      )}
    </div>
  );
}

export default function PlansView({ ideas, onDelete, onUpdate, enrichingIds }: Props) {
  const [tab, setTab] = useState<PlanTab>("upcoming");
  const now = new Date();

  const upcoming = useMemo(
    () => ideas.filter((i) => i.suggestedTime && new Date(i.suggestedTime) >= now).sort((a, b) => new Date(a.suggestedTime).getTime() - new Date(b.suggestedTime).getTime()),
    [ideas]
  );

  const past = useMemo(
    () => ideas.filter((i) => !i.suggestedTime || new Date(i.suggestedTime) < now).sort((a, b) => new Date(b.suggestedTime || b.createdAt).getTime() - new Date(a.suggestedTime || a.createdAt).getTime()),
    [ideas]
  );

  const tabs: { id: PlanTab; label: string }[] = [
    { id: "upcoming", label: "upcoming" },
    { id: "past", label: "past" },
    { id: "calendar", label: "calendar" },
  ];

  return (
    <div className="anim">
      {/* Sub-tabs */}
      <div
        style={{
          display: "flex",
          background: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(171,161,198,0.2)",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 20,
          boxShadow: "0 1px 4px rgba(74,64,112,0.05)",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "9px 0",
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              background: tab === t.id ? "linear-gradient(135deg, #7B6FA8, #4A4070)" : "transparent",
              color: tab === t.id ? "#fff" : c.textMuted,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Upcoming */}
      {tab === "upcoming" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 18, color: c.text, margin: "0 0 8px" }}>nothing coming up</p>
              <p style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 13, color: c.textMuted }}>add plans from the home tab</p>
            </div>
          ) : (
            upcoming.map((idea, i) => (
              <div key={idea.id} className={`anim d${Math.min(i + 1, 6) as 1 | 2 | 3 | 4 | 5 | 6}`}>
                <IdeaCard
                  idea={idea}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  enriching={enrichingIds.has(idea.id)}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Past */}
      {tab === "past" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {past.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 13, color: c.textMuted }}>no past plans yet</p>
            </div>
          ) : (
            past.map((idea, i) => (
              <div key={idea.id} className={`anim d${Math.min(i + 1, 6) as 1 | 2 | 3 | 4 | 5 | 6}`}>
                <PastCard
                  idea={idea}
                  onRate={(r) => onUpdate(idea.id, { rating: r })}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Calendar */}
      {tab === "calendar" && (
        <div
          style={{
            background: c.surface,
            border: "1px solid rgba(171,161,198,0.2)",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 2px 18px rgba(74,64,112,0.07)",
          }}
        >
          <CalendarView ideas={ideas} />
        </div>
      )}
    </div>
  );
}
