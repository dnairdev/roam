"use client";

import { useState } from "react";
import type { BucketData } from "@/types";

interface Props {
  buckets: BucketData[];
  selectedBucketId: string | null;
  onSelectBucket: (id: string | null) => void;
  onCreateBucket: () => void;
  onRenameBucket: (id: string, name: string) => void;
  onDeleteBucket: (id: string) => void;
  totalIdeas: number;
}

const EMOJI_OPTIONS = ["📁", "🌳", "🏛️", "🍽️", "🎲", "📹", "☕", "🎵", "📚", "✈️", "🏃", "🎨"];

export default function Sidebar({
  buckets,
  selectedBucketId,
  onSelectBucket,
  onCreateBucket,
  onRenameBucket,
  onDeleteBucket,
  totalIdeas,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [contextId, setContextId] = useState<string | null>(null);

  function startEdit(bucket: BucketData) {
    setEditingId(bucket.id);
    setEditValue(bucket.name);
    setContextId(null);
  }

  function commitEdit(id: string) {
    if (editValue.trim()) onRenameBucket(id, editValue.trim());
    setEditingId(null);
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-gray-50/80">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Buckets
        </span>
        <button
          onClick={onCreateBucket}
          className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          title="New bucket"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {/* All Ideas */}
        <button
          onClick={() => onSelectBucket(null)}
          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
            selectedBucketId === null
              ? "bg-white text-gray-900 shadow-sm font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span className="text-base">💡</span>
          <span className="flex-1 text-left">All Ideas</span>
          <span className="text-xs text-gray-400">{totalIdeas}</span>
        </button>

        {/* Bucket list */}
        {buckets.map((bucket) => (
          <div key={bucket.id} className="relative group">
            {editingId === bucket.id ? (
              <div className="flex items-center gap-1 px-3 py-1.5">
                <span className="text-base">{bucket.emoji}</span>
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(bucket.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit(bucket.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  className="flex-1 bg-white border border-gray-300 rounded px-1.5 py-0.5 text-sm outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
            ) : (
              <button
                onClick={() => onSelectBucket(bucket.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextId(contextId === bucket.id ? null : bucket.id);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedBucketId === bucket.id
                    ? "bg-white text-gray-900 shadow-sm font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-base">{bucket.emoji}</span>
                <span className="flex-1 text-left truncate">{bucket.name}</span>
                <span className="text-xs text-gray-400">
                  {bucket._count?.ideas ?? 0}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextId(contextId === bucket.id ? null : bucket.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 ml-1 text-gray-400 hover:text-gray-600"
                >
                  ···
                </span>
              </button>
            )}

            {/* Context menu */}
            {contextId === bucket.id && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setContextId(null)}
                />
                <div className="absolute left-full top-0 z-20 ml-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    onClick={() => startEdit(bucket)}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      onDeleteBucket(bucket.id);
                      setContextId(null);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
