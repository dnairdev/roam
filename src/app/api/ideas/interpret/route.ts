import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { interpretMvpInput } from "@/lib/demoMvp";

const InterpretSchema = z.object({
  searchQuery: z
    .string()
    .describe("A specific, concrete search query for Google Maps/Places (e.g. 'romantic French restaurant', 'beginner pottery class', 'rooftop bar with city views')"),
  refinedTitle: z
    .string()
    .describe("A clean, concise title for this activity — do NOT include @mentions or time info (e.g. 'Visit the MET', 'Pottery class', 'Rooftop drinks')"),
  category: z
    .enum([
      "food-drink",
      "arts-culture",
      "outdoors",
      "fitness",
      "shopping",
      "entertainment",
      "nightlife",
      "learning",
      "travel",
      "social",
      "other",
    ])
    .describe("The best category for this activity"),
  preference: z
    .enum(["morning", "afternoon", "evening", "weekend", "any"])
    .describe("The best time of day or week for this activity"),
  estimatedMinutes: z
    .number()
    .describe("Estimated duration in minutes (e.g. 60, 90, 120, 180)"),
  invitees: z
    .array(z.string())
    .describe("Names extracted from @mentions (without the @ symbol). E.g. '@Tyler and @Diya' → ['Tyler', 'Diya']. Empty array if none."),
  specificDatetime: z
    .string()
    .nullable()
    .describe("ISO 8601 datetime string if an explicit date and/or time was given (e.g. '@ 6pm on 3/14' → '2026-03-14T18:00:00'). Current year is 2026. Return null if no specific date/time was mentioned."),
  taskAssignments: z
    .string()
    .nullable()
    .describe("Description of any task assignments from @mentions (e.g. '@Diya buys tickets' → 'Diya: buys tickets'). null if none."),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await req.json();
  if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });

  const fallback = interpretMvpInput(title);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(fallback);
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.parse({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You help interpret user activity ideas for a planning app called Roam. Given a vague or casual description, extract structured information to find real places and schedule the activity.

SEARCH QUERY: Generate a specific, descriptive Google Places search query that will find the best real venue. Be specific — include neighborhood, vibe, or type details (e.g. "rooftop bar Manhattan", "contemporary art museum NYC", "pottery class Brooklyn", "cozy jazz bar West Village").

CATEGORIES:
- food-drink: restaurants, cafes, brunch spots, lunch, cooking classes
- nightlife: bars, cocktail bars, rooftop bars, clubs, late-night spots
- arts-culture: museums, galleries, theater, concerts, art shows
- outdoors: parks, hiking, beaches, nature, picnics
- fitness: gyms, yoga, spin, sports, wellness, spa
- shopping: stores, markets, boutiques, thrift shops
- entertainment: movies, bowling, arcades, comedy shows
- learning: classes, workshops, tours, lectures
- travel: day trips, getaways, neighborhoods to explore
- social: parties, meetups, group events
- other: anything else

TIME PREFERENCES — use context clues and activity type:
- morning (7am–12pm): coffee, yoga, farmers markets, brunch, hikes, gym
- afternoon (12pm–5pm): museums, galleries, shopping, parks, lunch, classes
- evening (5pm–10pm): dinner, drinks, cocktail bars, rooftop bars, shows, concerts
- weekend: best done on a weekend (day trips, special events)
- any: truly flexible, no strong time preference

RULES for time preference:
- Bars, cocktail bars, rooftop drinks, nightlife → ALWAYS "evening"
- Museums, galleries, art shows → ALWAYS "afternoon"
- Coffee, brunch, yoga, gym, hiking → ALWAYS "morning"
- Dinner, restaurants (evening context) → "evening"
- Lunch spots → "afternoon"
- If user specifies a time (e.g. "morning coffee", "evening drinks") → use that

@MENTIONS: Extract names from @mentions (e.g. "@Tyler and @Diya" → ["Tyler", "Diya"]). Empty array if none.

TASK ASSIGNMENTS: Capture "@Name does task" as "Name: task". null if none.

SPECIFIC DATETIME: If explicit date/time given (e.g. "@ 6pm on 3/14", "Saturday noon"), return ISO 8601. Current year is 2026. null if none.

refinedTitle: clean, no @mentions, no dates/times.`,
      messages: [
        {
          role: "user",
          content: `User typed: "${title}"

Interpret this and return structured data including any @mentions as invitees, any explicit datetime as specificDatetime, any task assignments as taskAssignments, plus the search query, refined title, category, time preference, and estimated duration.`,
        },
      ],
      output_config: {
        format: zodOutputFormat(InterpretSchema),
      },
    });

    const parsed = response.parsed_output;

    return NextResponse.json({
      ...fallback,
      ...parsed,
      invitees: Array.isArray(parsed?.invitees) && parsed.invitees.length > 0
        ? parsed.invitees
        : fallback.invitees,
      specificDatetime: parsed?.specificDatetime ?? fallback.specificDatetime,
      taskAssignments: parsed?.taskAssignments ?? fallback.taskAssignments,
    });
  } catch {
    return NextResponse.json(fallback);
  }
}
