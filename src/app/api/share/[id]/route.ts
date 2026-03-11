import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const idea = await prisma.idea.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      placeName: true,
      placeAddress: true,
      estimatedMinutes: true,
      suggestedTime: true,
      category: true,
      lat: true,
      lng: true,
      covers: true,
      planType: true,
      notes: true,
      user: { select: { name: true } },
    },
  });

  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(idea);
}
