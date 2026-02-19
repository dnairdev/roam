/**
 * Google Places Text Search integration.
 * Uses the Places API (New) when GOOGLE_MAPS_API_KEY is set.
 * Falls back gracefully without it.
 */

export interface PlaceResult {
  name: string;
  address: string;
  types: string[];
  mapsUrl: string;
  lat: number | null;
  lng: number | null;
}

export async function searchPlace(query: string): Promise<PlaceResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Always generate a maps URL regardless of API availability
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  if (!apiKey) {
    return { name: "", address: "", types: [], mapsUrl, lat: null, lng: null };
  }

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.types,places.googleMapsUri,places.location",
        },
        body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
      }
    );

    if (!res.ok) return { name: "", address: "", types: [], mapsUrl, lat: null, lng: null };

    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return { name: "", address: "", types: [], mapsUrl, lat: null, lng: null };

    return {
      name: place.displayName?.text || "",
      address: place.formattedAddress || "",
      types: place.types || [],
      mapsUrl: place.googleMapsUri || mapsUrl,
      lat: place.location?.latitude ?? null,
      lng: place.location?.longitude ?? null,
    };
  } catch {
    return { name: "", address: "", types: [], mapsUrl, lat: null, lng: null };
  }
}
