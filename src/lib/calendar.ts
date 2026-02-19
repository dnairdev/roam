import { google } from "googleapis";
import type { BusyBlock, AvailabilityProvider } from "@/types";

// ── Real Google Calendar provider ────────────────────────────

export async function getUserBusyBlocks(
  accessToken: string
): Promise<BusyBlock[]> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: nextWeek.toISOString(),
        items: [{ id: "primary" }],
      },
    });

    const busy = response.data.calendars?.["primary"]?.busy || [];
    return busy.map((b) => ({
      start: b.start!,
      end: b.end!,
    }));
  } catch {
    console.error("Failed to fetch Google Calendar busy blocks");
    return [];
  }
}

// ── Mock availability provider (for friend calendars) ────────

export class MockAvailabilityProvider implements AvailabilityProvider {
  async getBusyBlocks(
    email: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<BusyBlock[]> {
    // Deterministic seed from email so the same email gives consistent results
    let seed = 0;
    for (let i = 0; i < email.length; i++) seed += email.charCodeAt(i);

    const blocks: BusyBlock[] = [];
    const days = Math.ceil(
      (timeMax.getTime() - timeMin.getTime()) / (1000 * 60 * 60 * 24)
    );

    for (let d = 0; d < days; d++) {
      const date = new Date(timeMin);
      date.setDate(date.getDate() + d);

      // Generate 2-4 busy blocks per day based on seed
      const count = 2 + ((seed + d) % 3);
      for (let i = 0; i < count; i++) {
        const startHour = 8 + (((seed * (d + 1) * (i + 1)) % 11) | 0);
        const duration = 1 + ((seed * (i + 1)) % 2);
        const start = new Date(date);
        start.setHours(startHour, 0, 0, 0);
        const end = new Date(start);
        end.setHours(end.getHours() + duration);

        blocks.push({ start: start.toISOString(), end: end.toISOString() });
      }
    }

    return blocks;
  }
}

// ── Factory ──────────────────────────────────────────────────

export function getFriendAvailabilityProvider(): AvailabilityProvider {
  // Swap this out for a real Google Calendar FreeBusy implementation
  // once friends share calendars or grant access.
  return new MockAvailabilityProvider();
}
