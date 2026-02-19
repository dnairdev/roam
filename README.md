# roam

Turn saved ideas into scheduled plans — solo or with friends — using Google Calendar integration.

## Features

- **Idea capture** — Quickly save ideas with title, notes, location, tags, and saved links
- **Buckets** — Organize ideas into categories (Outdoor, Food, Museums, etc.)
- **Solo / Friends toggle** — Mark ideas to do alone or with others
- **Calendar integration** — Connects to Google Calendar to fetch your availability
- **Smart scheduling** — Suggests 3–5 time slots based on overlapping free time
- **Preference filters** — Prefer weekends, weekdays, or evenings

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Prisma** + SQLite for local database
- **NextAuth** for Google OAuth
- **Google Calendar API** (FreeBusy) for availability

## Setup

### 1. Prerequisites

- Node.js 18+
- A Google Cloud project with OAuth 2.0 credentials

### 2. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:3000` to **Authorized JavaScript origins**
4. Add `http://localhost:3000/api/auth/callback/google` to **Authorized redirect URIs**
5. Enable the **Google Calendar API** in your project
6. Enable billing on the same Google Cloud project
7. Create an API key for Maps and enable:
   - **Maps JavaScript API**
   - **Places API (New)** (optional, for place auto-detection)
8. If the API key has HTTP referrer restrictions, allow:
   - `http://localhost:3000/*`
   - `http://127.0.0.1:3000/*` (if you use 127.0.0.1)

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite path (default: `file:./dev.db`) |
| `NEXTAUTH_URL` | App URL (default: `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Random secret for JWT signing (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_MAPS_API_KEY` | Server-side key for Places requests |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Browser key for Maps JavaScript rendering |

### 4. Install & Run

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## File Structure

```
roam/
├── prisma/
│   └── schema.prisma          # User, Bucket, Idea models + NextAuth tables
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with session provider
│   │   ├── page.tsx            # Entry point (login or dashboard)
│   │   ├── globals.css         # Tailwind + custom styles
│   │   ├── providers.tsx       # NextAuth SessionProvider wrapper
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── buckets/route.ts          # GET / POST buckets
│   │       ├── buckets/[id]/route.ts     # PUT / DELETE bucket
│   │       ├── ideas/route.ts            # GET / POST ideas
│   │       ├── ideas/[id]/route.ts       # GET / PUT / DELETE idea
│   │       ├── calendar/availability/route.ts   # GET user busy blocks
│   │       └── calendar/suggest-slots/route.ts  # POST slot suggestions
│   ├── components/
│   │   ├── Dashboard.tsx       # Main 3-column layout + state orchestration
│   │   ├── TopBar.tsx          # App header with user menu
│   │   ├── Sidebar.tsx         # Bucket navigation
│   │   ├── IdeaList.tsx        # Searchable idea list
│   │   ├── IdeaDetail.tsx      # Idea editor with auto-save
│   │   ├── PlanPanel.tsx       # Scheduling UI with slot suggestions
│   │   ├── LoginScreen.tsx     # Google sign-in
│   │   └── EmptyState.tsx      # Reusable empty state
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── calendar.ts         # Google Calendar API + mock provider
│   │   └── availability.ts     # Slot suggestion algorithm
│   └── types/
│       └── index.ts            # Shared TypeScript types
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Availability Algorithm

The slot suggestion engine in `src/lib/availability.ts`:

1. Scans the next 7 days in 30-minute increments (8 AM – 10 PM window)
2. Filters out any slot overlapping the user's Google Calendar busy blocks
3. Filters out slots overlapping friends' busy blocks (mock or real)
4. Scores remaining slots based on user preference:
   - **Weekend** → +30 for Sat/Sun
   - **Weekday** → +30 for Mon–Fri
   - **Evening** → +30 for 5 PM+
   - Slight bias toward sooner dates and mid-morning / early-evening
5. Returns the top 5 highest-scored slots

## Friend Availability (v1)

Friend availability is behind an `AvailabilityProvider` interface (`src/types/index.ts`). The current implementation uses `MockAvailabilityProvider` which generates deterministic fake busy blocks based on the friend's email. To integrate real Google Calendar FreeBusy data, implement the interface with actual API calls.

## Limitations (v1)

- Does not create calendar events (display-only suggestions)
- Friend availability is mocked
- No real-time sync — data refreshes on navigation
- Desktop-optimized layout
