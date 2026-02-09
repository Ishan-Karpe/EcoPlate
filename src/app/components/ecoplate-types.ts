export interface Drop {
  id: string;
  location: string;
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
  emoji: string;
  dailyCap: number;
  consecutiveWeeksAbove85: number;
}

export interface Reservation {
  id: string;
  dropId: string;
  pickupCode: string;
  status: "reserved" | "picked_up" | "no_show" | "cancelled";
  createdAt: string;
  rating?: number;
  paymentMethod: "card" | "credit" | "pay_at_pickup";
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
  | "sold-out"
  | "reserve-confirm"
  | "pickup-code"
  | "cancel-confirm"
  | "post-rating"
  | "account-prompt"
  | "membership-select"
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

export const MOCK_DROPS: Drop[] = [
  {
    id: "drop-1",
    location: "North Dining Hall",
    locationDetail: "Side entrance, Window B",
    date: new Date().toISOString().split("T")[0],
    windowStart: "20:30",
    windowEnd: "22:00",
    totalBoxes: 35,
    remainingBoxes: 12,
    reservedBoxes: 23,
    priceMin: 3,
    priceMax: 5,
    status: "active",
    description:
      "Pasta bar leftovers, grilled chicken, roasted vegetables, and a dinner roll. Packed fresh at 8 PM.",
    emoji: "🍝",
    dailyCap: 35,
    consecutiveWeeksAbove85: 1,
  },
  {
    id: "drop-2",
    location: "South Dining Hall",
    locationDetail: "Main lobby, counter 3",
    date: new Date().toISOString().split("T")[0],
    windowStart: "21:00",
    windowEnd: "22:30",
    totalBoxes: 25,
    remainingBoxes: 3,
    reservedBoxes: 22,
    priceMin: 3,
    priceMax: 4,
    status: "active",
    description:
      "Stir-fry station: teriyaki chicken, jasmine rice, and steamed broccoli. Packed fresh at 8:30 PM.",
    emoji: "🍜",
    dailyCap: 30,
    consecutiveWeeksAbove85: 2,
  },
  {
    id: "drop-3",
    location: "Student Center Cafe",
    locationDetail: "Pick up at barista counter",
    date: new Date().toISOString().split("T")[0],
    windowStart: "20:00",
    windowEnd: "21:30",
    totalBoxes: 20,
    remainingBoxes: 0,
    reservedBoxes: 20,
    priceMin: 4,
    priceMax: 5,
    status: "active",
    description:
      "Deli sandwiches, fresh salad, and a cookie. Wrapped and labeled at 7:30 PM.",
    emoji: "🥪",
    dailyCap: 20,
    consecutiveWeeksAbove85: 3,
  },
  {
    id: "drop-4",
    location: "West Commons",
    locationDetail: "East-side door, table pickup",
    date: new Date().toISOString().split("T")[0],
    windowStart: "21:30",
    windowEnd: "23:00",
    totalBoxes: 30,
    remainingBoxes: 30,
    reservedBoxes: 0,
    priceMin: 3,
    priceMax: 5,
    status: "upcoming",
    description:
      "Chef's choice: a mix of tonight's entrees including BBQ pulled pork, coleslaw, and cornbread.",
    emoji: "🍖",
    dailyCap: 30,
    consecutiveWeeksAbove85: 0,
  },
];

export const MOCK_USER: UserState = {
  isFirstTime: true,
  totalPickups: 0,
  noShowCount: 0,
  hasAccount: false,
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
    { location: "North Dining Hall", currentCap: 35, consecutiveWeeksAbove85: 1 },
    { location: "South Dining Hall", currentCap: 30, consecutiveWeeksAbove85: 2 },
    { location: "Student Center Cafe", currentCap: 20, consecutiveWeeksAbove85: 3 },
    { location: "West Commons", currentCap: 30, consecutiveWeeksAbove85: 0 },
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
