import type { BusyBlock, SlotSuggestion } from "@/types";

interface SuggestOptions {
  userBusy: BusyBlock[];
  friendsBusy: BusyBlock[][]; // one array per friend
  duration: number; // minutes
  preference: "any" | "weekend" | "weekday" | "evening";
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
 * Suggest 3-5 free time slots over the next 7 days that avoid all busy blocks
 * and match the user's scheduling preference.
 */
export function suggestSlots(opts: SuggestOptions): SlotSuggestion[] {
  const { userBusy, friendsBusy, duration, preference } = opts;

  const allBusy = [
    ...userBusy,
    ...friendsBusy.flat(),
  ].map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }));

  const now = Date.now();
  const candidates: SlotSuggestion[] = [];

  // Scan next 7 days, 30-min increments, 8 AM – 10 PM window
  for (let day = 0; day < 7; day++) {
    const base = new Date(now);
    base.setDate(base.getDate() + day);
    base.setHours(8, 0, 0, 0);

    for (let m = 0; m <= (14 * 60 - duration); m += 30) {
      const start = new Date(base.getTime() + m * 60_000);
      if (start.getTime() < now) continue; // skip past times

      const end = new Date(start.getTime() + duration * 60_000);
      if (end.getHours() > 22 || (end.getHours() === 22 && end.getMinutes() > 0)) continue;

      // Check overlap with any busy block
      const sMs = start.getTime();
      const eMs = end.getTime();
      const conflict = allBusy.some((b) => sMs < b.end && eMs > b.start);
      if (conflict) continue;

      // ── Score based on preference ──────────────────────
      const dow = start.getDay();
      const hour = start.getHours();
      const isWeekend = dow === 0 || dow === 6;
      const isEvening = hour >= 17;

      let score = 50;
      switch (preference) {
        case "weekend":
          score += isWeekend ? 30 : 0;
          break;
        case "weekday":
          score += !isWeekend ? 30 : 0;
          break;
        case "evening":
          score += isEvening ? 30 : 0;
          break;
      }

      // Slight bias toward sooner slots
      score -= day * 3;

      // Prefer mid-morning & early-evening over very early or late
      if (hour >= 10 && hour <= 12) score += 5;
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

  // Return top 5 scored slots
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 5);
}
