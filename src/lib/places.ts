/**
 * Google Places Text Search integration.
 * Uses the Places API (New) when GOOGLE_MAPS_API_KEY is set.
 * Falls back gracefully without it.
 */

import { findDemoPlace } from "./demoMvp";

/** One open→close period from Google Places regularOpeningHours. */
export interface OpeningPeriod {
  openDay: number;    // 0=Sun … 6=Sat
  openHour: number;
  openMinute: number;
  closeDay: number;
  closeHour: number;
  closeMinute: number;
}

export interface PlaceResult {
  name: string;
  address: string;
  types: string[];
  mapsUrl: string;
  lat: number | null;
  lng: number | null;
  openingPeriods: OpeningPeriod[];
}

const EMPTY: PlaceResult = {
  name: "", address: "", types: [], mapsUrl: "", lat: null, lng: null, openingPeriods: [],
};

async function placesTextSearch(query: string, apiKey: string): Promise<PlaceResult | null> {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.types,places.googleMapsUri,places.location,places.regularOpeningHours",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return null;

    const rawPeriods: OpeningPeriod[] = [];
    for (const p of place.regularOpeningHours?.periods ?? []) {
      if (p.open && p.close) {
        rawPeriods.push({
          openDay: p.open.day ?? 0,
          openHour: p.open.hour ?? 0,
          openMinute: p.open.minute ?? 0,
          closeDay: p.close.day ?? p.open.day ?? 0,
          closeHour: p.close.hour ?? 23,
          closeMinute: p.close.minute ?? 59,
        });
      }
    }

    return {
      name: place.displayName?.text || "",
      address: place.formattedAddress || "",
      types: place.types || [],
      mapsUrl: place.googleMapsUri || mapsUrl,
      lat: place.location?.latitude ?? null,
      lng: place.location?.longitude ?? null,
      openingPeriods: rawPeriods,
    };
  } catch {
    return null;
  }
}

/** Geocode a free-text query → lat/lng using Google Geocoding API. */
async function geocodeFallback(query: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const loc = data.results?.[0]?.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  } catch {
    return null;
  }
}

export async function searchPlace(query: string): Promise<PlaceResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const demoPlace = findDemoPlace(query);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  if (!apiKey) return demoPlace ? { ...demoPlace } : { ...EMPTY, mapsUrl };

  // 1. Try full query
  let result = await placesTextSearch(query, apiKey);

  // 2. Retry with simplified query (first 4 words) if no result
  if (!result) {
    const simplified = query.split(/\s+/).slice(0, 4).join(" ");
    if (simplified !== query) result = await placesTextSearch(simplified, apiKey);
  }

  // 3. If we have a result but no lat/lng, geocode to fill it in
  if (result && (result.lat === null || result.lng === null)) {
    const geo = await geocodeFallback(result.address || query, apiKey);
    if (geo) { result.lat = geo.lat; result.lng = geo.lng; }
  }

  // 4. If still no result, use geocoding to get at least a location pin
  if (!result) {
    const geo = await geocodeFallback(query, apiKey);
    if (geo) {
      return { ...EMPTY, mapsUrl, lat: geo.lat, lng: geo.lng };
    }
    return demoPlace ? { ...demoPlace } : { ...EMPTY, mapsUrl };
  }

  return result;
}
