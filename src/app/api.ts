import { projectId, publicAnonKey } from "/utils/supabase/info";
import type { Drop, Reservation, UserState, AdminStats } from "./components/ecoplate-types";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b2407c0b`;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${publicAnonKey}`,
};

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers ?? {}) },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? `Request failed: ${res.status}`);
  }
  return json as T;
}

// ─── Drops ────────────────────────────────────────────────────────────────────

export async function getDrops(): Promise<Drop[]> {
  const data = await request<{ drops: Drop[] }>("/drops");
  return data.drops;
}

export async function createDrop(drop: {
  location: "Brandywine" | "Anteatery";
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

// ─── Reservations ─────────────────────────────────────────────────────────────

export async function createReservation(payload: {
  dropId: string;
  sessionId: string;
  paymentMethod: "card" | "credit" | "pay_at_pickup";
  cardLast4?: string;
}): Promise<{ reservation: Reservation; drop: Drop }> {
  return request("/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getReservations(sessionId: string): Promise<Reservation[]> {
  const data = await request<{ reservations: Reservation[] }>(
    `/reservations?sessionId=${encodeURIComponent(sessionId)}`
  );
  return data.reservations;
}

export async function cancelReservation(id: string): Promise<Reservation> {
  const data = await request<{ reservation: Reservation }>(
    `/reservations/${id}/cancel`,
    { method: "POST" }
  );
  return data.reservation;
}

export async function submitRating(
  reservationId: string,
  rating: number,
  sessionId: string
): Promise<Reservation> {
  const data = await request<{ reservation: Reservation }>(
    `/reservations/${reservationId}/rate`,
    {
      method: "POST",
      body: JSON.stringify({ rating, sessionId }),
    }
  );
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

// ─── Redeem ───────────────────────────────────────────────────────────────────

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

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export async function joinWaitlist(
  dropId: string,
  sessionId: string
): Promise<void> {
  await request("/waitlist", {
    method: "POST",
    body: JSON.stringify({ dropId, sessionId }),
  });
}

// ─── No-shows ─────────────────────────────────────────────────────────────────

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

// ─── User ─────────────────────────────────────────────────────────────────────

export async function getUser(sessionId: string): Promise<UserState> {
  const data = await request<{ user: UserState }>(`/user/${sessionId}`);
  return data.user;
}

export async function updateUser(
  sessionId: string,
  updates: Partial<UserState>
): Promise<UserState> {
  const data = await request<{ user: UserState }>(`/user/${sessionId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return data.user;
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const data = await request<{ stats: AdminStats }>("/admin/stats");
  return data.stats;
}

// ─── Session ID ───────────────────────────────────────────────────────────────

export function getOrCreateSessionId(): string {
  const KEY = "ecoplate-session-id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}
