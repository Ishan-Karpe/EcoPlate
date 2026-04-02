import type { AdminStats, Drop, Reservation, UserState } from "$lib/types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    });
  } catch (error) {
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    if (isMutation && typeof navigator !== "undefined" && !navigator.onLine) {
      throw new Error("You appear to be offline. Reconnect to submit this action.");
    }
    throw new Error(error instanceof Error ? error.message : "Network request failed");
  }

  let payload: unknown = {};
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }

  if (!res.ok) {
    throw new Error((payload as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return payload as T;
}

export async function getDrops(): Promise<Drop[]> {
  const data = await request<{ drops: Drop[] }>("/drops");
  return data.drops;
}

export async function createDrop(drop: {
  location: string;
  locationDetail: string;
  boxes: number;
  windowStart: string;
  windowEnd: string;
  priceMin: number;
  priceMax: number;
  description: string;
  imageUrl: string;
  dailyCap: number;
  consecutiveWeeksAbove85: number;
}): Promise<Drop> {
  const data = await request<{ drop: Drop }>("/drops", {
    method: "POST",
    body: JSON.stringify(drop),
  });
  return data.drop;
}

export async function updateDrop(id: string, updates: Partial<Drop>): Promise<Drop> {
  const data = await request<{ drop: Drop }>(`/drops/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return data.drop;
}

export async function deleteDrop(id: string): Promise<void> {
  await request<{ success: boolean }>(`/drops/${id}`, {
    method: "DELETE",
  });
}

export async function createReservation(payload: {
  dropId: string;
  userId: string;
  paymentMethod: "card" | "credit" | "pay_at_pickup";
  cardLast4?: string;
}): Promise<{ reservation: Reservation; drop: Drop }> {
  return request("/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getReservations(userId: string): Promise<Reservation[]> {
  const data = await request<{ reservations: Reservation[] }>(
    `/reservations?userId=${encodeURIComponent(userId)}`
  );
  return data.reservations;
}

export async function getReservation(id: string): Promise<Reservation> {
  const data = await request<{ reservation: Reservation }>(`/reservations/${id}`);
  return data.reservation;
}

export async function cancelReservation(id: string): Promise<Reservation> {
  const data = await request<{ reservation: Reservation }>(`/reservations/${id}/cancel`, {
    method: "POST",
  });
  return data.reservation;
}

export async function submitRating(
  reservationId: string,
  rating: number,
  userId: string
): Promise<Reservation> {
  const data = await request<{ reservation: Reservation }>(`/reservations/${reservationId}/rate`, {
    method: "POST",
    body: JSON.stringify({ rating, userId }),
  });
  return data.reservation;
}

export async function markNoShow(
  reservationId: string,
  boxStatus: "released" | "donated" | "disposed"
): Promise<void> {
  await request(`/reservations/${reservationId}/no-show`, {
    method: "POST",
    body: JSON.stringify({ boxStatus }),
  });
}

export interface RedeemResult {
  valid: boolean;
  reason?: string;
  location?: string;
  reservation?: Reservation;
  drop?: Drop;
}

export async function redeemCode(code: string): Promise<RedeemResult> {
  return request<RedeemResult>("/redeem", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function joinWaitlist(dropId: string, userId: string): Promise<void> {
  await request("/waitlist", {
    method: "POST",
    body: JSON.stringify({ dropId, userId }),
  });
}

export interface NoShowEntry {
  reservationId: string;
  code: string;
  location: string;
  time: string;
  repeatOffender: boolean;
  boxStatus: "released" | "donated" | "disposed" | null;
  alreadyMarked: boolean;
}

export async function getNoShows(): Promise<NoShowEntry[]> {
  const data = await request<{ noShows: NoShowEntry[] }>("/no-shows");
  return data.noShows;
}

export async function getUser(userId: string): Promise<UserState> {
  const data = await request<{ user: UserState }>(`/user/${userId}`);
  return data.user;
}

export async function updateUser(userId: string, updates: Partial<UserState>): Promise<UserState> {
  const data = await request<{ user: UserState }>(`/user/${userId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return data.user;
}

export async function getAdminStats(): Promise<AdminStats> {
  const data = await request<{ stats: AdminStats }>("/admin/stats");
  return data.stats;
}

export interface FoodAnalysisResult {
  description: string;
  suggestedBoxes: number;
  suggestedPriceMin: number;
  suggestedPriceMax: number;
  tags: string[];
  allergens: string[];
  calories: { min: number; max: number } | null;
  macros: { protein: number; carbs: number; fat: number } | null;
}

export async function analyzeFoodPhoto(imageBase64: string): Promise<FoodAnalysisResult> {
  return request<FoodAnalysisResult>("/analyze-food-photo", {
    method: "POST",
    body: JSON.stringify({ imageBase64 }),
  });
}
