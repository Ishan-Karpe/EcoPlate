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
  imageUrl: string;
  dailyCap: number;
  consecutiveWeeksAbove85: number;
  createdAt?: string;
}

export interface Reservation {
  id: string;
  dropId: string;
  userId: string;
  dropLocation: string;
  dropLocationDetail: string;
  dropWindowStart: string;
  dropWindowEnd: string;
  dropImageUrl: string;
  pickupCode: string;
  status: "reserved" | "picked_up" | "no_show" | "cancelled";
  createdAt: string;
  cancelledAt?: string;
  pickedUpAt?: string;
  noShowAt?: string;
  ratedAt?: string;
  rating?: number;
  paymentMethod: "card" | "credit" | "pay_at_pickup";
  cardLast4?: string;
  currentPrice: number;
  boxStatus?: "released" | "donated" | "disposed" | null;
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
  name?: string;
  email?: string;
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
