"use client";

import {
  APIProvider,
  APILoadingStatus,
  Map,
  AdvancedMarker,
  InfoWindow,
  useApiLoadingStatus,
} from "@vis.gl/react-google-maps";
import { useState } from "react";
import { formatDuration } from "@/lib/duration";
import { getCategoryInfo } from "@/lib/categorize";

interface Idea {
  id: string;
  title: string;
  placeName: string;
  placeAddress: string;
  estimatedMinutes: number;
  suggestedTime: string;
  category: string;
  lat: number | null;
  lng: number | null;
}

interface Props {
  ideas: Idea[];
}

interface MapCanvasProps {
  pins: Idea[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

function MapCanvas({ pins, selectedId, setSelectedId }: MapCanvasProps) {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-500 px-4 text-center">
        Google Maps auth failed. Check that your API key is valid, billing is enabled, Maps
        JavaScript API is enabled, and localhost referrer restrictions allow http://localhost:3000/*
      </div>
    );
  }

  if (status === APILoadingStatus.FAILED) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-500 px-4 text-center">
        Google Maps failed to load. Check your network and browser console for script load errors.
      </div>
    );
  }

  // Center on first pin, or default to NYC
  const center =
    pins.length > 0
      ? { lat: pins[0].lat!, lng: pins[0].lng! }
      : { lat: 40.7128, lng: -74.006 };
  const selected = pins.find((p) => p.id === selectedId);

  // Format suggested time label
  function formatTime(iso: string): string {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const day =
        d.toDateString() === now.toDateString()
          ? "Today"
          : d.toDateString() === tomorrow.toDateString()
            ? "Tomorrow"
            : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return `${day} ${time}`;
    } catch {
      return "";
    }
  }

  return (
    <Map
      defaultCenter={center}
      defaultZoom={12}
      gestureHandling="greedy"
      disableDefaultUI={false}
      mapId="roam-map"
      className="w-full h-full rounded-none"
    >
      {pins.map((idea) => {
        const cat = getCategoryInfo(idea.category || "other");
        return (
          <AdvancedMarker
            key={idea.id}
            position={{ lat: idea.lat!, lng: idea.lng! }}
            onClick={() => setSelectedId(idea.id === selectedId ? null : idea.id)}
            title={idea.title}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-800 shadow-lg text-base cursor-pointer hover:scale-110 transition-transform">
              {cat.emoji}
            </div>
          </AdvancedMarker>
        );
      })}

      {selected && (
        <InfoWindow
          position={{ lat: selected.lat!, lng: selected.lng! }}
          onCloseClick={() => setSelectedId(null)}
          pixelOffset={[0, -36]}
        >
          <div className="max-w-[220px]">
            <p className="font-semibold text-sm text-gray-900 mb-1">
              {selected.title}
            </p>
            {selected.placeName && (
              <p className="text-xs text-gray-500 mb-1">
                {selected.placeName}
              </p>
            )}
            {selected.placeAddress && (
              <p className="text-xs text-gray-400 mb-1">
                {selected.placeAddress}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span>~{formatDuration(selected.estimatedMinutes)}</span>
              {selected.suggestedTime && (
                <span className="text-indigo-600 font-medium">
                  {formatTime(selected.suggestedTime)}
                </span>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </Map>
  );
}

export default function MapView({ ideas }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pins = ideas.filter((i) => i.lat != null && i.lng != null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        Map requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        No locations to show on the map yet
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <MapCanvas pins={pins} selectedId={selectedId} setSelectedId={setSelectedId} />
    </APIProvider>
  );
}
