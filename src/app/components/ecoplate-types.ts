export interface Drop {
  id: string;
  location: "Brandywine" | "Anteatery";
  locationDetail: string;
  date: string;
  windowStart: string;
  windowEnd: string;
  totalBoxes: number;
  remainingBoxes: number;
  reservedBoxes: number;
  priceMin: number;
  priceMax: number;
  status: "upcoming" | "active" | "ended";
  description: string;
  imageUrl: string;
  dailyCap: number;
  consecutiveWeeksAbove85: number;
}

export interface Reservation {
  id: string;
  dropId: string;
  dropLocation: "Brandywine" | "Anteatery";
  dropLocationDetail: string;
  dropWindowStart: string;
  dropWindowEnd: string;
  dropImageUrl: string;
  pickupCode: string;
  status: "reserved" | "picked_up" | "no_show" | "cancelled";
  createdAt: string;
  rating?: number;
  paymentMethod: "card" | "credit" | "pay_at_pickup";
  currentPrice: number;
}

export interface WaitlistEntry {
  id: string;
  dropId: string;
  createdAt: string;
  notified: boolean;
}

export interface UserState {
  isFirstTime: boolean;
  totalPickups: number;
  noShowCount: number;
  hasAccount: boolean;
  hasCardSaved: boolean;
  cardLast4: string;
  membership: Membership | null;
  creditsRemaining: number;
}

export interface Membership {
  plan: "basic" | "premium";
  monthlyPrice: number;
  creditsPerMonth: number;
  earlyAccess: boolean;
  monthsUnderUsed: number;
}

export interface LocationCap {
  location: string;
  currentCap: number;
  consecutiveWeeksAbove85: number;
}

export interface AdminStats {
  totalDrops: number;
  totalBoxesPosted: number;
  totalBoxesPickedUp: number;
  totalReservations: number;
  totalNoShows: number;
  pickupRate: number;
  noShowRate: number;
  avgRating: number;
  locationCaps: LocationCap[];
  recentDrops: {
    date: string;
    posted: number;
    pickedUp: number;
    noShows: number;
  }[];
}

export type Screen =
  | "landing"
  | "drop-detail"
  | "reserve-confirm"
  | "pickup-code"
  | "post-rating"
  | "account-prompt"
  | "student-insights"
  | "student-settings"
  | "order-history"
  | "onboarding"
  | "admin-login"
  | "admin-dashboard"
  | "admin-create-drop"
  | "admin-redeem"
  | "admin-no-shows";

export function generatePickupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Returns current state of a pickup window relative to right now */
export function getWindowState(windowStart: string, windowEnd: string): "before" | "during" | "after" {
  const now = new Date();
  const [startH, startM] = windowStart.split(":").map(Number);
  const [endH, endM] = windowEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (nowMinutes < startMinutes) return "before";
  if (nowMinutes >= endMinutes) return "after";
  return "during";
}

/**
 * Dynamic pricing:
 * - High supply (>50% remaining, regardless of demand) → price closer to min
 * - Low supply (<20% remaining) + high demand (>70% reserved) → price at max
 * - Otherwise → interpolate
 */
export function calculateCurrentPrice(drop: Drop): number {
  if (drop.totalBoxes === 0) return drop.priceMin;
  const supplyRatio = drop.remainingBoxes / drop.totalBoxes;
  const demandRatio = drop.reservedBoxes / drop.totalBoxes;
  if (supplyRatio > 0.5) {
    return drop.priceMin;
  } else if (supplyRatio < 0.2 && demandRatio > 0.7) {
    return drop.priceMax;
  } else {
    const raw = drop.priceMin + (drop.priceMax - drop.priceMin) * (1 - supplyRatio) * demandRatio;
    return Math.min(drop.priceMax, Math.max(drop.priceMin, Math.round(raw)));
  }
}

// Image URLs for UCI dining locations
export const LOCATION_IMAGES = {
  Brandywine: "https://images.unsplash.com/photo-1732187582879-3ca83139c1b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  Anteatery: "https://images.unsplash.com/photo-1758705206993-f141bbe56193?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
};

export const MOCK_DROPS: Drop[] = [
  {
    id: "drop-1",
    location: "Anteatery",
    locationDetail: "Main lobby, counter 3",
    date: new Date().toISOString().split("T")[0],
    windowStart: "18:00",
    windowEnd: "19:30",
    totalBoxes: 30,
    remainingBoxes: 8,
    reservedBoxes: 22,
    priceMin: 3,
    priceMax: 5,
    status: "active",
    description:
      "Pasta bar: penne arrabbiata, grilled chicken, roasted seasonal vegetables, and a dinner roll.",
    imageUrl: "https://images.unsplash.com/photo-1758705206993-f141bbe56193?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    dailyCap: 30,
    consecutiveWeeksAbove85: 1,
  },
  {
    id: "drop-2",
    location: "Brandywine",
    locationDetail: "Side entrance, Window B",
    date: new Date().toISOString().split("T")[0],
    windowStart: "18:00",
    windowEnd: "19:30",
    totalBoxes: 25,
    remainingBoxes: 12,
    reservedBoxes: 13,
    priceMin: 3,
    priceMax: 5,
    status: "active",
    description:
      "Stir-fry station: teriyaki chicken, jasmine rice, steamed broccoli, and a spring roll.",
    imageUrl: "https://images.unsplash.com/photo-1732187582879-3ca83139c1b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    dailyCap: 25,
    consecutiveWeeksAbove85: 2,
  },
  {
    id: "drop-3",
    location: "Brandywine",
    locationDetail: "Main lobby, counter 1",
    date: new Date().toISOString().split("T")[0],
    windowStart: "18:30",
    windowEnd: "20:00",
    totalBoxes: 20,
    remainingBoxes: 3,
    reservedBoxes: 17,
    priceMin: 4,
    priceMax: 5,
    status: "active",
    description:
      "Deli station: turkey and avocado sandwich, fresh mixed green salad, and a chocolate chip cookie.",
    imageUrl: "https://images.unsplash.com/photo-1634632071708-68d98ca65f04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    dailyCap: 20,
    consecutiveWeeksAbove85: 3,
  },
  {
    id: "drop-4",
    location: "Anteatery",
    locationDetail: "East-side door, table pickup",
    date: new Date().toISOString().split("T")[0],
    windowStart: "19:00",
    windowEnd: "20:30",
    totalBoxes: 30,
    remainingBoxes: 18,
    reservedBoxes: 12,
    priceMin: 3,
    priceMax: 5,
    status: "active",
    description:
      "Chef's choice: BBQ pulled pork, house-made coleslaw, golden cornbread, and a brownie.",
    imageUrl: "https://images.unsplash.com/photo-1624900043496-eefdb73dadf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    dailyCap: 30,
    consecutiveWeeksAbove85: 0,
  },
];

export const MOCK_USER: UserState = {
  isFirstTime: true,
  totalPickups: 0,
  noShowCount: 0,
  hasAccount: false,
  hasCardSaved: false,
  cardLast4: "",
  membership: null,
  creditsRemaining: 0,
};

export const MOCK_STATS: AdminStats = {
  totalDrops: 14,
  totalBoxesPosted: 420,
  totalBoxesPickedUp: 357,
  totalReservations: 398,
  totalNoShows: 41,
  pickupRate: 85,
  noShowRate: 10.3,
  avgRating: 4.3,
  locationCaps: [
    { location: "Anteatery", currentCap: 30, consecutiveWeeksAbove85: 1 },
    { location: "Brandywine", currentCap: 25, consecutiveWeeksAbove85: 2 },
  ],
  recentDrops: [
    { date: "Mon", posted: 30, pickedUp: 26, noShows: 3 },
    { date: "Tue", posted: 35, pickedUp: 31, noShows: 2 },
    { date: "Wed", posted: 28, pickedUp: 24, noShows: 4 },
    { date: "Thu", posted: 32, pickedUp: 28, noShows: 2 },
    { date: "Fri", posted: 40, pickedUp: 35, noShows: 3 },
    { date: "Sat", posted: 25, pickedUp: 22, noShows: 1 },
    { date: "Sun", posted: 35, pickedUp: 12, noShows: 8 },
  ],
};