import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const BASE = "/make-server-b2407c0b";

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get(`${BASE}/health`, (c) => c.json({ status: "ok" }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultUserState() {
  return {
    isFirstTime: true,
    totalPickups: 0,
    noShowCount: 0,
    hasAccount: false,
    hasCardSaved: false,
    cardLast4: "",
    membership: null,
    creditsRemaining: 0,
  };
}

function generatePickupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function calculateCurrentPrice(drop: {
  remainingBoxes: number;
  reservedBoxes: number;
  totalBoxes: number;
  priceMin: number;
  priceMax: number;
}): number {
  if (drop.totalBoxes === 0) return drop.priceMin;
  const supplyRatio = drop.remainingBoxes / drop.totalBoxes;
  const demandRatio = drop.reservedBoxes / drop.totalBoxes;
  if (supplyRatio > 0.5) return drop.priceMin;
  if (supplyRatio < 0.2 && demandRatio > 0.7) return drop.priceMax;
  const raw = drop.priceMin + (drop.priceMax - drop.priceMin) * (1 - supplyRatio) * demandRatio;
  return Math.min(drop.priceMax, Math.max(drop.priceMin, Math.round(raw)));
}

async function getStats() {
  const stats = await kv.get("stats:global");
  if (stats) return stats;
  return {
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
}

async function updateStats(update: {
  boxesPosted?: number;
  dropCreated?: boolean;
  reservationCreated?: boolean;
  boxPickedUp?: boolean;
  noShow?: boolean;
  newRating?: { value: number; previousAvg: number; previousCount: number };
}) {
  const stats = await getStats();
  const totalPosted = stats.totalBoxesPosted + (update.boxesPosted ?? 0);
  const totalPickedUp = stats.totalBoxesPickedUp + (update.boxPickedUp ? 1 : 0);
  const totalNoShows = stats.totalNoShows + (update.noShow ? 1 : 0);
  const totalReservations = stats.totalReservations + (update.reservationCreated ? 1 : 0);
  const totalDrops = stats.totalDrops + (update.dropCreated ? 1 : 0);
  const pickupRate = totalPosted > 0 ? Math.round((totalPickedUp / totalPosted) * 100) : 0;
  const noShowRate = totalReservations > 0
    ? Math.round((totalNoShows / totalReservations) * 1000) / 10
    : 0;

  let avgRating = stats.avgRating;
  if (update.newRating) {
    const { value, previousAvg, previousCount } = update.newRating;
    avgRating = previousCount === 0
      ? value
      : Math.round(((previousAvg * previousCount + value) / (previousCount + 1)) * 10) / 10;
  }

  const updated = {
    ...stats,
    totalDrops,
    totalBoxesPosted: totalPosted,
    totalBoxesPickedUp: totalPickedUp,
    totalReservations,
    totalNoShows,
    pickupRate,
    noShowRate,
    avgRating,
  };
  await kv.set("stats:global", updated);
  return updated;
}

// ─── Drops ────────────────────────────────────────────────────────────────────

app.get(`${BASE}/drops`, async (c) => {
  try {
    const drops = await kv.getByPrefix("drop:");
    const sorted = drops
      .filter((d) => d && d.id)
      .sort((a, b) => new Date(b.createdAt ?? b.date).getTime() - new Date(a.createdAt ?? a.date).getTime());
    return c.json({ drops: sorted });
  } catch (e) {
    console.log("Error fetching drops:", e);
    return c.json({ error: `Failed to fetch drops: ${e}` }, 500);
  }
});

app.post(`${BASE}/drops`, async (c) => {
  try {
    const body = await c.req.json();
    const {
      location, locationDetail, boxes, windowStart, windowEnd,
      priceMin, priceMax, description, imageUrl, dailyCap, consecutiveWeeksAbove85,
    } = body;

    const id = `drop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const drop = {
      id,
      location,
      locationDetail: locationDetail ?? `${location} pickup area`,
      date: new Date().toISOString().split("T")[0],
      windowStart,
      windowEnd,
      totalBoxes: boxes,
      remainingBoxes: boxes,
      reservedBoxes: 0,
      priceMin,
      priceMax,
      status: "active",
      description: description || "Tonight's Rescue Box — freshly prepared by dining staff.",
      imageUrl: imageUrl ?? "",
      dailyCap: dailyCap ?? 30,
      consecutiveWeeksAbove85: consecutiveWeeksAbove85 ?? 0,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`drop:${id}`, drop);
    await updateStats({ boxesPosted: boxes, dropCreated: true });

    // Update locationCaps consecutive weeks tracking
    const stats = await getStats();
    const caps = stats.locationCaps.map((cap: { location: string; currentCap: number; consecutiveWeeksAbove85: number }) => {
      if (cap.location === location) {
        return { ...cap, consecutiveWeeksAbove85: consecutiveWeeksAbove85 ?? cap.consecutiveWeeksAbove85 };
      }
      return cap;
    });
    await kv.set("stats:global", { ...stats, locationCaps: caps });

    return c.json({ drop });
  } catch (e) {
    console.log("Error creating drop:", e);
    return c.json({ error: `Failed to create drop: ${e}` }, 500);
  }
});

app.patch(`${BASE}/drops/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const drop = await kv.get(`drop:${id}`);
    if (!drop) return c.json({ error: "Drop not found" }, 404);
    const updated = { ...drop, ...body };
    await kv.set(`drop:${id}`, updated);
    return c.json({ drop: updated });
  } catch (e) {
    console.log("Error updating drop:", e);
    return c.json({ error: `Failed to update drop: ${e}` }, 500);
  }
});

// ─── Reservations ─────────────────────────────────────────────────────────────

app.post(`${BASE}/reservations`, async (c) => {
  try {
    const body = await c.req.json();
    const { dropId, sessionId, paymentMethod, cardLast4 } = body;

    const drop = await kv.get(`drop:${dropId}`);
    if (!drop) return c.json({ error: "Drop not found" }, 404);
    if (drop.remainingBoxes <= 0) return c.json({ error: "Drop is sold out" }, 409);

    // Check for existing active reservation on this drop by this session
    const allRes = await kv.getByPrefix("res:");
    const existing = allRes.find(
      (r) => r.sessionId === sessionId && r.dropId === dropId && r.status === "reserved"
    );
    if (existing) return c.json({ error: "Already have an active reservation for this drop" }, 409);

    const code = generatePickupCode();
    const currentPrice = calculateCurrentPrice(drop);
    const resId = `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const reservation = {
      id: resId,
      dropId,
      sessionId,
      dropLocation: drop.location,
      dropLocationDetail: drop.locationDetail,
      dropWindowStart: drop.windowStart,
      dropWindowEnd: drop.windowEnd,
      dropImageUrl: drop.imageUrl,
      pickupCode: code,
      status: "reserved",
      createdAt: new Date().toISOString(),
      paymentMethod,
      cardLast4: cardLast4 ?? null,
      currentPrice,
    };

    await kv.set(`res:${resId}`, reservation);
    await kv.set(`code:${code}`, { reservationId: resId, dropId, status: "valid" });

    // Decrement remaining boxes
    const updatedDrop = {
      ...drop,
      remainingBoxes: drop.remainingBoxes - 1,
      reservedBoxes: drop.reservedBoxes + 1,
    };
    await kv.set(`drop:${dropId}`, updatedDrop);

    await updateStats({ reservationCreated: true });

    // Update user state — card saved, credit deducted
    const userState = await kv.get(`user:${sessionId}`) ?? defaultUserState();
    const userUpdates: Record<string, unknown> = {};
    if (paymentMethod === "card" && cardLast4 && !userState.hasCardSaved) {
      userUpdates.hasCardSaved = true;
      userUpdates.cardLast4 = cardLast4;
    }
    if (paymentMethod === "credit") {
      userUpdates.creditsRemaining = Math.max(0, (userState.creditsRemaining ?? 0) - 1);
    }
    if (Object.keys(userUpdates).length > 0) {
      await kv.set(`user:${sessionId}`, { ...userState, ...userUpdates });
    }

    return c.json({ reservation, drop: updatedDrop });
  } catch (e) {
    console.log("Error creating reservation:", e);
    return c.json({ error: `Failed to create reservation: ${e}` }, 500);
  }
});

app.get(`${BASE}/reservations`, async (c) => {
  try {
    const sessionId = c.req.query("sessionId");
    const all = await kv.getByPrefix("res:");
    const filtered = sessionId ? all.filter((r) => r.sessionId === sessionId) : all;
    return c.json({ reservations: filtered });
  } catch (e) {
    console.log("Error getting reservations:", e);
    return c.json({ error: `Failed to get reservations: ${e}` }, 500);
  }
});

app.get(`${BASE}/reservations/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const res = await kv.get(`res:${id}`);
    if (!res) return c.json({ error: "Reservation not found" }, 404);
    return c.json({ reservation: res });
  } catch (e) {
    return c.json({ error: `Failed to get reservation: ${e}` }, 500);
  }
});

app.post(`${BASE}/reservations/:id/cancel`, async (c) => {
  try {
    const id = c.req.param("id");
    const res = await kv.get(`res:${id}`);
    if (!res) return c.json({ error: "Reservation not found" }, 404);
    if (res.status !== "reserved") return c.json({ error: "Reservation is not active" }, 400);

    const updatedRes = { ...res, status: "cancelled", cancelledAt: new Date().toISOString() };
    await kv.set(`res:${id}`, updatedRes);
    await kv.set(`code:${res.pickupCode}`, {
      reservationId: id,
      dropId: res.dropId,
      status: "expired",
    });

    // Return box to drop
    const drop = await kv.get(`drop:${res.dropId}`);
    if (drop) {
      await kv.set(`drop:${res.dropId}`, {
        ...drop,
        remainingBoxes: drop.remainingBoxes + 1,
        reservedBoxes: Math.max(0, drop.reservedBoxes - 1),
      });
    }

    // Return credit if paid with credit
    if (res.paymentMethod === "credit") {
      const userState = await kv.get(`user:${res.sessionId}`);
      if (userState) {
        await kv.set(`user:${res.sessionId}`, {
          ...userState,
          creditsRemaining: (userState.creditsRemaining ?? 0) + 1,
        });
      }
    }

    return c.json({ reservation: updatedRes });
  } catch (e) {
    console.log("Error cancelling reservation:", e);
    return c.json({ error: `Failed to cancel reservation: ${e}` }, 500);
  }
});

app.post(`${BASE}/reservations/:id/rate`, async (c) => {
  try {
    const id = c.req.param("id");
    const { rating, sessionId } = await c.req.json();
    const res = await kv.get(`res:${id}`);
    if (!res) return c.json({ error: "Reservation not found" }, 404);

    const updated = { ...res, rating, ratedAt: new Date().toISOString() };
    await kv.set(`res:${id}`, updated);

    // Increment user pickup count
    const userState = await kv.get(`user:${sessionId}`) ?? defaultUserState();
    await kv.set(`user:${sessionId}`, {
      ...userState,
      totalPickups: (userState.totalPickups ?? 0) + 1,
    });

    // Update average rating in stats
    const stats = await getStats();
    await updateStats({
      newRating: {
        value: rating,
        previousAvg: stats.avgRating,
        previousCount: stats.totalBoxesPickedUp,
      },
    });

    return c.json({ reservation: updated });
  } catch (e) {
    console.log("Error submitting rating:", e);
    return c.json({ error: `Failed to submit rating: ${e}` }, 500);
  }
});

app.post(`${BASE}/reservations/:id/no-show`, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const boxStatus = body.boxStatus ?? "released";

    const res = await kv.get(`res:${id}`);
    if (!res) return c.json({ error: "Reservation not found" }, 404);

    const updated = {
      ...res,
      status: "no_show",
      boxStatus,
      noShowAt: new Date().toISOString(),
    };
    await kv.set(`res:${id}`, updated);
    await kv.set(`code:${res.pickupCode}`, {
      reservationId: id,
      dropId: res.dropId,
      status: "expired",
    });

    await updateStats({ noShow: true });

    // Increment user no-show count
    const userState = await kv.get(`user:${res.sessionId}`);
    if (userState) {
      await kv.set(`user:${res.sessionId}`, {
        ...userState,
        noShowCount: (userState.noShowCount ?? 0) + 1,
      });
    }

    return c.json({ reservation: updated });
  } catch (e) {
    console.log("Error marking no-show:", e);
    return c.json({ error: `Failed to mark no-show: ${e}` }, 500);
  }
});

// ─── Redeem ───────────────────────────────────────────────────────────────────

app.post(`${BASE}/redeem`, async (c) => {
  try {
    const { code } = await c.req.json();
    const upperCode = code.toUpperCase().trim();

    const codeRecord = await kv.get(`code:${upperCode}`);
    if (!codeRecord) {
      return c.json({ valid: false, reason: "Code not found" });
    }
    if (codeRecord.status === "redeemed") {
      return c.json({ valid: false, reason: "Already redeemed" });
    }
    if (codeRecord.status === "expired") {
      return c.json({ valid: false, reason: "Code expired or cancelled" });
    }

    const res = await kv.get(`res:${codeRecord.reservationId}`);
    if (!res) return c.json({ valid: false, reason: "Reservation not found" });
    if (res.status !== "reserved") {
      return c.json({ valid: false, reason: res.status === "picked_up" ? "Already redeemed" : "Code expired" });
    }

    // Mark code as redeemed
    await kv.set(`code:${upperCode}`, { ...codeRecord, status: "redeemed" });

    // Mark reservation as picked up
    const updatedRes = { ...res, status: "picked_up", pickedUpAt: new Date().toISOString() };
    await kv.set(`res:${codeRecord.reservationId}`, updatedRes);

    await updateStats({ boxPickedUp: true });

    // Increment user pickup count
    const userState = await kv.get(`user:${res.sessionId}`);
    if (userState) {
      await kv.set(`user:${res.sessionId}`, {
        ...userState,
        totalPickups: (userState.totalPickups ?? 0) + 1,
      });
    }

    const drop = await kv.get(`drop:${res.dropId}`);
    return c.json({
      valid: true,
      reservation: updatedRes,
      drop,
      location: res.dropLocation,
    });
  } catch (e) {
    console.log("Error redeeming code:", e);
    return c.json({ error: `Failed to redeem code: ${e}` }, 500);
  }
});

// ─── Waitlist ─────────────────────────────────────────────────────────────────

app.post(`${BASE}/waitlist`, async (c) => {
  try {
    const { dropId, sessionId } = await c.req.json();
    const key = `waitlist:${dropId}:${sessionId}`;
    const existing = await kv.get(key);
    if (existing) return c.json({ alreadyOnWaitlist: true });

    await kv.set(key, {
      id: `wl-${Date.now()}`,
      dropId,
      sessionId,
      createdAt: new Date().toISOString(),
      notified: false,
    });
    return c.json({ success: true });
  } catch (e) {
    console.log("Error joining waitlist:", e);
    return c.json({ error: `Failed to join waitlist: ${e}` }, 500);
  }
});

// ─── No-shows ─────────────────────────────────────────────────────────────────

app.get(`${BASE}/no-shows`, async (c) => {
  try {
    const allReservations = await kv.getByPrefix("res:");
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const noShows = [];

    for (const res of allReservations) {
      if (res.status !== "reserved" && res.status !== "no_show") continue;

      const drop = await kv.get(`drop:${res.dropId}`);
      if (!drop) continue;
      if (drop.date !== todayStr) continue;

      // Check if window has ended
      const [endH, endM] = (drop.windowEnd ?? "23:59").split(":").map(Number);
      const windowEndMs = new Date();
      windowEndMs.setHours(endH, endM, 0, 0);

      const windowEnded = now > windowEndMs;
      const alreadyMarked = res.status === "no_show";

      if (windowEnded || alreadyMarked) {
        const userState = await kv.get(`user:${res.sessionId}`);
        noShows.push({
          reservationId: res.id,
          code: res.pickupCode,
          location: drop.location,
          time: `${endH % 12 || 12}:${String(endM).padStart(2, "0")} ${endH >= 12 ? "PM" : "AM"}`,
          repeatOffender: (userState?.noShowCount ?? 0) >= 2,
          boxStatus: res.boxStatus ?? (alreadyMarked ? "released" : null),
          alreadyMarked,
        });
      }
    }

    return c.json({ noShows });
  } catch (e) {
    console.log("Error fetching no-shows:", e);
    return c.json({ error: `Failed to fetch no-shows: ${e}` }, 500);
  }
});

// ─── User State ───────────────────────────────────────────────────────────────

app.get(`${BASE}/user/:sessionId`, async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const user = await kv.get(`user:${sessionId}`);
    return c.json({ user: user ?? defaultUserState() });
  } catch (e) {
    console.log("Error getting user:", e);
    return c.json({ error: `Failed to get user: ${e}` }, 500);
  }
});

app.put(`${BASE}/user/:sessionId`, async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const body = await c.req.json();
    const existing = await kv.get(`user:${sessionId}`) ?? defaultUserState();
    const updated = { ...existing, ...body };
    await kv.set(`user:${sessionId}`, updated);
    return c.json({ user: updated });
  } catch (e) {
    console.log("Error updating user:", e);
    return c.json({ error: `Failed to update user: ${e}` }, 500);
  }
});

// ─── Admin Stats ──────────────────────────────────────────────────────────────

app.get(`${BASE}/admin/stats`, async (c) => {
  try {
    const stats = await getStats();
    const allDrops = await kv.getByPrefix("drop:");
    const allRes = await kv.getByPrefix("res:");

    // Build per-day breakdown from real data
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayMap: Record<string, { posted: number; pickedUp: number; noShows: number }> = {};

    for (const drop of allDrops) {
      if (!drop.date) continue;
      const d = new Date(drop.date + "T12:00:00");
      const label = days[d.getDay()];
      if (!dayMap[label]) dayMap[label] = { posted: 0, pickedUp: 0, noShows: 0 };
      dayMap[label].posted += drop.totalBoxes ?? 0;
    }
    for (const res of allRes) {
      if (!res.createdAt) continue;
      const d = new Date(res.createdAt);
      const label = days[d.getDay()];
      if (!dayMap[label]) dayMap[label] = { posted: 0, pickedUp: 0, noShows: 0 };
      if (res.status === "picked_up") dayMap[label].pickedUp++;
      if (res.status === "no_show") dayMap[label].noShows++;
    }

    const recentDrops =
      Object.keys(dayMap).length > 0
        ? Object.entries(dayMap).map(([date, data]) => ({ date, ...data }))
        : stats.recentDrops;

    // Recompute locationCaps from actual drop data
    const locationCaps = stats.locationCaps.map((cap: { location: string; currentCap: number; consecutiveWeeksAbove85: number }) => {
      const locationDrops = allDrops.filter((d) => d.location === cap.location);
      const locationRes = allRes.filter(
        (r) => r.dropLocation === cap.location && r.status === "picked_up"
      );
      const totalPosted = locationDrops.reduce((s: number, d: { totalBoxes: number }) => s + (d.totalBoxes ?? 0), 0);
      const pickupRate = totalPosted > 0 ? (locationRes.length / totalPosted) * 100 : 0;
      const weeksAbove85 = pickupRate >= 85 ? cap.consecutiveWeeksAbove85 : 0;
      return { ...cap, consecutiveWeeksAbove85: weeksAbove85 };
    });

    return c.json({ stats: { ...stats, recentDrops, locationCaps } });
  } catch (e) {
    console.log("Error getting admin stats:", e);
    return c.json({ error: `Failed to get admin stats: ${e}` }, 500);
  }
});

Deno.serve(app.fetch);
