import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

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

// -- Supabase clients ---------------------------------------------------

function getAdminSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SECRET_KEY")!
  );
}

// -- Auth helpers -------------------------------------------------------

async function getAuthUser(c: { req: { header: (name: string) => string | undefined } }) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabase = getAdminSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function isAdmin(user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } | null): boolean {
  if (!user) return false;
  const role = (user.user_metadata?.role as string) ?? (user.app_metadata?.role as string);
  return role === "admin";
}

// -- Health -------------------------------------------------------------
app.get(`${BASE}/health`, (c) => c.json({ status: "ok" }));

// -- Helpers ------------------------------------------------------------

function defaultUserState() {
  return {
    isFirstTime: false,
    totalPickups: 0,
    noShowCount: 0,
    hasAccount: true,
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
  return 7;
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

// -- Auth: Signup -------------------------------------------------------

app.post(`${BASE}/signup`, async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return c.json({ error: "Valid email is required" }, 400);
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return c.json({ error: "Name is required" }, 400);
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      user_metadata: { name: name.trim() },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log("Signup error:", error.message);
      return c.json({ error: error.message }, 400);
    }

    const userId = data.user.id;

    // Initialize KV user state
    await kv.set(`user:${userId}`, {
      ...defaultUserState(),
      hasAccount: true,
      isFirstTime: false,
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });

    console.log("User created successfully:", userId);
    return c.json({ userId, email: data.user.email });
  } catch (e) {
    console.log("Error in signup:", e);
    return c.json({ error: `Signup failed: ${e}` }, 500);
  }
});

// -- Drops --------------------------------------------------------------

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
    const user = await getAuthUser(c);
    if (!isAdmin(user)) return c.json({ error: "Admin access required" }, 403);
    const body = await c.req.json();
    const {
      location, locationDetail, boxes, windowStart, windowEnd,
      description, imageUrl, dailyCap, consecutiveWeeksAbove85,
    } = body;

    if (!location || !["Brandywine", "Anteatery"].includes(location)) {
      return c.json({ error: "Location must be 'Brandywine' or 'Anteatery'" }, 400);
    }
    const boxCount = parseInt(boxes);
    if (isNaN(boxCount) || boxCount < 1 || boxCount > 100) {
      return c.json({ error: "Box count must be between 1 and 100" }, 400);
    }
    if (!windowStart || !windowEnd || !/^\d{2}:\d{2}$/.test(windowStart) || !/^\d{2}:\d{2}$/.test(windowEnd)) {
      return c.json({ error: "Window times must be in HH:MM format" }, 400);
    }
    if (windowStart >= windowEnd) {
      return c.json({ error: "Window end must be after start" }, 400);
    }
    const safeDescription = typeof description === "string" ? description.slice(0, 500) : "";

    const id = `drop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const drop = {
      id,
      location,
      locationDetail: locationDetail ?? `${location} pickup area`,
      date: new Date().toISOString().split("T")[0],
      windowStart,
      windowEnd,
      totalBoxes: boxCount,
      remainingBoxes: boxCount,
      reservedBoxes: 0,
      priceMin: 7,
      priceMax: 7,
      status: "active",
      description: safeDescription || "Tonight's Rescue Box, freshly prepared by dining staff.",
      imageUrl: imageUrl ?? "",
      dailyCap: dailyCap ?? 30,
      consecutiveWeeksAbove85: consecutiveWeeksAbove85 ?? 0,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`drop:${id}`, drop);
    await updateStats({ boxesPosted: boxCount, dropCreated: true });

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
    const user = await getAuthUser(c);
    if (!isAdmin(user)) return c.json({ error: "Admin access required" }, 403);
    const id = c.req.param("id");
    const body = await c.req.json();
    const drop = await kv.get(`drop:${id}`);
    if (!drop) return c.json({ error: "Drop not found" }, 404);
    const updated = { ...drop, ...body, priceMin: 7, priceMax: 7 };
    await kv.set(`drop:${id}`, updated);
    return c.json({ drop: updated });
  } catch (e) {
    console.log("Error updating drop:", e);
    return c.json({ error: `Failed to update drop: ${e}` }, 500);
  }
});

app.delete(`${BASE}/drops/:id`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!isAdmin(user)) return c.json({ error: "Admin access required" }, 403);
    const id = c.req.param("id");
    const drop = await kv.get(`drop:${id}`);
    if (!drop) return c.json({ error: "Drop not found" }, 404);

    // Cancel all active reservations for this drop and release codes
    const allRes = await kv.getByPrefix("res:");
    for (const res of allRes) {
      if (res.dropId === id && res.status === "reserved") {
        await kv.set(`res:${res.id}`, { ...res, status: "cancelled", cancelledAt: new Date().toISOString() });
        if (res.pickupCode) {
          await kv.set(`code:${res.pickupCode}`, { reservationId: res.id, dropId: id, status: "expired" });
        }
        // Return credit if paid with credit
        if (res.paymentMethod === "credit" && res.userId) {
          const userState = await kv.get(`user:${res.userId}`);
          if (userState) {
            await kv.set(`user:${res.userId}`, {
              ...userState,
              creditsRemaining: (userState.creditsRemaining ?? 0) + 1,
            });
          }
        }
      }
    }

    await kv.del(`drop:${id}`);
    console.log("Drop deleted:", id);
    return c.json({ success: true, deletedId: id });
  } catch (e) {
    console.log("Error deleting drop:", e);
    return c.json({ error: `Failed to delete drop: ${e}` }, 500);
  }
});

// -- Reservations -------------------------------------------------------

app.post(`${BASE}/reservations`, async (c) => {
  try {
    const body = await c.req.json();
    const { dropId, userId, paymentMethod, cardLast4 } = body;

    if (!dropId || typeof dropId !== "string") {
      return c.json({ error: "dropId is required" }, 400);
    }
    if (!userId || typeof userId !== "string") {
      return c.json({ error: "userId is required" }, 400);
    }
    if (!paymentMethod || !["card", "credit", "pay_at_pickup"].includes(paymentMethod)) {
      return c.json({ error: "paymentMethod must be 'card', 'credit', or 'pay_at_pickup'" }, 400);
    }

    const drop = await kv.get(`drop:${dropId}`);
    if (!drop) return c.json({ error: "Drop not found" }, 404);
    if (drop.remainingBoxes <= 0) return c.json({ error: "Drop is sold out" }, 409);

    // Check for existing active reservation on this drop by this user
    const allRes = await kv.getByPrefix("res:");
    const existing = allRes.find(
      (r) => r.userId === userId && r.dropId === dropId && r.status === "reserved"
    );
    if (existing) return c.json({ error: "Already have an active reservation for this drop" }, 409);

    const code = generatePickupCode();
    const currentPrice = calculateCurrentPrice(drop);
    const resId = `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const reservation = {
      id: resId,
      dropId,
      userId,
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

    const updatedDrop = {
      ...drop,
      remainingBoxes: drop.remainingBoxes - 1,
      reservedBoxes: drop.reservedBoxes + 1,
    };
    await kv.set(`drop:${dropId}`, updatedDrop);

    await updateStats({ reservationCreated: true });

    // Update user state
    const userState = await kv.get(`user:${userId}`) ?? defaultUserState();
    const userUpdates: Record<string, unknown> = {};
    if (paymentMethod === "card" && cardLast4 && !userState.hasCardSaved) {
      userUpdates.hasCardSaved = true;
      userUpdates.cardLast4 = cardLast4;
    }
    if (paymentMethod === "credit") {
      userUpdates.creditsRemaining = Math.max(0, (userState.creditsRemaining ?? 0) - 1);
    }
    if (Object.keys(userUpdates).length > 0) {
      await kv.set(`user:${userId}`, { ...userState, ...userUpdates });
    }

    return c.json({ reservation, drop: updatedDrop });
  } catch (e) {
    console.log("Error creating reservation:", e);
    return c.json({ error: `Failed to create reservation: ${e}` }, 500);
  }
});

app.get(`${BASE}/reservations`, async (c) => {
  try {
    const userId = c.req.query("userId");
    if (userId && !userId.startsWith("guest-")) {
      const authUser = await getAuthUser(c);
      if (!authUser || (authUser.id !== userId && !isAdmin(authUser))) {
        return c.json({ error: "Unauthorized" }, 403);
      }
    }
    const all = await kv.getByPrefix("res:");
    const filtered = userId ? all.filter((r) => r.userId === userId) : all;
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

    const resUserId = res.userId as string;
    if (!resUserId.startsWith("guest-")) {
      const authUser = await getAuthUser(c);
      if (!authUser || (authUser.id !== resUserId && !isAdmin(authUser))) {
        return c.json({ error: "Unauthorized" }, 403);
      }
    }

    const updatedRes = { ...res, status: "cancelled", cancelledAt: new Date().toISOString() };
    await kv.set(`res:${id}`, updatedRes);
    await kv.set(`code:${res.pickupCode}`, {
      reservationId: id,
      dropId: res.dropId,
      status: "expired",
    });

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
      const userState = await kv.get(`user:${res.userId}`);
      if (userState) {
        await kv.set(`user:${res.userId}`, {
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
    const { rating, userId } = await c.req.json();

    if (!userId || typeof userId !== "string") {
      return c.json({ error: "userId is required" }, 400);
    }

    if (!userId.startsWith("guest-")) {
      const authUser = await getAuthUser(c);
      if (!authUser || authUser.id !== userId) {
        return c.json({ error: "Unauthorized" }, 403);
      }
    }
    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return c.json({ error: "Rating must be between 1 and 5" }, 400);
    }

    const res = await kv.get(`res:${id}`);
    if (!res) return c.json({ error: "Reservation not found" }, 404);

    const updated = { ...res, rating: numRating, ratedAt: new Date().toISOString() };
    await kv.set(`res:${id}`, updated);

    // Note: totalPickups is incremented in /redeem when the pickup code is verified,
    // not here, to avoid double-counting.

    const stats = await getStats();
    await updateStats({
      newRating: {
        value: numRating,
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
    const user = await getAuthUser(c);
    if (!isAdmin(user)) return c.json({ error: "Admin access required" }, 403);
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const boxStatus = body.boxStatus ?? "released";

    if (!["released", "donated", "disposed"].includes(boxStatus)) {
      return c.json({ error: "boxStatus must be 'released', 'donated', or 'disposed'" }, 400);
    }

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

    const userState = await kv.get(`user:${res.userId}`);
    if (userState) {
      await kv.set(`user:${res.userId}`, {
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

// -- Redeem -------------------------------------------------------------

app.post(`${BASE}/redeem`, async (c) => {
  try {
    const { code } = await c.req.json();

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return c.json({ valid: false, reason: "Pickup code is required" });
    }
    if (code.trim().length > 20) {
      return c.json({ valid: false, reason: "Invalid code format" });
    }

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

    await kv.set(`code:${upperCode}`, { ...codeRecord, status: "redeemed" });

    const updatedRes = { ...res, status: "picked_up", pickedUpAt: new Date().toISOString() };
    await kv.set(`res:${codeRecord.reservationId}`, updatedRes);

    await updateStats({ boxPickedUp: true });

    const userState = await kv.get(`user:${res.userId}`);
    if (userState) {
      await kv.set(`user:${res.userId}`, {
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

// -- Waitlist signup ----------------------------------------------------

app.post(`${BASE}/waitlist-signup`, async (c) => {
  try {
    const { email, name } = await c.req.json();

    if (!email || typeof email !== "string" || !email.includes("@") || !email.includes(".")) {
      return c.json({ error: "Invalid email address" }, 400);
    }
    if (typeof name === "string" && name.length > 200) {
      return c.json({ error: "Name is too long" }, 400);
    }

    const normalised = email.trim().toLowerCase();
    const key = `waitlist-signup:${normalised}`;
    const existing = await kv.get(key);
    if (existing) {
      const all = await kv.getByPrefix("waitlist-signup:");
      return c.json({ alreadyRegistered: true, count: all.length });
    }
    await kv.set(key, {
      email: normalised,
      name: (name ?? "").trim(),
      joinedAt: new Date().toISOString(),
    });
    const all = await kv.getByPrefix("waitlist-signup:");
    const position = all.length;

    return c.json({ success: true, position, count: position });
  } catch (e) {
    console.log("Error saving waitlist signup:", e);
    return c.json({ error: `Failed to save signup: ${e}` }, 500);
  }
});

app.get(`${BASE}/waitlist-count`, async (c) => {
  try {
    const signups = await kv.getByPrefix("waitlist-signup:");
    return c.json({ count: signups.length });
  } catch (e) {
    return c.json({ error: `Failed to fetch count: ${e}` }, 500);
  }
});

app.get(`${BASE}/waitlist-signups`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!isAdmin(user)) return c.json({ error: "Admin access required" }, 403);
    const signups = await kv.getByPrefix("waitlist-signup:");
    return c.json({ signups, count: signups.length });
  } catch (e) {
    return c.json({ error: `Failed to fetch signups: ${e}` }, 500);
  }
});

// -- Waitlist -----------------------------------------------------------

app.post(`${BASE}/waitlist`, async (c) => {
  try {
    const { dropId, userId } = await c.req.json();

    if (!dropId || typeof dropId !== "string") {
      return c.json({ error: "dropId is required" }, 400);
    }
    if (!userId || typeof userId !== "string") {
      return c.json({ error: "userId is required" }, 400);
    }

    const key = `waitlist:${dropId}:${userId}`;
    const existing = await kv.get(key);
    if (existing) return c.json({ alreadyOnWaitlist: true });

    await kv.set(key, {
      id: `wl-${Date.now()}`,
      dropId,
      userId,
      createdAt: new Date().toISOString(),
      notified: false,
    });
    return c.json({ success: true });
  } catch (e) {
    console.log("Error joining waitlist:", e);
    return c.json({ error: `Failed to join waitlist: ${e}` }, 500);
  }
});

// -- No-shows -----------------------------------------------------------

app.get(`${BASE}/no-shows`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!isAdmin(user)) return c.json({ error: "Admin access required" }, 403);
    const allReservations = await kv.getByPrefix("res:");
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const noShows = [];

    for (const res of allReservations) {
      if (res.status !== "reserved" && res.status !== "no_show") continue;

      const drop = await kv.get(`drop:${res.dropId}`);
      if (!drop) continue;
      if (drop.date !== todayStr) continue;

      const [endH, endM] = (drop.windowEnd ?? "23:59").split(":").map(Number);
      const windowEndMs = new Date();
      windowEndMs.setHours(endH, endM, 0, 0);

      const windowEnded = now > windowEndMs;
      const alreadyMarked = res.status === "no_show";

      if (windowEnded || alreadyMarked) {
        const userState = await kv.get(`user:${res.userId}`);
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

// -- User State ---------------------------------------------------------

app.get(`${BASE}/user/:userId`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const isGuest = userId.startsWith("guest-");
    if (!isGuest) {
      const authUser = await getAuthUser(c);
      if (!authUser || (authUser.id !== userId && !isAdmin(authUser))) {
        return c.json({ error: "Unauthorized" }, 403);
      }
    }
    const user = await kv.get(`user:${userId}`);
    return c.json({ user: user ?? defaultUserState() });
  } catch (e) {
    console.log("Error getting user:", e);
    return c.json({ error: `Failed to get user: ${e}` }, 500);
  }
});

app.put(`${BASE}/user/:userId`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const isGuest = userId.startsWith("guest-");
    if (!isGuest) {
      const authUser = await getAuthUser(c);
      if (!authUser || (authUser.id !== userId && !isAdmin(authUser))) {
        return c.json({ error: "Unauthorized" }, 403);
      }
    }
    const body = await c.req.json();
    const existing = await kv.get(`user:${userId}`) ?? defaultUserState();
    const updated = { ...existing, ...body };
    await kv.set(`user:${userId}`, updated);
    return c.json({ user: updated });
  } catch (e) {
    console.log("Error updating user:", e);
    return c.json({ error: `Failed to update user: ${e}` }, 500);
  }
});

// -- Admin Stats --------------------------------------------------------

app.get(`${BASE}/admin/stats`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!isAdmin(user)) return c.json({ error: "Admin access required" }, 403);
    const stats = await getStats();
    const allDrops = await kv.getByPrefix("drop:");
    const allRes = await kv.getByPrefix("res:");

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

// -- AI Food Photo Analysis ---------------------------------------------

app.post(`${BASE}/analyze-food-photo`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!isAdmin(user)) return c.json({ error: "Admin access required" }, 403);
    const { imageBase64 } = await c.req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return c.json({ error: "Missing imageBase64 field" }, 400);
    }

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterKey) {
      return c.json({ error: "OPENROUTER_API_KEY not configured" }, 500);
    }

    let mimeType = "image/jpeg";
    let rawBase64 = imageBase64;
    if (imageBase64.startsWith("data:")) {
      const match = imageBase64.match(/^data:(image\/\w+);base64,/);
      if (match) {
        mimeType = match[1];
        rawBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      }
    }

    const payload = {
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${rawBase64}`,
              },
            },
            {
              type: "text",
              text: `You are an AI assistant for EcoPlate, a campus food rescue program at UC Irvine.

Analyze this photo of dining hall food and return a JSON object with:
1. "description": A concise, appetizing 1-2 sentence description of what's in the photo suitable for a Rescue Box listing. Include the station type (e.g., "Pasta bar:", "Stir-fry station:", "Grill station:") followed by specific items.
2. "suggestedBoxes": Estimated number of Rescue Boxes that could be made from what you see (integer between 5-30).
3. "suggestedPriceMin": Suggested minimum price in dollars (integer, always 7).
4. "suggestedPriceMax": Suggested maximum price in dollars (integer, always 7).
5. "tags": Array of relevant dietary tags from: ["Vegetarian", "Vegan", "Gluten-Free", "High Protein", "Dairy-Free"].

Return ONLY valid JSON, no markdown fences, no explanation.`,
            },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log("OpenRouter API error:", response.status, errText);
      return c.json({ error: `AI analysis failed (${response.status}): ${errText}` }, 502);
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content ?? "";
    console.log("AI raw response:", content);

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.log("Failed to parse AI response as JSON:", parseErr, "raw:", content);
      return c.json({
        error: "AI returned invalid JSON",
        raw: content,
      }, 502);
    }

    return c.json({
      description: parsed.description ?? "",
      suggestedBoxes: Math.min(30, Math.max(1, parseInt(parsed.suggestedBoxes) || 15)),
      suggestedPriceMin: 7,
      suggestedPriceMax: 7,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    });
  } catch (e) {
    console.log("Error in analyze-food-photo:", e);
    return c.json({ error: `Failed to analyze photo: ${e}` }, 500);
  }
});

Deno.serve(app.fetch);
