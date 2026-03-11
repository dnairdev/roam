import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchPlace } from "@/lib/places";
import { estimateDuration } from "@/lib/duration";
import { categorize } from "@/lib/categorize";
import { findYelpBusiness } from "@/lib/yelp";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const query = req.nextUrl.searchParams.get("q");
  if (!query)
    return NextResponse.json({ error: "Missing query" }, { status: 400 });

  const place = await searchPlace(query);
  const types = place?.types || [];
  const minutes = estimateDuration(query, types);
  const category = categorize(query, types);

  // For food/drink, look up Yelp business to get reservation support info
  let yelpBusiness = null;
  if (category === "food-drink" && place?.name) {
    yelpBusiness = await findYelpBusiness(
      place.name,
      place.lat,
      place.lng,
      place.address
    );
  }

  return NextResponse.json({
    place,
    estimatedMinutes: minutes,
    category,
    yelpBusinessId: yelpBusiness?.id || null,
    yelpSupportsReservations: yelpBusiness?.supportsReservations || false,
    yelpReservationUrl: yelpBusiness?.reservationUrl || null,
  });
}
