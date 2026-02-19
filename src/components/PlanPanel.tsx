"use client";

import { useState } from "react";
import type { IdeaData, SlotSuggestion } from "@/types";

interface Props {
  idea: IdeaData;
  onClose: () => void;
}

const DURATIONS = [30, 60, 90, 120] as const;
const PREFS = [
  { value: "any", label: "Any time" },
  { value: "weekend", label: "Weekend" },
  { value: "weekday", label: "Weekday" },
  { value: "evening", label: "Evenings" },
] as const;

export default function PlanPanel({ idea, onClose }: Props) {
  const [duration, setDuration] = useState<number>(60);
  const [preference, setPreference] = useState<string>("any");
  const [friendEmails, setFriendEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [slots, setSlots] = useState<SlotSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  function addEmail() {
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes("@") || friendEmails.includes(email)) return;
    setFriendEmails([...friendEmails, email]);
    setEmailInput("");
  }

  function removeEmail(email: string) {
    setFriendEmails(friendEmails.filter((e) => e !== email));
  }

  async function findSlots() {
    setLoading(true);
    setError(null);
    setFetched(true);

    try {
      const res = await fetch("/api/calendar/suggest-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration,
          preference,
          friendEmails: idea.planType === "friends" ? friendEmails : [],
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch slots");

      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setError("Could not fetch suggestions. Try again.");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  function formatSlot(slot: SlotSuggestion) {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    const day = start.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const startTime = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const endTime = end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return { day, time: `${startTime} – ${endTime}` };
  }

  return (
    <div className="flex h-full flex-col bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Plan it</h3>
          <p className="text-xs text-gray-500 truncate max-w-[240px]">
            {idea.title}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Duration */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">
            Duration
          </label>
          <div className="flex gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  duration === d
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Preference */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">
            Preference
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {PREFS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPreference(p.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  preference === p.value
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Friends input (conditional) */}
        {idea.planType === "friends" && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Friends
            </label>
            <div className="space-y-2">
              {friendEmails.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between rounded-md bg-white border border-gray-200 px-3 py-1.5"
                >
                  <span className="text-sm text-gray-700">{email}</span>
                  <button
                    onClick={() => removeEmail(email)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEmail();
                    }
                  }}
                  placeholder="friend@email.com"
                  className="flex-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-gray-300"
                />
                <button
                  onClick={addEmail}
                  className="rounded-md bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Friend availability is simulated for this prototype.
              </p>
            </div>
          </div>
        )}

        {/* Find times button */}
        <button
          onClick={findSlots}
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? "Finding times..." : "Find times"}
        </button>

        {/* Results */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {fetched && !loading && !error && slots.length === 0 && (
          <div className="rounded-lg bg-gray-100 p-4 text-center">
            <p className="text-sm text-gray-500">
              No available slots found for these criteria.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting the duration or preference.
            </p>
          </div>
        )}

        {slots.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 block">
              Suggested times
            </label>
            {slots.map((slot, i) => {
              const { day, time } = formatSlot(slot);
              return (
                <div
                  key={i}
                  className="rounded-lg bg-white border border-gray-200 p-3 hover:border-indigo-300 hover:shadow-sm transition-all cursor-default"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {day}
                    </span>
                    <span className="text-sm text-indigo-600 font-medium">
                      {time}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{slot.reason}</p>
                </div>
              );
            })}
            <p className="text-xs text-gray-400 text-center pt-2">
              Event creation coming in v2.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
