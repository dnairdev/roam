"use client";

import { signOut } from "next-auth/react";
import { useMemo } from "react";
import { Session } from "next-auth";

interface Idea {
  id: string;
  title: string;
  category: string;
  suggestedTime: string;
  calendarEventId: string;
  placeName: string;
  rating: number;
}

interface Props {
  ideas: Idea[];
  session: Session | null;
}

const c = {
  text: "#1E1A2E",
  textMid: "#6B6480",
  textMuted: "#A89FC0",
  logan: "#ABA1C6",
  loganDeep: "#7B6FA8",
  loganDark: "#4A4070",
  lavender: "#DFDDF2",
  lavDeep: "#C9C5E8",
  surface: "rgba(255,255,255,0.96)",
};

const CATEGORY_TAGS: Record<string, string> = {
  "food-drink": "🍕 foodie",
  culture: "🎭 culture",
  outdoors: "🌿 outdoors",
  entertainment: "🎬 entertainment",
  wellness: "🧘 wellness",
  shopping: "🛍️ shopping",
  travel: "✈️ explorer",
  nightlife: "🌙 nightlife",
  sports: "⚽ sports",
  other: "🧭 adventurer",
};

export default function ProfileView({ ideas, session }: Props) {
  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const now = new Date();

  const stats = useMemo(() => {
    const total = ideas.length;
    const scheduled = ideas.filter((i) => i.calendarEventId).length;
    const places = ideas.filter((i) => i.placeName).length;
    const avgRating = ideas.filter((i) => i.rating > 0).reduce((acc, i) => acc + i.rating, 0)
      / (ideas.filter((i) => i.rating > 0).length || 1);
    return { total, scheduled, places, avgRating };
  }, [ideas]);

  const interestTags = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const idea of ideas) {
      if (idea.category) counts[idea.category] = (counts[idea.category] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => CATEGORY_TAGS[cat] ?? `🗺️ ${cat}`);
  }, [ideas]);

  return (
    <div className="anim">
      {/* Profile card */}
      <div
        style={{
          background: c.surface,
          border: "1px solid rgba(171,161,198,0.2)",
          borderRadius: 20,
          padding: "28px 24px 24px",
          marginBottom: 14,
          boxShadow: "0 2px 18px rgba(74,64,112,0.07)",
          textAlign: "center",
        }}
      >
        {/* Avatar */}
        {user?.image ? (
          <img
            src={user.image}
            alt=""
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              border: "3px solid #DFDDF2",
              margin: "0 auto 14px",
              display: "block",
            }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7B6FA8, #4A4070)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              fontFamily: "'DM Mono', monospace",
              fontSize: 24,
              color: "#fff",
            }}
          >
            {initials}
          </div>
        )}

        {/* Name */}
        <p
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 22,
            color: c.text,
            margin: "0 0 4px",
          }}
        >
          {user?.name || "traveler"}
        </p>

        {/* Email handle */}
        {user?.email && (
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: c.textMuted,
              margin: "0 0 16px",
            }}
          >
            {user.email}
          </p>
        )}

        {/* Interest tags */}
        {interestTags.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            {interestTags.map((tag) => (
              <span
                key={tag}
                style={{
                  background: c.lavender,
                  color: c.loganDark,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.5px",
                  padding: "4px 10px",
                  borderRadius: 20,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {[
          { value: stats.total, label: "plans made" },
          { value: stats.scheduled, label: "scheduled" },
          { value: stats.places, label: "places" },
        ].map(({ value, label }) => (
          <div
            key={label}
            style={{
              background: c.surface,
              border: "1px solid rgba(171,161,198,0.2)",
              borderRadius: 16,
              padding: "18px 12px",
              textAlign: "center",
              boxShadow: "0 1px 8px rgba(74,64,112,0.05)",
            }}
          >
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 28,
                fontWeight: 500,
                color: c.loganDark,
                lineHeight: 1,
                margin: "0 0 4px",
              }}
            >
              {value}
            </p>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 8,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: c.logan,
                margin: 0,
              }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Average rating */}
      {ideas.some((i) => i.rating > 0) && (
        <div
          style={{
            background: c.surface,
            border: "1px solid rgba(171,161,198,0.2)",
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 14,
            boxShadow: "0 1px 8px rgba(74,64,112,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: c.logan }}>
            avg rating
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} style={{ fontSize: 14, color: star <= Math.round(stats.avgRating) ? "#F2B8CB" : c.lavDeep }}>★</span>
              ))}
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: c.textMid }}>
              {stats.avgRating.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={() => signOut()}
        style={{
          width: "100%",
          padding: "14px 0",
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          letterSpacing: "2px",
          textTransform: "uppercase",
          background: "transparent",
          color: c.textMuted,
          border: "1px solid rgba(171,161,198,0.3)",
          borderRadius: 13,
          cursor: "pointer",
          transition: "all 0.15s",
          marginTop: 4,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(229,115,115,0.4)";
          e.currentTarget.style.color = "#E57373";
          e.currentTarget.style.background = "rgba(229,115,115,0.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(171,161,198,0.3)";
          e.currentTarget.style.color = c.textMuted;
          e.currentTarget.style.background = "transparent";
        }}
      >
        sign out
      </button>
    </div>
  );
}
