import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AcceptButton from "./AcceptButton";

interface ShareIdea {
  id: string;
  title: string;
  placeName: string;
  placeAddress: string;
  estimatedMinutes: number;
  suggestedTime: string;
  category: string;
  lat: number | null;
  lng: number | null;
  covers: number;
  planType: string;
  notes: string;
  user: { name: string | null } | null;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id: params.id },
      select: { title: true },
    });
    if (idea) return { title: `${idea.title} — roam` };
  } catch { /* */ }
  return { title: "a plan — roam" };
}

function formatDateFull(iso: string): { day: number; month: string; time: string; full: string } | null {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isToday = d.toDateString() === now.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    const dayStr = isToday ? "Today" : isTomorrow ? "Tomorrow"
      : d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return {
      day: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      time: timeStr,
      full: `${dayStr} · ${timeStr}`,
    };
  } catch { return null; }
}

function formatDuration(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const c = {
  text:      "#1E1A2E",
  textMid:   "#6B6480",
  textMuted: "#A89FC0",
  logan:     "#ABA1C6",
  loganDeep: "#7B6FA8",
  loganDark: "#4A4070",
  lavender:  "#DFDDF2",
};

export default async function SharePage({ params }: { params: { id: string } }) {
  let idea: ShareIdea | null = null;
  try {
    idea = await prisma.idea.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        placeName: true,
        placeAddress: true,
        estimatedMinutes: true,
        suggestedTime: true,
        category: true,
        lat: true,
        lng: true,
        covers: true,
        planType: true,
        notes: true,
        user: { select: { name: true } },
      },
    }) as ShareIdea | null;
  } catch {
    notFound();
  }

  if (!idea) notFound();

  const dateParts = idea.suggestedTime ? formatDateFull(idea.suggestedTime) : null;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(idea.placeName || idea.title)}`;
  const fromName = idea.user?.name || "someone";

  return (
    <div
      className="dot-grid"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F5F3FA", padding: "24px 16px" }}
    >
      <div className="anim" style={{ width: "100%", maxWidth: 400 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, background: "linear-gradient(135deg, #7B6FA8, #4A4070)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 4px 20px rgba(74,64,112,0.25)", fontSize: 22 }}>
            🧭
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 36, color: c.text, lineHeight: 1 }}>
            roam
          </h1>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: c.textMuted, letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 8 }}>
            {fromName} invited you to a plan
          </p>
        </div>

        {/* Plan card */}
        <div className="anim d1" style={{ background: "rgba(255,255,255,0.96)", border: "1px solid rgba(171,161,198,0.2)", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 28px rgba(74,64,112,0.10), 0 1px 4px rgba(74,64,112,0.06)" }}>

          {/* Gradient hero */}
          <div style={{ background: "linear-gradient(135deg, #7B6FA8, #4A4070)", padding: "24px 24px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              {dateParts && (
                <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 14px", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, color: "#fff", lineHeight: 1 }}>
                    {dateParts.day}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
                    {dateParts.month}
                  </div>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#fff", lineHeight: 1.25, marginBottom: dateParts ? 8 : 0 }}>
                  {idea.title}
                </p>
                {dateParts && (
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
                    📅 {dateParts.full}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div style={{ padding: "20px 24px" }}>
            {idea.placeName && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: c.logan, marginBottom: 6 }}>
                  Location
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'DM Mono', monospace", fontSize: 12, color: c.loganDeep, textDecoration: "none" }}
                >
                  <span>📍</span>
                  <span style={{ textDecoration: "underline", textDecorationColor: "rgba(123,111,168,0.3)" }}>{idea.placeName}</span>
                  {idea.placeAddress && <span style={{ color: c.textMuted }}> · {idea.placeAddress}</span>}
                  <span style={{ color: c.logan }}>↗</span>
                </a>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: idea.notes ? 16 : 0 }}>
              <div style={{ background: c.lavender, borderRadius: 10, padding: "8px 14px" }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase", color: c.logan, marginBottom: 4 }}>Duration</p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: c.loganDark }}>~{formatDuration(idea.estimatedMinutes)}</p>
              </div>
              <div style={{ background: c.lavender, borderRadius: 10, padding: "8px 14px" }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase", color: c.logan, marginBottom: 4 }}>Party</p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: c.loganDark }}>{idea.covers} {idea.covers === 1 ? "person" : "people"}</p>
              </div>
              <div style={{ background: c.lavender, borderRadius: 10, padding: "8px 14px" }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase", color: c.logan, marginBottom: 4 }}>Vibe</p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: c.loganDark }}>{idea.planType === "friends" ? "👥 group" : "🙋 solo"}</p>
              </div>
            </div>

            {idea.notes && (
              <div style={{ marginTop: 16, background: "rgba(223,221,242,0.4)", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: c.logan, marginBottom: 6 }}>Notes</p>
                <p style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 13, color: c.textMid, lineHeight: 1.5 }}>{idea.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="anim d2" style={{ marginTop: 20 }}>
          <AcceptButton ideaId={idea.id} />
          <p className="anim d3" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: c.textMuted, marginTop: 14, letterSpacing: "0.5px", textAlign: "center" }}>
            plan your own adventures with roam
          </p>
        </div>

      </div>
    </div>
  );
}
