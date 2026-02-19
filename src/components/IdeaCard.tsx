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
}

interface Props {
  idea: Idea;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Idea>) => void;
  enriching?: boolean;
}

export default function IdeaCard({ idea, onDelete, onUpdate, enriching }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);

  const mapsQuery = encodeURIComponent(idea.placeName || idea.title);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  // Parse all suggested time slots
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

      return `${dayStr} ${timeStr}`;
    } catch {
      return "";
    }
  }

  const suggestedLabel = idea.suggestedTime ? formatSlotLabel(idea.suggestedTime) : "";

  let alternativeSlots: { start: string; label: string }[] = [];
  try {
    const parsed = JSON.parse(idea.suggestedTimes || "[]");
    alternativeSlots = parsed
      .slice(0, 5)
      .map((s: any) => ({ start: s.start, label: formatSlotLabel(s.start) }))
      .filter((s: any) => s.label);
  } catch {
    alternativeSlots = [];
  }

  return (
    <div
      className={`group rounded-xl border transition-all duration-200 ${
        expanded
          ? "border-gray-300 shadow-md bg-white"
          : "border-gray-100 shadow-sm bg-white hover:border-gray-200 hover:shadow"
      }`}
    >
      {/* Compact view — always visible */}
      <div className="relative">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left px-5 py-4"
        >
          <p className="text-[15px] font-medium text-gray-900 pr-6">
            {idea.title || "Untitled"}
          </p>

        {enriching ? (
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-gray-400 animate-pulse">
              Finding location and time...
            </span>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            {(idea.placeName || idea.placeAddress) && (
              <span className="flex items-center gap-1">
                <span className="text-gray-400">📍</span>
                {idea.placeName || idea.placeAddress}
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="text-gray-400">⏱</span>
              ~{formatDuration(idea.estimatedMinutes)}
            </span>
            {suggestedLabel && (
              <span className="flex items-center gap-1 text-indigo-600 font-medium">
                <span>📅</span>
                {suggestedLabel}
              </span>
            )}
          </div>
        )}
      </button>

        {/* Delete button — visible on hover */}
        {!confirmDelete ? (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            className="absolute right-3 top-4 p-1 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
            aria-label="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <div
            className="absolute right-3 top-3.5 flex items-center gap-1.5 bg-white rounded-lg border border-gray-200 px-2 py-1 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs text-red-500">Delete?</span>
            <button
              onClick={() => onDelete(idea.id)}
              className="text-xs font-medium text-red-600 hover:text-red-700"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              No
            </button>
          </div>
        )}
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          {/* Location detail */}
          {(idea.placeName || idea.placeAddress) && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Location</p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-700 underline decoration-indigo-200"
              >
                {idea.placeName && (
                  <span className="font-medium">{idea.placeName}</span>
                )}
                {idea.placeName && idea.placeAddress && " · "}
                {idea.placeAddress && (
                  <span className="text-gray-500 no-underline">
                    {idea.placeAddress}
                  </span>
                )}
              </a>
            </div>
          )}

          {/* Duration */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1.5">Duration</p>
            <div className="flex gap-1.5">
              {[30, 60, 90, 120, 150, 180].map((m) => (
                <button
                  key={m}
                  onClick={() => onUpdate(idea.id, { estimatedMinutes: m })}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    idea.estimatedMinutes === m
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {formatDuration(m)}
                </button>
              ))}
            </div>
          </div>

          {/* Suggested times */}
          {alternativeSlots.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5">
                Suggested times
              </p>
              <div className="flex flex-wrap gap-1.5">
                {alternativeSlots.map((slot) => (
                  <button
                    key={slot.start}
                    onClick={() => onUpdate(idea.id, { suggestedTime: slot.start })}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      idea.suggestedTime === slot.start
                        ? "bg-indigo-600 text-white"
                        : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Based on your Google Calendar availability
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1">Notes</p>
            {editingNotes ? (
              <textarea
                value={idea.notes}
                onChange={(e) => onUpdate(idea.id, { notes: e.target.value })}
                onBlur={() => setEditingNotes(false)}
                autoFocus
                rows={3}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-300 resize-none"
                placeholder="Add a note..."
              />
            ) : (
              <button
                onClick={() => setEditingNotes(true)}
                className="text-sm text-gray-500 hover:text-gray-700 w-full text-left"
              >
                {idea.notes || "Add a note..."}
              </button>
            )}
          </div>

          {/* Saved link */}
          {idea.savedLink && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">
                Saved link
              </p>
              <a
                href={idea.savedLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-700 truncate block"
              >
                {idea.savedLink}
              </a>
            </div>
          )}

          {/* Plan type */}
          <div className="pt-2 border-t border-gray-50">
            <span className="text-xs text-gray-300">
              {idea.planType === "friends" ? "With friends" : "Solo"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
