import type { AdminStats, UserState } from "./types";

export const FOOD_IMAGE_POOL = [
  {
    keywords: ["pasta", "penne", "spaghetti", "lasagna", "noodle", "fettuccine", "italian"],
    url: "https://images.unsplash.com/photo-1710793231486-e83b6a5da35c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["stir", "teriyaki", "wok", "fried rice", "asian", "noodles", "soy", "szechuan"],
    url: "https://images.unsplash.com/photo-1740362381425-f553526c8d23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["sandwich", "deli", "turkey", "wrap", "sub", "panini", "avocado"],
    url: "https://images.unsplash.com/photo-1585238341805-eb6fde8854bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["bbq", "pulled", "pork", "cornbread", "brisket", "ribs", "barbecue", "smoky"],
    url: "https://images.unsplash.com/photo-1705515943119-e85d4c81f08f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["pizza", "margherita", "pepperoni", "mozzarella", "flatbread"],
    url: "https://images.unsplash.com/photo-1650315776778-9a767370950f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["soup", "stew", "broth", "chowder", "bisque", "chili"],
    url: "https://images.unsplash.com/photo-1756201408993-3b0f802d2677?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["salad", "green", "vegetarian", "vegan", "lettuce", "kale", "arugula"],
    url: "https://images.unsplash.com/photo-1610903122389-3674aafb17a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["chicken", "grilled", "roasted", "poultry", "wings"],
    url: "https://images.unsplash.com/photo-1676436293954-33493be151c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["rice", "bowl", "grain", "quinoa", "burrito", "taco", "mexican"],
    url: "https://images.unsplash.com/photo-1705515943119-e85d4c81f08f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
];

export const LOCATION_FALLBACK_IMAGES: Record<string, string> = {
  Brandywine:
    "https://images.unsplash.com/photo-1676436293954-33493be151c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  Anteatery:
    "https://images.unsplash.com/photo-1710793231486-e83b6a5da35c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
};

export const LOCATION_IMAGES = {
  Brandywine:
    "https://images.unsplash.com/photo-1676436293954-33493be151c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  Anteatery:
    "https://images.unsplash.com/photo-1710793231486-e83b6a5da35c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
};

export const DEFAULT_USER: UserState = {
  isFirstTime: false,
  totalPickups: 0,
  noShowCount: 0,
  hasAccount: true,
  hasCardSaved: false,
  cardLast4: "",
  membership: null,
  creditsRemaining: 0,
};

export const DEFAULT_STATS: AdminStats = {
  totalDrops: 0,
  totalBoxesPosted: 0,
  totalBoxesPickedUp: 0,
  totalReservations: 0,
  totalNoShows: 0,
  pickupRate: 0,
  noShowRate: 0,
  avgRating: 0,
  locationCaps: [
    { location: "Anteatery", currentCap: 30, consecutiveWeeksAbove85: 0 },
    { location: "Brandywine", currentCap: 25, consecutiveWeeksAbove85: 0 },
  ],
  recentDrops: [],
};

export function pickDropImage(description: string, location: string): string {
  const lower = description.toLowerCase();
  for (const entry of FOOD_IMAGE_POOL) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.url;
  }
  return LOCATION_FALLBACK_IMAGES[location] ?? LOCATION_FALLBACK_IMAGES["Anteatery"];
}
