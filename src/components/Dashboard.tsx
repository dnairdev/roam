"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import TopBar from "./TopBar";
import IdeaCard from "./IdeaCard";
import { getCategoryInfo } from "@/lib/categorize";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

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
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Fetch ideas ──────────────────────────────────────────

  const fetchIdeas = useCallback(async () => {
    try {
      const res = await fetch("/api/ideas");
      if (res.ok) setIdeas(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  // ── Auto-enrich an idea with place + duration + time ─────

  async function enrichIdea(id: string, title: string) {
    setEnrichingIds((prev) => new Set(prev).add(id));

    try {
      // 1. Search for place + estimate duration
      const placeRes = await fetch(
        `/api/places/search?q=${encodeURIComponent(title)}`
      );
      const placeData = placeRes.ok ? await placeRes.json() : null;

      const placeName = placeData?.place?.name || "";
      const placeAddress = placeData?.place?.address || "";
      const placeTypes = placeData?.place?.types || [];
      const estimatedMinutes = placeData?.estimatedMinutes || 60;
      const category = placeData?.category || "other";
      const lat = placeData?.place?.lat ?? null;
      const lng = placeData?.place?.lng ?? null;

      // 2. Find a free time slot
      const slotRes = await fetch("/api/calendar/suggest-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: estimatedMinutes,
          preference: "any",
          friendEmails: [],
          excludeIdeaId: id,
        }),
      });
      const slotData = slotRes.ok ? await slotRes.json() : null;
      const slots = slotData?.slots || [];
      const suggestedTime = slots[0]?.start || "";
      const suggestedTimes = JSON.stringify(slots);

      // 3. Save enrichment to DB
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
        }),
      });

      if (updateRes.ok) {
        const updated = await updateRes.json();
        setIdeas((prev) => prev.map((i) => (i.id === id ? updated : i)));
      }
    } catch {
      /* silent — card still works without enrichment */
    } finally {
      setEnrichingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  // ── Create idea ──────────────────────────────────────────

  async function createIdea() {
    const title = input.trim();
    if (!title) return;
    setInput("");

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
    } catch {
      /* silent */
    }

    inputRef.current?.focus();
  }

  // ── Update idea (debounced) ──────────────────────────────

  function updateIdea(id: string, data: Partial<Idea>) {
    setIdeas((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...data } : i))
    );

    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      try {
        await fetch(`/api/ideas/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch {
        /* silent */
      }
    }, 500);
  }

  // ── Delete idea ──────────────────────────────────────────

  async function deleteIdea(id: string) {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    } catch {
      /* silent */
    }
  }

  // ── Category counts (for sidebar) ───────────────────────

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const idea of ideas) {
      const key = idea.category || "other";
      counts[key] = (counts[key] || 0) + 1;
    }
    // Sort: non-"other" alphabetically, "other" last
    const sortedKeys = Object.keys(counts).sort((a, b) => {
      if (a === "other") return 1;
      if (b === "other") return -1;
      return getCategoryInfo(a).name.localeCompare(getCategoryInfo(b).name);
    });
    return sortedKeys.map((key) => ({
      key,
      ...getCategoryInfo(key),
      count: counts[key],
    }));
  }, [ideas]);

  // ── Filtered ideas ────────────────────────────────────────

  const filteredIdeas = useMemo(() => {
    if (!activeCategory) return ideas;
    return ideas.filter((i) => (i.category || "other") === activeCategory);
  }, [ideas, activeCategory]);

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col bg-stone-50">
      <TopBar
        userName={session?.user?.name}
        userImage={session?.user?.image}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {ideas.length > 0 && (
          <aside className="w-56 shrink-0 border-r border-gray-100 bg-white/60 overflow-y-auto py-4 px-3 hidden sm:block">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
              Categories
            </p>

            <button
              onClick={() => setActiveCategory(null)}
              className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors mb-0.5 ${
                activeCategory === null
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>All</span>
              <span className="text-xs text-gray-400">{ideas.length}</span>
            </button>

            {categoryCounts.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors mb-0.5 ${
                  activeCategory === cat.key
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span>{cat.emoji}</span>
                  <span className="truncate">{cat.name}</span>
                </span>
                <span className="text-xs text-gray-400 ml-2">{cat.count}</span>
              </button>
            ))}
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Input bar + view toggle */}
          <div className="mx-auto w-full max-w-xl px-4 pt-8 pb-4 shrink-0">
            <div className="relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createIdea();
                }}
                placeholder="What do you want to do?"
                className="w-full rounded-xl border border-gray-200 bg-white px-5 py-4 text-[15px] text-gray-900 placeholder-gray-400 shadow-sm outline-none focus:border-gray-300 focus:shadow-md transition-all"
              />
              {input && (
                <button
                  onClick={createIdea}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
                >
                  Add
                </button>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Type an idea and press Enter — roam finds the rest
              </p>
              {ideas.length > 0 && (
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setView("list")}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                      view === "list"
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setView("map")}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                      view === "map"
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Map
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* View content */}
          {view === "map" ? (
            <div className="flex-1">
              <MapView ideas={filteredIdeas} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-xl px-4 pb-8">
                {/* Active category header */}
                {activeCategory && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">{getCategoryInfo(activeCategory).emoji}</span>
                    <h2 className="text-sm font-semibold text-gray-700">
                      {getCategoryInfo(activeCategory).name}
                    </h2>
                    <button
                      onClick={() => setActiveCategory(null)}
                      className="ml-auto text-xs text-gray-400 hover:text-gray-600"
                    >
                      Show all
                    </button>
                  </div>
                )}

                {/* Ideas list */}
                {loading ? (
                  <div className="text-center py-16">
                    <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
                  </div>
                ) : ideas.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-4xl mb-3">🧭</p>
                    <p className="text-sm font-medium text-gray-500">
                      No ideas yet
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Type something above to start planning
                    </p>
                  </div>
                ) : filteredIdeas.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-sm text-gray-400">
                      No ideas in this category
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredIdeas.map((idea) => (
                      <IdeaCard
                        key={idea.id}
                        idea={idea}
                        onDelete={deleteIdea}
                        onUpdate={updateIdea}
                        enriching={enrichingIds.has(idea.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
