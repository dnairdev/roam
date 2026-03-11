/**
 * Google Places Text Search integration.
 * Uses the Places API (New) when GOOGLE_MAPS_API_KEY is set.
 * Falls back gracefully without it.
 */

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

export async function searchPlace(query: string): Promise<PlaceResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  if (!apiKey) return { ...EMPTY, mapsUrl };

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.types,places.googleMapsUri,places.location,places.regularOpeningHours",
        },
        body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
      }
    );

    if (!res.ok) return { ...EMPTY, mapsUrl };

    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return { ...EMPTY, mapsUrl };

    // Parse opening hours periods
    const rawPeriods: OpeningPeriod[] = [];
    const periods = place.regularOpeningHours?.periods ?? [];
    for (const p of periods) {
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
    return { ...EMPTY, mapsUrl };
  }
}
