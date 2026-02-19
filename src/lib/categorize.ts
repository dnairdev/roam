/**
 * Auto-categorize an idea based on its title and Google Places types.
 */

export interface Category {
  name: string;
  emoji: string;
}

const CATEGORIES: Record<string, Category> = {
  "food-drink": { name: "Food & Drink", emoji: "🍽" },
  "arts-culture": { name: "Arts & Culture", emoji: "🎨" },
  "outdoors": { name: "Outdoors", emoji: "🌿" },
  "fitness": { name: "Fitness & Wellness", emoji: "💪" },
  "shopping": { name: "Shopping", emoji: "🛍" },
  "entertainment": { name: "Entertainment", emoji: "🎬" },
  "nightlife": { name: "Nightlife", emoji: "🌙" },
  "learning": { name: "Learning", emoji: "📚" },
  "travel": { name: "Travel", emoji: "✈️" },
  "social": { name: "Social", emoji: "👋" },
  "other": { name: "Other", emoji: "📌" },
};

// Google Places types → category key
const TYPE_TO_CATEGORY: Record<string, string> = {
  restaurant: "food-drink",
  cafe: "food-drink",
  bakery: "food-drink",
  bar: "nightlife",
  night_club: "nightlife",
  museum: "arts-culture",
  art_gallery: "arts-culture",
  performing_arts_theater: "arts-culture",
  movie_theater: "entertainment",
  amusement_park: "entertainment",
  bowling_alley: "entertainment",
  stadium: "entertainment",
  park: "outdoors",
  campground: "outdoors",
  natural_feature: "outdoors",
  zoo: "outdoors",
  aquarium: "outdoors",
  gym: "fitness",
  spa: "fitness",
  shopping_mall: "shopping",
  clothing_store: "shopping",
  book_store: "learning",
  library: "learning",
  university: "learning",
  school: "learning",
  tourist_attraction: "travel",
  lodging: "travel",
  airport: "travel",
  train_station: "travel",
  church: "arts-culture",
  hindu_temple: "arts-culture",
  mosque: "arts-culture",
  synagogue: "arts-culture",
};

// Keyword regex → category key (fallback when no place types)
const KEYWORD_CATEGORIES: [RegExp, string][] = [
  [/\b(restaurant|dinner|lunch|brunch|eat|food|sushi|pizza|taco|ramen|bbq|bistro|diner)\b/i, "food-drink"],
  [/\b(coffee|cafe|tea|bakery|pastry|dessert)\b/i, "food-drink"],
  [/\b(bar|drinks|cocktail|happy hour|pub|brewery)\b/i, "nightlife"],
  [/\b(club|nightlife|dj|dance)\b/i, "nightlife"],
  [/\b(museum|exhibit|gallery|art|sculpture|painting)\b/i, "arts-culture"],
  [/\b(theater|theatre|opera|ballet|symphony|concert|show|performance|play|comedy)\b/i, "arts-culture"],
  [/\b(park|hike|trail|garden|beach|swim|kayak|surf|camp|nature|lake|mountain)\b/i, "outdoors"],
  [/\b(gym|workout|yoga|pilates|climb|run|jog|fitness|crossfit|tennis|basketball|soccer)\b/i, "fitness"],
  [/\b(spa|massage|sauna|wellness|meditation)\b/i, "fitness"],
  [/\b(movie|film|cinema|bowling|arcade|escape room|mini golf|karaoke|game)\b/i, "entertainment"],
  [/\b(shop|mall|store|market|thrift|vintage|boutique)\b/i, "shopping"],
  [/\b(class|course|workshop|lecture|seminar|book|library|learn|study|tutor)\b/i, "learning"],
  [/\b(trip|travel|fly|flight|hotel|airbnb|road trip|vacation|visit)\b/i, "travel"],
  [/\b(meetup|hang|friend|party|potluck|picnic|bbq|gathering)\b/i, "social"],
];

export function categorize(title: string, placeTypes: string[] = []): string {
  // Try place types first
  for (const type of placeTypes) {
    if (TYPE_TO_CATEGORY[type]) return TYPE_TO_CATEGORY[type];
  }

  // Keyword fallback
  for (const [pattern, cat] of KEYWORD_CATEGORIES) {
    if (pattern.test(title)) return cat;
  }

  return "other";
}

export function getCategoryInfo(key: string): Category {
  return CATEGORIES[key] || CATEGORIES["other"];
}

export function getAllCategories(): Record<string, Category> {
  return CATEGORIES;
}
