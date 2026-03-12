export type DemoCategory =
  | "food-drink"
  | "arts-culture"
  | "outdoors"
  | "fitness"
  | "shopping"
  | "entertainment"
  | "nightlife"
  | "learning"
  | "travel"
  | "social"
  | "other";

export type DemoPreference =
  | "morning"
  | "afternoon"
  | "evening"
  | "weekend"
  | "any";

export interface DemoInterpretation {
  searchQuery: string;
  refinedTitle: string;
  category: DemoCategory;
  preference: DemoPreference;
  estimatedMinutes: number;
  invitees: string[];
  specificDatetime: string | null;
  taskAssignments: string | null;
}

export interface DemoPlaceResult {
  name: string;
  address: string;
  types: string[];
  mapsUrl: string;
  lat: number | null;
  lng: number | null;
  openingPeriods: {
    openDay: number;
    openHour: number;
    openMinute: number;
    closeDay: number;
    closeHour: number;
    closeMinute: number;
  }[];
}

const DEMO_CONTACTS = ["Tyler", "Diya", "Mia", "Stanley", "Daniel", "Arleen"];

const DEMO_FIXTURES: Array<{
  match: RegExp;
  interpretation: Omit<DemoInterpretation, "invitees" | "specificDatetime" | "taskAssignments">;
  place: DemoPlaceResult;
}> = [
  {
    match: /\b(the )?met\b|metropolitan museum/i,
    interpretation: {
      searchQuery: "The Metropolitan Museum of Art New York",
      refinedTitle: "Visit the MET",
      category: "arts-culture",
      preference: "afternoon",
      estimatedMinutes: 150,
    },
    place: {
      name: "The Metropolitan Museum of Art",
      address: "1000 5th Ave, New York, NY 10028",
      types: ["museum", "tourist_attraction", "art_gallery"],
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=The%20Metropolitan%20Museum%20of%20Art%20New%20York",
      lat: 40.7794,
      lng: -73.9632,
      openingPeriods: [
        { openDay: 0, openHour: 10, openMinute: 0, closeDay: 0, closeHour: 17, closeMinute: 0 },
        { openDay: 1, openHour: 10, openMinute: 0, closeDay: 1, closeHour: 17, closeMinute: 0 },
        { openDay: 2, openHour: 10, openMinute: 0, closeDay: 2, closeHour: 17, closeMinute: 0 },
        { openDay: 3, openHour: 10, openMinute: 0, closeDay: 3, closeHour: 17, closeMinute: 0 },
        { openDay: 4, openHour: 10, openMinute: 0, closeDay: 4, closeHour: 21, closeMinute: 0 },
        { openDay: 5, openHour: 10, openMinute: 0, closeDay: 5, closeHour: 21, closeMinute: 0 },
        { openDay: 6, openHour: 10, openMinute: 0, closeDay: 6, closeHour: 21, closeMinute: 0 },
      ],
    },
  },
  {
    match: /tiki chick|cocktail bar|drinks/i,
    interpretation: {
      searchQuery: "Tiki Chick New York",
      refinedTitle: "Drinks at Tiki Chick",
      category: "nightlife",
      preference: "evening",
      estimatedMinutes: 120,
    },
    place: {
      name: "Tiki Chick",
      address: "517 Amsterdam Ave, New York, NY 10024",
      types: ["bar", "restaurant"],
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tiki%20Chick%20New%20York",
      lat: 40.7865,
      lng: -73.9751,
      openingPeriods: [
        { openDay: 0, openHour: 12, openMinute: 0, closeDay: 0, closeHour: 23, closeMinute: 0 },
        { openDay: 1, openHour: 16, openMinute: 0, closeDay: 1, closeHour: 23, closeMinute: 0 },
        { openDay: 2, openHour: 16, openMinute: 0, closeDay: 2, closeHour: 23, closeMinute: 0 },
        { openDay: 3, openHour: 16, openMinute: 0, closeDay: 3, closeHour: 23, closeMinute: 0 },
        { openDay: 4, openHour: 16, openMinute: 0, closeDay: 4, closeHour: 0, closeMinute: 0 },
        { openDay: 5, openHour: 16, openMinute: 0, closeDay: 5, closeHour: 1, closeMinute: 0 },
        { openDay: 6, openHour: 12, openMinute: 0, closeDay: 6, closeHour: 1, closeMinute: 0 },
      ],
    },
  },
  {
    match: /jazz|village vanguard/i,
    interpretation: {
      searchQuery: "Village Vanguard New York",
      refinedTitle: "Jazz at Village Vanguard",
      category: "arts-culture",
      preference: "evening",
      estimatedMinutes: 120,
    },
    place: {
      name: "Village Vanguard",
      address: "178 7th Ave S, New York, NY 10014",
      types: ["live_music_venue", "bar"],
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Village%20Vanguard%20New%20York",
      lat: 40.7361,
      lng: -74.0009,
      openingPeriods: [
        { openDay: 0, openHour: 17, openMinute: 0, closeDay: 0, closeHour: 23, closeMinute: 30 },
        { openDay: 1, openHour: 17, openMinute: 0, closeDay: 1, closeHour: 23, closeMinute: 30 },
        { openDay: 2, openHour: 17, openMinute: 0, closeDay: 2, closeHour: 23, closeMinute: 30 },
        { openDay: 3, openHour: 17, openMinute: 0, closeDay: 3, closeHour: 23, closeMinute: 30 },
        { openDay: 4, openHour: 17, openMinute: 0, closeDay: 4, closeHour: 23, closeMinute: 30 },
        { openDay: 5, openHour: 17, openMinute: 0, closeDay: 5, closeHour: 23, closeMinute: 30 },
        { openDay: 6, openHour: 17, openMinute: 0, closeDay: 6, closeHour: 23, closeMinute: 30 },
      ],
    },
  },
];

function titleCase(raw: string): string {
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeSpaces(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function extractInvitees(raw: string): string[] {
  const seen = new Set<string>();
  const regex = /@([a-z][a-z'-]*)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    const captured = match[1];
    const found = DEMO_CONTACTS.find(
      (contact) => contact.toLowerCase() === captured.toLowerCase()
    );
    const name = found ?? titleCase(captured);
    seen.add(name);
  }
  return Array.from(seen);
}

function extractTaskAssignments(raw: string, invitees: string[]): string | null {
  const tasks: string[] = [];

  for (const invitee of invitees) {
    const regex = new RegExp(`@${invitee}\\s+([^@.,;!?]+)`, "i");
    const match = raw.match(regex);
    if (!match) continue;

    let task = normalizeSpaces(match[1]);
    task = task.replace(/\b(with|and)\b.*$/i, "").trim();
    if (!task) continue;
    tasks.push(`${invitee}: ${task}`);
  }

  return tasks.length > 0 ? tasks.join("; ") : null;
}

function parseTimeToken(token: string): { hour: number; minute: number } | null {
  const normalized = token.trim().toLowerCase();
  if (normalized === "noon") return { hour: 12, minute: 0 };
  if (normalized === "midnight") return { hour: 0, minute: 0 };

  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const meridiem = match[3];

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (!meridiem && hour <= 7) hour += 12;

  return { hour, minute };
}

function weekdayIndex(label: string): number {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days.indexOf(label.toLowerCase());
}

function extractSpecificDatetime(raw: string): string | null {
  const now = new Date();
  const lower = raw.toLowerCase();

  const timeOnDate = raw.match(
    /\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)|noon|midnight)\s+on\s+(\d{1,2})\/(\d{1,2})\b/i
  );
  if (timeOnDate) {
    const time = parseTimeToken(timeOnDate[1]);
    const month = Number(timeOnDate[2]);
    const day = Number(timeOnDate[3]);
    if (time) {
      const date = new Date(2026, month - 1, day, time.hour, time.minute, 0, 0);
      return date.toISOString();
    }
  }

  const dateAtTime =
    raw.match(
      /\bon\s+(\d{1,2})\/(\d{1,2})\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)|noon|midnight)\b/i
    ) ??
    raw.match(
      /\b(\d{1,2})\/(\d{1,2})\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)|noon|midnight)\b/i
    );

  if (dateAtTime) {
    const month = Number(dateAtTime[1]);
    const day = Number(dateAtTime[2]);
    const time = parseTimeToken(dateAtTime[3]);
    if (time) {
      const date = new Date(2026, month - 1, day, time.hour, time.minute, 0, 0);
      return date.toISOString();
    }
  }

  const weekdayMatch = lower.match(
    /\b(?:next\s+|this\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:\s+at\s+|\s+)(\d{1,2}(?::\d{2})?\s*(?:am|pm)|noon|midnight)\b/
  );
  if (weekdayMatch) {
    const targetDay = weekdayIndex(weekdayMatch[1]);
    const time = parseTimeToken(weekdayMatch[2]);
    if (targetDay >= 0 && time) {
      const date = new Date(now);
      let offset = (targetDay - now.getDay() + 7) % 7;
      if (offset === 0) offset = 7;
      date.setDate(now.getDate() + offset);
      date.setHours(time.hour, time.minute, 0, 0);
      return date.toISOString();
    }
  }

  const tomorrowMatch = lower.match(
    /\btomorrow(?:\s+at\s+|\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)|noon|midnight)\b/
  );
  if (tomorrowMatch) {
    const time = parseTimeToken(tomorrowMatch[1]);
    if (time) {
      const date = new Date(now);
      date.setDate(now.getDate() + 1);
      date.setHours(time.hour, time.minute, 0, 0);
      return date.toISOString();
    }
  }

  return null;
}

function stripDirectiveText(raw: string): string {
  return normalizeSpaces(
    raw
      .replace(/@[a-z][a-z'-]*/gi, "")
      .replace(/\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\s+on\s+\d{1,2}\/\d{1,2}\b/gi, "")
      .replace(/\bon\s+\d{1,2}\/\d{1,2}\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, "")
      .replace(/\b\d{1,2}\/\d{1,2}\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, "")
      .replace(/\btomorrow(?:\s+at\s+|\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, "")
      .replace(/\b(?:next\s+|this\s+)?(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:\s+at\s+|\s+)\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, "")
      .replace(/\b(?:and|with)\b\s*$/i, "")
  );
}

function inferCategory(text: string): DemoCategory {
  if (/\b(museum|gallery|met|concert|jazz|show)\b/i.test(text)) return "arts-culture";
  if (/\b(drink|cocktail|bar|wine|night)\b/i.test(text)) return "nightlife";
  if (/\b(dinner|lunch|brunch|restaurant|food|coffee)\b/i.test(text)) return "food-drink";
  if (/\b(park|hike|garden|beach)\b/i.test(text)) return "outdoors";
  if (/\b(class|workshop|learn|lecture)\b/i.test(text)) return "learning";
  return "social";
}

function inferPreference(text: string, specificDatetime: string | null): DemoPreference {
  if (specificDatetime) {
    const hour = new Date(specificDatetime).getHours();
    if (hour >= 17) return "evening";
    if (hour >= 12) return "afternoon";
    return "morning";
  }
  if (/\bweekend|saturday|sunday\b/i.test(text)) return "weekend";
  if (/\bnight|drinks|dinner|show|concert|jazz\b/i.test(text)) return "evening";
  if (/\bbrunch|coffee|breakfast\b/i.test(text)) return "morning";
  return "any";
}

function inferDuration(text: string, category: DemoCategory): number {
  if (/\bmet|museum|concert|jazz|show\b/i.test(text)) return 120;
  if (/\bdrinks|cocktail|bar\b/i.test(text)) return 120;
  if (/\bdinner|restaurant|brunch\b/i.test(text)) return 90;
  if (category === "outdoors") return 180;
  return 90;
}

export function interpretMvpInput(raw: string): DemoInterpretation {
  const invitees = extractInvitees(raw);
  const taskAssignments = extractTaskAssignments(raw, invitees);
  const specificDatetime = extractSpecificDatetime(raw);
  const fixture = DEMO_FIXTURES.find((candidate) => candidate.match.test(raw));

  if (fixture) {
    return {
      ...fixture.interpretation,
      invitees,
      specificDatetime,
      taskAssignments,
      preference:
        specificDatetime != null
          ? inferPreference(raw, specificDatetime)
          : fixture.interpretation.preference,
    };
  }

  const cleanedTitle = stripDirectiveText(raw) || "Make plans";
  const category = inferCategory(cleanedTitle);

  return {
    searchQuery: cleanedTitle,
    refinedTitle: titleCase(cleanedTitle),
    category,
    preference: inferPreference(raw, specificDatetime),
    estimatedMinutes: inferDuration(cleanedTitle, category),
    invitees,
    specificDatetime,
    taskAssignments,
  };
}

export function findDemoPlace(query: string): DemoPlaceResult | null {
  const fixture = DEMO_FIXTURES.find((candidate) => candidate.match.test(query));
  return fixture?.place ?? null;
}

function formatCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildGoogleCalendarLink(input: {
  title: string;
  startTime: string;
  durationMinutes?: number;
  location?: string;
  notes?: string;
}): string {
  const start = new Date(input.startTime);
  const end = new Date(start.getTime() + (input.durationMinutes ?? 60) * 60_000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${formatCalendarDate(start)}/${formatCalendarDate(end)}`,
  });

  if (input.location) params.set("location", input.location);
  if (input.notes) params.set("details", input.notes);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
