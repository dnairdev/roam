import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";
import { buildCalendarEventTitle, buildGoogleCalendarLink } from "@/lib/demoMvp";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).userId as string;
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  const body = await req.json();
  const {
    ideaId,
    title,
    startTime,
    durationMinutes = 60,
    location = "",
    notes = "",
  } = body;

  const idea = ideaId
    ? await prisma.idea.findFirst({
        where: { id: ideaId, userId },
        select: {
          title: true,
          placeName: true,
          invitees: true,
        },
      })
    : null;

  const invitees = (() => {
    try {
      return JSON.parse(idea?.invitees || "[]");
    } catch {
      return [];
    }
  })();

  const eventTitle = buildCalendarEventTitle({
    title: idea?.title || title,
    placeName: idea?.placeName || "",
    invitees: Array.isArray(invitees) ? invitees : [],
  });

  if (!startTime || !eventTitle) {
    return NextResponse.json(
      { error: "Missing title or startTime" },
      { status: 400 }
    );
  }

  const fallbackEventLink = buildGoogleCalendarLink({
    title: eventTitle,
    startTime,
    durationMinutes,
    location,
    notes: notes
      ? `${notes}\n\nScheduled via Roam`
      : "Scheduled via Roam",
  });

  if (!account?.access_token) {
    const fallbackEventId = `draft-${ideaId || Date.now()}`;
    if (ideaId) {
      await prisma.idea.updateMany({
        where: { id: ideaId, userId },
        data: { calendarEventId: fallbackEventId },
      });
    }

    return NextResponse.json({
      eventId: fallbackEventId,
      eventLink: fallbackEventLink,
      fallback: true,
    });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  try {
    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: eventTitle,
        location: location || undefined,
        description: notes
          ? `${notes}\n\nScheduled via Roam`
          : "Scheduled via Roam",
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      },
    });

    const eventId = event.data.id || "";
    const eventLink = event.data.htmlLink || "";

    // Persist the calendar event ID on the idea
    if (ideaId) {
      await prisma.idea.updateMany({
        where: { id: ideaId, userId },
        data: { calendarEventId: eventId },
      });
    }

    return NextResponse.json({ eventId, eventLink });
  } catch (err: any) {
    console.error("Calendar event creation failed:", err?.message);
    const fallbackEventId = `draft-${ideaId || Date.now()}`;
    if (ideaId) {
      await prisma.idea.updateMany({
        where: { id: ideaId, userId },
        data: { calendarEventId: fallbackEventId },
      });
    }

    return NextResponse.json({
      eventId: fallbackEventId,
      eventLink: fallbackEventLink,
      fallback: true,
    });
  }
}
