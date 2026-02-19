import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchPlace } from "@/lib/places";
import { estimateDuration } from "@/lib/duration";
import { categorize } from "@/lib/categorize";

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

  return NextResponse.json({
    place,
    estimatedMinutes: minutes,
    category,
  });
}
