"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { IdeaData, BucketData } from "@/types";

interface Props {
  idea: IdeaData;
  buckets: BucketData[];
  onSave: (id: string, data: Partial<IdeaData>) => void;
  onDelete: (id: string) => void;
  onPlanThis: () => void;
}

export default function IdeaDetail({
  idea,
  buckets,
  onSave,
  onDelete,
  onPlanThis,
}: Props) {
  const [title, setTitle] = useState(idea.title);
  const [notes, setNotes] = useState(idea.notes);
  const [location, setLocation] = useState(idea.location);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [planType, setPlanType] = useState(idea.planType);
  const [savedLink, setSavedLink] = useState(idea.savedLink);
  const [bucketId, setBucketId] = useState(idea.bucketId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ideaIdRef = useRef(idea.id);

  // Sync from props when idea changes
  useEffect(() => {
    ideaIdRef.current = idea.id;
    setTitle(idea.title);
    setNotes(idea.notes);
    setLocation(idea.location);
    try {
      setTags(JSON.parse(idea.tags));
    } catch {
      setTags([]);
    }
    setPlanType(idea.planType);
    setSavedLink(idea.savedLink);
    setBucketId(idea.bucketId);
    setConfirmDelete(false);
  }, [idea.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced auto-save
  const save = useCallback(
    (patch: Partial<IdeaData>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSave(ideaIdRef.current, patch);
      }, 600);
    },
    [onSave]
  );

  function handleTitleChange(v: string) {
    setTitle(v);
    save({ title: v });
  }

  function handleNotesChange(v: string) {
    setNotes(v);
    save({ notes: v });
  }

  function handleLocationChange(v: string) {
    setLocation(v);
    save({ location: v });
  }

  function handleSavedLinkChange(v: string) {
    setSavedLink(v);
    save({ savedLink: v });
  }

  function handleBucketChange(v: string) {
    const val = v || null;
    setBucketId(val);
    onSave(idea.id, { bucketId: val } as any);
  }

  function handlePlanTypeChange(v: string) {
    setPlanType(v as "solo" | "friends");
    onSave(idea.id, { planType: v as "solo" | "friends" });
  }

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setTagInput("");
    onSave(idea.id, { tags: JSON.stringify(next) });
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    onSave(idea.id, { tags: JSON.stringify(next) });
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 space-y-5 p-6">
        {/* Title */}
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Idea title..."
          className="w-full text-xl font-semibold text-gray-900 placeholder-gray-300 outline-none bg-transparent"
        />

        {/* Bucket selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-400 w-16 shrink-0">
            Bucket
          </label>
          <select
            value={bucketId || ""}
            onChange={(e) => handleBucketChange(e.target.value)}
            className="flex-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none focus:border-gray-300"
          >
            <option value="">No bucket</option>
            {buckets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.emoji} {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-400 w-16 shrink-0">
            Location
          </label>
          <input
            value={location}
            onChange={(e) => handleLocationChange(e.target.value)}
            placeholder="Add a place..."
            className="flex-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-gray-300"
          />
        </div>

        {/* Tags */}
        <div className="flex items-start gap-3">
          <label className="text-xs font-medium text-gray-400 w-16 shrink-0 pt-2">
            Tags
          </label>
          <div className="flex flex-1 flex-wrap items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 min-h-[34px]">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              onBlur={() => tagInput && addTag(tagInput)}
              placeholder={tags.length === 0 ? "Add tags..." : ""}
              className="flex-1 min-w-[80px] text-sm outline-none bg-transparent text-gray-700 placeholder-gray-300"
            />
          </div>
        </div>

        {/* Solo / Friends toggle */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-400 w-16 shrink-0">
            Plan
          </label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => handlePlanTypeChange("solo")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                planType === "solo"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              Solo
            </button>
            <button
              onClick={() => handlePlanTypeChange("friends")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 ${
                planType === "friends"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              With friends
            </button>
          </div>
        </div>

        {/* Saved link */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-400 w-16 shrink-0">
            Link
          </label>
          <input
            value={savedLink}
            onChange={(e) => handleSavedLinkChange(e.target.value)}
            placeholder="Paste a saved link (TikTok, IG, etc.)"
            className="flex-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-gray-300"
          />
        </div>

        {/* Notes */}
        <div>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Write notes..."
            rows={8}
            className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-gray-300 resize-none leading-relaxed"
          />
        </div>

        {/* Plan this button */}
        <button
          onClick={onPlanThis}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Plan this
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Updated {new Date(idea.updatedAt).toLocaleDateString()}
        </span>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-600">Delete this idea?</span>
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
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
