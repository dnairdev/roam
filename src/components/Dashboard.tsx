"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

import TopBar from "./TopBar";
import IdeaCard from "./IdeaCard";
import PlansView from "./PlansView";
import InboxView, { Notification } from "./InboxView";
import ProfileView from "./ProfileView";


const DEMO_CONTACTS = ["Tyler", "Diya", "Mia", "Stanley", "Daniel", "Arleen"];

interface Idea {
  id: string;
  title: string;
  notes: string;
  location: string;
  placeName: string;
  placeAddress: string;
  placeTypes: string;
  estimatedMinutes: number;
  suggestedTime: string;
  suggestedTimes: string;
  category: string;
  lat: number | null;
  lng: number | null;
  planType: string;
  savedLink: string;
  tags: string;
  bucketId: string | null;
  covers: number;
  rating: number;
  calendarEventId: string;
  openingHours: string;
  invitees: string;
  acceptedBy: string;
  taskNotes: string;
  createdAt: string;
  updatedAt: string;
}

type Tab = "home" | "plans" | "inbox" | "profile";

const TABS: { id: Tab; symbol: string; label: string }[] = [
  { id: "home",    symbol: "◌", label: "home"    },
  { id: "plans",   symbol: "⊟", label: "plans"   },
  { id: "inbox",   symbol: "◎", label: "inbox"   },
  { id: "profile", symbol: "⊕", label: "profile" },
];

function formatSlotLabel(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const dayStr = isToday ? "Today" : isTomorrow ? "Tomorrow"
      : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${dayStr} · ${timeStr}`;
  } catch { return ""; }
}

function formatNextUp(iso: string): string {
  return formatSlotLabel(iso);
}

function generateNotifications(ideas: Idea[]): Notification[] {
  const now = new Date();
  const result: Notification[] = [];
  for (const idea of ideas) {
    let invitees: string[] = [];
    let acceptedBy: string[] = [];
    try { invitees = JSON.parse(idea.invitees || "[]"); } catch { invitees = []; }
    try { acceptedBy = JSON.parse(idea.acceptedBy || "[]"); } catch { acceptedBy = []; }

    if (!idea.suggestedTime) {
      if (idea.placeName) {
        result.push({ id: `suggest-${idea.id}`, type: "suggestion", icon: "✨", text: `suggestion ready: ${idea.title}`, sub: idea.placeName, read: true, time: idea.createdAt });
      }
      continue;
    }
    const d = new Date(idea.suggestedTime);
    const diffHours = (d.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (idea.calendarEventId) {
      result.push({ id: `cal-${idea.id}`, type: "confirmed", icon: "✓", text: `${idea.title} is on your calendar`, sub: formatSlotLabel(idea.suggestedTime), read: diffHours > 48, time: idea.suggestedTime });
    } else if (diffHours >= 0 && diffHours <= 48) {
      result.push({ id: `remind-${idea.id}`, type: "reminder", icon: "◷", text: `upcoming: ${idea.title}`, sub: `${formatSlotLabel(idea.suggestedTime)} · not yet added to calendar`, read: false, time: idea.suggestedTime });
    }

    if (invitees.length > 0 && acceptedBy.length < invitees.length) {
      result.push({
        id: `pending-${idea.id}`,
        type: "pending",
        icon: "↗",
        text: `${idea.title} is waiting on ${invitees.length - acceptedBy.length} RSVP${invitees.length - acceptedBy.length === 1 ? "" : "s"}`,
        sub: acceptedBy.length > 0 ? `${acceptedBy.join(", ")} already in` : "share link ready",
        read: false,
        time: idea.updatedAt,
      });
    }

    if (acceptedBy.length > 0) {
      result.push({
        id: `accepted-${idea.id}`,
        type: "confirmed",
        icon: "✓",
        text: `${acceptedBy.join(", ")} accepted ${idea.title}`,
        sub: formatSlotLabel(idea.suggestedTime),
        read: false,
        time: idea.updatedAt,
      });
    }
  }
  return result.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const [inviteToast, setInviteToast] = useState<string | null>(null);
  const [mentionDropdown, setMentionDropdown] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const fetchIdeas = useCallback(async () => {
    try {
      const res = await fetch("/api/ideas");
      if (res.ok) setIdeas(await res.json());
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  async function enrichIdea(id: string, title: string) {
    setEnrichingIds((prev) => new Set(prev).add(id));
    try {
      const interpretRes = await fetch("/api/ideas/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const interpreted = interpretRes.ok ? await interpretRes.json() : null;
      const searchQuery = interpreted?.searchQuery || title;
      const refinedTitle = interpreted?.refinedTitle || title;
      const llmPreference = interpreted?.preference || "any";
      const llmCategory = interpreted?.category || null;
      const llmMinutes = interpreted?.estimatedMinutes || null;
      const invitees: string[] = interpreted?.invitees || [];
      const specificDatetime: string | null = interpreted?.specificDatetime || null;
      const taskAssignments: string | null = interpreted?.taskAssignments || null;

      if (refinedTitle !== title) {
        setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, title: refinedTitle } : i)));
        fetch(`/api/ideas/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: refinedTitle }) }).catch(() => {});
      }

      const placeRes = await fetch(`/api/places/search?q=${encodeURIComponent(searchQuery)}`);
      const placeData = placeRes.ok ? await placeRes.json() : null;
      const placeName = placeData?.place?.name || "";
      const placeAddress = placeData?.place?.address || "";
      const placeTypes = placeData?.place?.types || [];
      const estimatedMinutes = llmMinutes || placeData?.estimatedMinutes || 60;
      const category = llmCategory || placeData?.category || "other";
      const lat = placeData?.place?.lat ?? null;
      const lng = placeData?.place?.lng ?? null;
      const openingPeriods = placeData?.place?.openingPeriods || [];
      const yelpSupportsReservations = placeData?.yelpSupportsReservations || false;
      const yelpReservationUrl = placeData?.yelpReservationUrl || null;
      const currentIdea = ideas.find((i) => i.id === id);
      const covers = currentIdea?.covers ?? 2;

      const preference = llmPreference || "any";

      let suggestedTime = "";
      let suggestedTimes = "[]";

      if (specificDatetime) {
        // Use the explicitly specified datetime — skip suggest-slots
        suggestedTime = specificDatetime;
        suggestedTimes = JSON.stringify([{ start: specificDatetime, label: formatSlotLabel(specificDatetime) }]);
      } else {
        const slotRes = await fetch("/api/calendar/suggest-slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            duration: estimatedMinutes,
            preference,
            friendEmails: invitees.map((name) => `${name.toLowerCase()}@roam.local`),
            excludeIdeaId: id,
            openingPeriods,
            yelpSupportsReservations,
            yelpReservationUrl,
            covers,
          }),
        });
        const slotData = slotRes.ok ? await slotRes.json() : null;
        const slots = slotData?.slots || [];
        suggestedTime = slots[0]?.start || "";
        suggestedTimes = JSON.stringify(slots);
      }

      const planType = invitees.length > 0 ? "friends" : "solo";

      const updateRes = await fetch(`/api/ideas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeName,
          placeAddress,
          placeTypes: JSON.stringify(placeTypes),
          estimatedMinutes,
          suggestedTime,
          suggestedTimes,
          category,
          lat,
          lng,
          openingHours: JSON.stringify(openingPeriods),
          invitees: JSON.stringify(invitees),
          taskNotes: taskAssignments || "",
          planType,
        }),
      });
      if (updateRes.ok) {
        const updated = await updateRes.json();
        setIdeas((prev) => prev.map((i) => (i.id === id ? updated : i)));
      }

      // Auto-add to Google Calendar
      if (suggestedTime) {
        try {
          const calRes = await fetch("/api/calendar/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ideaId: id,
              title: refinedTitle,
              startTime: suggestedTime,
              durationMinutes: estimatedMinutes,
              location: placeAddress || placeName,
              notes: "",
            }),
          });
          if (calRes.ok) {
            const calData = await calRes.json();
            setIdeas((prev) =>
              prev.map((i) =>
                i.id === id ? { ...i, calendarEventId: calData.eventId } : i
              )
            );
          }
        } catch { }
      }

      if (invitees.length > 0) {
        setInviteToast(`📨 Invites sent to ${invitees.join(", ")}`);
        setTimeout(() => setInviteToast(null), 7000);
      }
    } catch { } finally {
      setEnrichingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  }

  async function createIdea() {
    const title = input.trim();
    if (!title) return;
    setInput("");
    setMentionDropdown([]);
    
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const idea = await res.json();
        setIdeas((prev) => [idea, ...prev]);
        enrichIdea(idea.id, title);
      }
    } catch { }
    inputRef.current?.focus();
  }

  function updateIdea(id: string, data: Partial<Idea>) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      try {
        await fetch(`/api/ideas/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      } catch { }
    }, 500);
  }

  async function deleteIdea(id: string) {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    try { await fetch(`/api/ideas/${id}`, { method: "DELETE" }); } catch { }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInput(val);

    // Detect @mention: find the last word that starts with @
    const words = val.split(/\s/);
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith("@")) {
      const query = lastWord.slice(1).toLowerCase();
      
      const filtered = DEMO_CONTACTS.filter(
        (c) => c.toLowerCase().startsWith(query) && !val.includes(`@${c} `) && !val.endsWith(`@${c}`)
      );
      setMentionDropdown(filtered);
    } else {
      setMentionDropdown([]);
      
    }
  }

  function selectContact(name: string) {
    // Replace the partial @mention with the full @Name
    const words = input.split(/\s/);
    words[words.length - 1] = `@${name}`;
    setInput(words.join(" ") + " ");
    setMentionDropdown([]);
    
    inputRef.current?.focus();
  }

  const now = new Date();
  const nextUpIdea = useMemo(() =>
    ideas.filter((i) => i.suggestedTime && new Date(i.suggestedTime) > now)
      .sort((a, b) => new Date(a.suggestedTime).getTime() - new Date(b.suggestedTime).getTime())[0] ?? null,
    [ideas]
  );

  const notifications = useMemo(() => generateNotifications(ideas), [ideas]);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const contentPb = activeTab === "home" ? 148 : 72;

  return (
    <div className="dot-grid" style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#F5F3FA" }}>
      <TopBar userName={session?.user?.name} userImage={session?.user?.image} notificationCount={unreadCount} onNotificationClick={() => setActiveTab("inbox")} />

      {/* Invite toast */}
      {inviteToast && (
        <div style={{
          position: "fixed",
          top: 70,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(171,161,198,0.3)",
          borderRadius: 14,
          padding: "12px 20px",
          boxShadow: "0 4px 24px rgba(74,64,112,0.18)",
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          color: "#4A4070",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          {inviteToast}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: contentPb }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 0" }}>

          {activeTab === "home" && (
            <>
              {true && (
                <>
                  {nextUpIdea && (
                    <div className="anim d1" style={{ background: "linear-gradient(135deg, #7B6FA8, #4A4070)", borderRadius: 18, padding: "20px 20px 18px", marginBottom: 16, boxShadow: "0 4px 24px rgba(74,64,112,0.22)", cursor: "pointer" }} onClick={() => setActiveTab("plans")}>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", margin: "0 0 8px" }}>next up</p>
                      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#fff", lineHeight: 1.25, margin: "0 0 10px" }}>{nextUpIdea.title}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        {nextUpIdea.suggestedTime && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.75)" }}>📅 {formatNextUp(nextUpIdea.suggestedTime)}</span>}
                        {nextUpIdea.placeName && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.65)" }}>📍 {nextUpIdea.placeName}</span>}
                        {nextUpIdea.calendarEventId && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase", background: "rgba(114,185,122,0.25)", color: "#D4EDDA", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(114,185,122,0.35)" }}>✓ scheduled</span>}
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#A89FC0" }}>
                        <svg className="animate-spin" style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        loading...
                      </div>
                    </div>
                  ) : ideas.length === 0 ? (
                    <div className="anim" style={{ textAlign: "center", padding: "80px 0" }}>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: "#DFDDF2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 26 }}>🧭</div>
                      <p style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 20, color: "#1E1A2E", margin: "0 0 8px" }}>no ideas yet</p>
                      <p style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 13, color: "#A89FC0", margin: 0 }}>type something below — roam finds the place & time</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {ideas.map((idea, i) => (
                        <div key={idea.id} className={`anim d${Math.min(i + 1, 6) as 1|2|3|4|5|6}`}>
                          <IdeaCard idea={idea} onDelete={deleteIdea} onUpdate={updateIdea} enriching={enrichingIds.has(idea.id)} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === "plans" && <PlansView ideas={ideas} onDelete={deleteIdea} onUpdate={updateIdea} enrichingIds={enrichingIds} />}
          {activeTab === "inbox" && <InboxView notifications={notifications} />}
          {activeTab === "profile" && <ProfileView ideas={ideas} session={session} />}
        </div>
      </div>

      {activeTab === "home" && (
        <div style={{ position: "fixed", bottom: 60, left: 0, right: 0, background: "rgba(245,243,250,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: "1px solid rgba(171,161,198,0.12)", padding: "10px 16px 10px", zIndex: 40 }}>
          <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
            {/* Mention dropdown */}
            {mentionDropdown.length > 0 && (
              <div style={{
                position: "absolute",
                bottom: "calc(100% + 6px)",
                left: 0,
                right: 0,
                background: "rgba(255,255,255,0.98)",
                border: "1px solid rgba(171,161,198,0.3)",
                borderRadius: 12,
                boxShadow: "0 4px 24px rgba(74,64,112,0.14)",
                overflow: "hidden",
                zIndex: 50,
              }}>
                {mentionDropdown.map((name, idx) => (
                  <button
                    key={name}
                    onMouseDown={(e) => { e.preventDefault(); selectContact(name); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      borderBottom: idx < mentionDropdown.length - 1 ? "1px solid rgba(171,161,198,0.1)" : "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(223,221,242,0.4)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #7B6FA8, #4A4070)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#fff", fontWeight: 600 }}>
                        {name[0]}
                      </span>
                    </div>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#1E1A2E" }}>{name}</span>
                  </button>
                ))}
              </div>
            )}

            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && mentionDropdown.length === 0) createIdea();
                if (e.key === "Escape") { setMentionDropdown([]);  }
              }}
              placeholder="what do you want to do?"
              style={{ width: "100%", borderRadius: 13, border: "1px solid rgba(171,161,198,0.25)", background: "rgba(255,255,255,0.96)", padding: input ? "13px 80px 13px 18px" : "13px 18px", fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 17, color: "#1E1A2E", outline: "none", boxShadow: "0 2px 18px rgba(74,64,112,0.07)", boxSizing: "border-box" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(123,111,168,0.4)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(74,64,112,0.12)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(171,161,198,0.25)"; e.currentTarget.style.boxShadow = "0 2px 18px rgba(74,64,112,0.07)"; }}
            />
            {input && (
              <button onClick={createIdea} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "linear-gradient(135deg, #7B6FA8, #4A4070)", color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", border: "none", borderRadius: 9, padding: "8px 12px", cursor: "pointer" }}>
                add →
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 60, background: "rgba(245,243,250,0.95)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: "1px solid rgba(171,161,198,0.15)", display: "flex", alignItems: "stretch", zIndex: 50 }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", position: "relative" }}>
              {isActive && <div style={{ position: "absolute", top: 6, width: 4, height: 4, borderRadius: "50%", background: "#7B6FA8" }} />}
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, lineHeight: 1, color: isActive ? "#7B6FA8" : "#ABA1C6" }}>{tab.symbol}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: isActive ? "#7B6FA8" : "#C9C5E8" }}>{tab.label}</span>
              {tab.id === "inbox" && unreadCount > 0 && (
                <div style={{ position: "absolute", top: 8, right: "calc(50% - 14px)", width: 7, height: 7, borderRadius: "50%", background: "#F2B8CB", border: "1.5px solid rgba(245,243,250,0.95)" }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
