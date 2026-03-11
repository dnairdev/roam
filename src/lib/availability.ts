import type { BusyBlock, SlotSuggestion } from "@/types";
import type { OpeningPeriod } from "./places";

interface SuggestOptions {
  userBusy: BusyBlock[];
  friendsBusy: BusyBlock[][]; // one array per friend
  duration: number; // minutes
  preference: "any" | "weekend" | "weekday" | "morning" | "afternoon" | "evening";
  openingPeriods?: OpeningPeriod[]; // restaurant/venue hours — filter slots to open times
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function fmt(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/**
 * Returns true if the slot [start, end) falls within any of the venue's opening periods.
 * When no periods are provided, every slot is considered valid.
 */
function withinOpeningHours(
  start: Date,
  end: Date,
  periods: OpeningPeriod[]
): boolean {
  if (periods.length === 0) return true;

  const slotDay = start.getDay();
  const slotStart = start.getHours() * 60 + start.getMinutes();
  const slotEnd = end.getHours() * 60 + end.getMinutes();

  return periods.some((p) => {
    if (p.openDay !== slotDay) return false;

    const openMin = p.openHour * 60 + p.openMinute;
    let closeMin = p.closeHour * 60 + p.closeMinute;

    // Handle overnight periods (e.g. open Mon close Tue 02:00)
    if (p.closeDay !== p.openDay) closeMin += 24 * 60;

    // The slot must start at or after open, and end at or before close
    return slotStart >= openMin && slotEnd <= closeMin;
  });
}

/**
 * Suggest up to 5 free time slots over the next 7 days that:
 *  - avoid all busy blocks
 *  - fall within the venue's opening hours (if provided)
 *  - match the user's scheduling preference
 */
export function suggestSlots(opts: SuggestOptions): SlotSuggestion[] {
  const { userBusy, friendsBusy, duration, preference, openingPeriods = [] } = opts;

  const allBusy = [
    ...userBusy,
    ...friendsBusy.flat(),
  ].map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }));

  const now = Date.now();
  const candidates: SlotSuggestion[] = [];

  // Hard time-of-day windows for meal/activity preferences
  const timeWindow: { minHour: number; maxHour: number } = (() => {
    switch (preference) {
      case "morning":   return { minHour: 7,  maxHour: 12 };
      case "afternoon": return { minHour: 12, maxHour: 17 };
      case "evening":   return { minHour: 17, maxHour: 23 };
      default:          return { minHour: 7,  maxHour: 23 };
    }
  })();

  // Scan next 7 days, 30-min increments, within the preference window
  for (let day = 0; day < 7; day++) {
    const base = new Date(now);
    base.setDate(base.getDate() + day);
    base.setHours(timeWindow.minHour, 0, 0, 0);

    const windowMinutes = (timeWindow.maxHour - timeWindow.minHour) * 60;

    for (let m = 0; m <= windowMinutes - duration; m += 30) {
      const start = new Date(base.getTime() + m * 60_000);
      if (start.getTime() < now) continue;

      const end = new Date(start.getTime() + duration * 60_000);
      if (end.getHours() > timeWindow.maxHour) continue;

      // Skip if outside the venue's opening hours
      if (!withinOpeningHours(start, end, openingPeriods)) continue;

      // Skip if conflicts with a busy block
      const sMs = start.getTime();
      const eMs = end.getTime();
      const conflict = allBusy.some((b) => sMs < b.end && eMs > b.start);
      if (conflict) continue;

      // ── Score based on preference ──────────────────────
      const dow = start.getDay();
      const hour = start.getHours();
      const isWeekend = dow === 0 || dow === 6;

      let score = 50;
      switch (preference) {
        case "weekend":
          score += isWeekend ? 30 : 0;
          break;
        case "weekday":
          score += !isWeekend ? 30 : 0;
          break;
      }

      // Slight bias toward sooner slots
      score -= day * 3;

      // Prefer sweet spots within the window
      if (hour >= 10 && hour <= 12) score += 5;
      if (hour >= 12 && hour <= 14) score += 5;
      if (hour >= 17 && hour <= 19) score += 5;

      const dayName = DAY_NAMES[dow];
      const hasFriends = friendsBusy.length > 0;
      const reason = hasFriends
        ? `Everyone's free ${dayName} ${fmt(start)}–${fmt(end)}`
        : `You're free ${dayName} ${fmt(start)}–${fmt(end)}`;

      candidates.push({
        start: start.toISOString(),
        end: end.toISOString(),
        score,
        reason,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 5);
}
