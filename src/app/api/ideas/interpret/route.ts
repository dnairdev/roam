import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 });
  }

  const { title } = await req.json();
  if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });

  const client = new Anthropic({ apiKey });

  const response = await client.messages.parse({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: `You help interpret user activity ideas for a planning app called Roam. Given a vague or casual description, extract structured information to find real places and schedule the activity.

Categories:
- food-drink: restaurants, cafes, bars, food experiences, cooking classes
- arts-culture: museums, galleries, theater, concerts, art shows
- outdoors: parks, hiking, beaches, nature, picnics
- fitness: gyms, yoga, sports, wellness, spa
- shopping: stores, markets, boutiques, thrift shops
- entertainment: movies, bowling, arcades, comedy shows
- nightlife: clubs, bars (evening/late night focus), rooftop bars
- learning: classes, workshops, tours, lectures
- travel: day trips, getaways, new neighborhoods to explore
- social: parties, meetups, group events
- other: anything else

Time preferences:
- morning: 7am–12pm (coffee, yoga, markets, brunch)
- afternoon: 12pm–5pm (museums, shopping, parks, lunch)
- evening: 5pm–10pm (dinner, drinks, shows, events)
- weekend: best done on a weekend
- any: flexible

@mentions: Extract names from @mentions (e.g. "@Tyler and @Diya" → invitees: ["Tyler", "Diya"]). These are people being invited to the activity.

Task assignments: If someone is assigned a task via @mention (e.g. "@Diya buys tickets", "@Tyler drives"), capture as "Name: task" format. Return null if none.

Specific datetime: If an explicit date/time is provided (e.g. "@ 6pm on 3/14", "Saturday at noon", "next Friday 8pm"), return ISO 8601 format. Current year is 2026. Return null if no specific time is given.

The refinedTitle should be clean and NOT include @mentions, dates, or time specifications.`,
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

  return NextResponse.json(response.parsed_output);
}
