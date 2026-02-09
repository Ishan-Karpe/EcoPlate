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
