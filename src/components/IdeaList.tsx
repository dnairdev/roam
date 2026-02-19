"use client";

import { useState } from "react";
import type { IdeaData } from "@/types";
import EmptyState from "./EmptyState";

interface Props {
  ideas: IdeaData[];
  selectedIdeaId: string | null;
  onSelectIdea: (id: string) => void;
  onCreateIdea: () => void;
  bucketName: string;
}

export default function IdeaList({
  ideas,
  selectedIdeaId,
  onSelectIdea,
  onCreateIdea,
  bucketName,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? ideas.filter(
        (idea) =>
          idea.title.toLowerCase().includes(query.toLowerCase()) ||
          idea.notes.toLowerCase().includes(query.toLowerCase()) ||
          idea.location.toLowerCase().includes(query.toLowerCase())
      )
    : ideas;

  function parseTags(tags: string): string[] {
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  }

  return (
    <div className="flex h-full w-80 flex-col border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">{bucketName}</h2>
        <button
          onClick={onCreateIdea}
          className="flex h-7 items-center gap-1 rounded-md bg-gray-900 px-2.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ideas..."
            className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-gray-300 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState
            icon="✨"
            title={query ? "No matching ideas" : "No ideas yet"}
            description={
              query
                ? "Try a different search term."
                : "Create your first idea to get started."
            }
            action={
              !query ? (
                <button
                  onClick={onCreateIdea}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 underline"
                >
                  Create idea
                </button>
              ) : undefined
            }
          />
        ) : (
          filtered.map((idea) => {
            const tags = parseTags(idea.tags);
            return (
              <button
                key={idea.id}
                onClick={() => onSelectIdea(idea.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${
                  selectedIdeaId === idea.id
                    ? "bg-indigo-50 border-l-2 border-l-indigo-500"
                    : "hover:bg-gray-50 border-l-2 border-l-transparent"
                }`}
              >
                <p className="text-sm font-medium text-gray-900 truncate">
                  {idea.title || "Untitled idea"}
                </p>
                {idea.notes && (
                  <p className="mt-0.5 text-xs text-gray-500 truncate">
                    {idea.notes}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  {idea.planType === "friends" && (
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      with friends
                    </span>
                  )}
                  {tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {idea.location && (
                    <span className="text-xs text-gray-400">
                      📍 {idea.location}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
