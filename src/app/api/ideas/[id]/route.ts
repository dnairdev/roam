import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).userId;
  const idea = await prisma.idea.findFirst({
    where: { id: params.id, userId },
  });

  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(idea);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).userId;
  const body = await req.json();

  const result = await prisma.idea.updateMany({
    where: { id: params.id, userId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.tags !== undefined && { tags: body.tags }),
      ...(body.planType !== undefined && { planType: body.planType }),
      ...(body.savedLink !== undefined && { savedLink: body.savedLink }),
      ...(body.bucketId !== undefined && { bucketId: body.bucketId || null }),
      ...(body.placeName !== undefined && { placeName: body.placeName }),
      ...(body.placeAddress !== undefined && { placeAddress: body.placeAddress }),
      ...(body.placeTypes !== undefined && { placeTypes: body.placeTypes }),
      ...(body.estimatedMinutes !== undefined && { estimatedMinutes: body.estimatedMinutes }),
      ...(body.suggestedTime !== undefined && { suggestedTime: body.suggestedTime }),
      ...(body.suggestedTimes !== undefined && { suggestedTimes: body.suggestedTimes }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.lat !== undefined && { lat: body.lat }),
      ...(body.lng !== undefined && { lng: body.lng }),
      ...(body.covers !== undefined && { covers: body.covers }),
      ...(body.calendarEventId !== undefined && { calendarEventId: body.calendarEventId }),
      ...(body.rating !== undefined && { rating: body.rating }),
      ...(body.openingHours !== undefined && { openingHours: body.openingHours }),
      ...(body.invitees !== undefined && { invitees: body.invitees }),
      ...(body.acceptedBy !== undefined && { acceptedBy: body.acceptedBy }),
      ...(body.taskNotes !== undefined && { taskNotes: body.taskNotes }),
    },
  });

  if (result.count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.idea.findUnique({ where: { id: params.id } });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).userId;
  const result = await prisma.idea.deleteMany({
    where: { id: params.id, userId },
  });

  if (result.count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
