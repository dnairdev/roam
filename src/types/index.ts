export interface BusyBlock {
  start: string; // ISO string
  end: string;
}

export interface SlotSuggestion {
  start: string;
  end: string;
  score: number;
  reason: string;
}

export interface SuggestSlotsRequest {
  duration: number; // minutes: 30 | 60 | 90 | 120
  preference: "any" | "weekend" | "weekday" | "evening";
  friendEmails: string[];
}

export interface BucketData {
  id: string;
  name: string;
  emoji: string;
  order: number;
  _count?: { ideas: number };
}

export interface IdeaData {
  id: string;
  title: string;
  notes: string;
  location: string;
  tags: string; // JSON array
  planType: "solo" | "friends";
  savedLink: string;
  bucketId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Interface for pluggable availability providers */
export interface AvailabilityProvider {
  getBusyBlocks(
    email: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<BusyBlock[]>;
}
