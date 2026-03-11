import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserBusyBlocks, getFriendAvailabilityProvider } from "@/lib/calendar";
import { suggestSlots } from "@/lib/availability";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).userId as string;
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  const accessToken = account?.access_token;
  const body = await req.json();
  const {
    duration = 60,
    preference = "any",
    friendEmails = [],
    excludeIdeaId = "",
    openingPeriods = [],
    yelpReservationUrl = null as string | null,
    yelpSupportsReservations = false,
  } = body;

  // Fetch user's busy blocks (real Google Calendar data)
  let userBusy = accessToken ? await getUserBusyBlocks(accessToken) : [];

  // Include already-scheduled roam ideas as busy blocks to avoid overlaps
  const scheduledIdeas = await prisma.idea.findMany({
    where: {
      userId,
      suggestedTime: { not: "" },
      ...(excludeIdeaId ? { id: { not: excludeIdeaId } } : {}),
    },
    select: { suggestedTime: true, estimatedMinutes: true },
  });

  const ideaBusy = scheduledIdeas.map((idea) => {
    const start = new Date(idea.suggestedTime);
    const end = new Date(start.getTime() + idea.estimatedMinutes * 60_000);
    return { start: start.toISOString(), end: end.toISOString() };
  });

  userBusy = [...userBusy, ...ideaBusy];

  // Fetch friends' busy blocks (mock provider for v1)
  const provider = getFriendAvailabilityProvider();
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const friendsBusy = await Promise.all(
    friendEmails.map((email: string) =>
      provider.getBusyBlocks(email, now, nextWeek)
    )
  );

  let slots = suggestSlots({ userBusy, friendsBusy, duration, preference, openingPeriods });

  // Annotate slots with Yelp reservation info if available
  if (yelpSupportsReservations && yelpReservationUrl) {
    slots = slots.map((slot) => ({
      ...slot,
      yelpAvailable: true,
      yelpUrl: yelpReservationUrl,
    }));
  }

  return NextResponse.json({ slots });
}
