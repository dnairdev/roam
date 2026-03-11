/**
 * Yelp Fusion API integration.
 * Used to find restaurant reservation support and provide Yelp booking links.
 * Requires YELP_API_KEY in environment.
 */

const YELP_BASE = "https://api.yelp.com/v3";

export interface YelpBusiness {
  id: string;
  supportsReservations: boolean;
  reservationUrl: string;
}

function authHeader(): Record<string, string> {
  const key = process.env.YELP_API_KEY;
  if (!key) throw new Error("YELP_API_KEY not set");
  return { Authorization: `Bearer ${key}` };
}

/**
 * Find a Yelp business matching a Google Places result by name + coordinates.
 * Returns null if not found or API key is missing.
 */
export async function findYelpBusiness(
  name: string,
  lat: number | null,
  lng: number | null,
  address: string
): Promise<YelpBusiness | null> {
  if (!process.env.YELP_API_KEY) return null;
  if (!name) return null;

  try {
    // Step 1: Business Match to get the Yelp business ID
    const params = new URLSearchParams({ name, limit: "1" });
    if (lat != null && lng != null) {
      params.set("latitude", String(lat));
      params.set("longitude", String(lng));
    }
    // Try to extract city from address (e.g. "123 Main St, New York, NY 10001, USA")
    const parts = address.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      params.set("address1", parts[0]);
      if (parts.length >= 3) params.set("city", parts[1]);
    }
    params.set("country", "US");

    const matchRes = await fetch(
      `${YELP_BASE}/businesses/matches?${params.toString()}`,
      { headers: authHeader() }
    );

    if (!matchRes.ok) return null;

    const matchData = await matchRes.json();
    const businessId: string | undefined = matchData.businesses?.[0]?.id;
    if (!businessId) return null;

    // Step 2: Fetch business details to check if it supports Yelp reservations
    const detailRes = await fetch(`${YELP_BASE}/businesses/${businessId}`, {
      headers: authHeader(),
    });

    if (!detailRes.ok) return null;

    const detail = await detailRes.json();
    const transactions: string[] = detail.transactions || [];
    const supportsReservations = transactions.includes("restaurant_reservation");

    return {
      id: businessId,
      supportsReservations,
      reservationUrl: `https://www.yelp.com/reservations/${businessId}`,
    };
  } catch {
    return null;
  }
}
