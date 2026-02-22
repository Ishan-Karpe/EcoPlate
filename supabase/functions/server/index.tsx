import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import nodemailer from "npm:nodemailer";

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

// ─── Waitlist email signup ────────────────────────────────────────────────────

function buildWaitlistEmail(firstName: string, email: string, position: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>You're on the EcoPlate waitlist</title>
</head>
<body style="margin:0;padding:0;background-color:#F9F6F1;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F9F6F1;">
  <tr>
    <td align="center" style="padding:48px 20px 64px;">

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

        <!-- LOGO HEADER -->
        <tr>
          <td style="background-color:#006838;border-radius:20px 20px 0 0;padding:32px 40px 28px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:rgba(255,255,255,0.15);border-radius:10px;width:38px;height:38px;text-align:center;vertical-align:middle;font-size:18px;font-weight:900;color:#fff;letter-spacing:-1px;">
                  EP
                </td>
                <td style="padding-left:10px;vertical-align:middle;">
                  <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.02em;">EcoPlate</span>
                </td>
              </tr>
            </table>
            <p style="margin:10px 0 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;">UCI Campus Food Rescue</p>
          </td>
        </tr>

        <!-- HERO MESSAGE -->
        <tr>
          <td style="background-color:#ffffff;padding:36px 40px 8px;">
            <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#1C2B1C;line-height:1.2;letter-spacing:-0.02em;">
              You're confirmed, ${firstName}.
            </h1>
            <p style="margin:0 0 28px;font-size:15px;color:#7A6B5A;line-height:1.65;">
              Welcome to the EcoPlate waitlist. We'll notify
              <span style="color:#006838;font-weight:600;">${email}</span>
              the moment we go live at Brandywine and Anteatery on the UCI campus.
            </p>
          </td>
        </tr>

        <!-- POSITION BADGE -->
        <tr>
          <td style="background-color:#ffffff;padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E8F5EE;border-radius:14px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:48px;height:48px;background-color:#006838;border-radius:12px;text-align:center;vertical-align:middle;">
                        <span style="color:#ffffff;font-size:15px;font-weight:800;">#${position}</span>
                      </td>
                      <td style="padding-left:16px;vertical-align:middle;">
                        <p style="margin:0;font-size:14px;font-weight:700;color:#1C2B1C;">Your position in the waitlist</p>
                        <p style="margin:4px 0 0;font-size:12px;color:#5A9E78;line-height:1.4;">Earlier spots receive first access and introductory $3 pricing</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr>
          <td style="background-color:#ffffff;padding:0 40px;">
            <hr style="border:none;border-top:1px solid #F0EBE3;margin:0 0 28px;">
          </td>
        </tr>

        <!-- PERKS SECTION -->
        <tr>
          <td style="background-color:#ffffff;padding:0 40px 8px;">
            <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#8B6F47;letter-spacing:0.08em;text-transform:uppercase;">What you unlock as an early member</p>
          </td>
        </tr>

        <!-- Perk 1 -->
        <tr>
          <td style="background-color:#ffffff;padding:0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
              <tr>
                <td style="width:6px;vertical-align:top;padding-top:5px;">
                  <div style="width:6px;height:6px;background-color:#006838;border-radius:50%;"></div>
                </td>
                <td style="padding-left:12px;font-size:13px;color:#2D3A2D;line-height:1.55;">
                  <strong style="color:#1C2B1C;">Priority pickup window</strong> — access tonight's Rescue Boxes before the general public
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Perk 2 -->
        <tr>
          <td style="background-color:#ffffff;padding:0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
              <tr>
                <td style="width:6px;vertical-align:top;padding-top:5px;">
                  <div style="width:6px;height:6px;background-color:#006838;border-radius:50%;"></div>
                </td>
                <td style="padding-left:12px;font-size:13px;color:#2D3A2D;line-height:1.55;">
                  <strong style="color:#1C2B1C;">Instant drop alerts</strong> — notified the moment a box goes live at Brandywine or Anteatery
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Perk 3 -->
        <tr>
          <td style="background-color:#ffffff;padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:6px;vertical-align:top;padding-top:5px;">
                  <div style="width:6px;height:6px;background-color:#006838;border-radius:50%;"></div>
                </td>
                <td style="padding-left:12px;font-size:13px;color:#2D3A2D;line-height:1.55;">
                  <strong style="color:#1C2B1C;">Introductory $3 pricing</strong> — locked in for your first 60 days of pickup
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- WHAT HAPPENS NEXT -->
        <tr>
          <td style="background-color:#ffffff;padding:0 40px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F9F6F1;border-radius:14px;border:1px solid #EDE8E0;">
              <tr>
                <td style="padding:22px 24px;">
                  <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#4A3728;letter-spacing:0.08em;text-transform:uppercase;">What happens next</p>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
                    <tr>
                      <td style="width:22px;height:22px;background-color:#006838;border-radius:50%;text-align:center;vertical-align:middle;">
                        <span style="color:#fff;font-size:10px;font-weight:800;">1</span>
                      </td>
                      <td style="padding-left:12px;font-size:12px;color:#7A6B5A;line-height:1.5;">Your spot is confirmed — no further action needed</td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
                    <tr>
                      <td style="width:22px;height:22px;background-color:#006838;border-radius:50%;text-align:center;vertical-align:middle;">
                        <span style="color:#fff;font-size:10px;font-weight:800;">2</span>
                      </td>
                      <td style="padding-left:12px;font-size:12px;color:#7A6B5A;line-height:1.5;">Dining hall managers are onboarding this quarter at UCI</td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:22px;height:22px;background-color:#006838;border-radius:50%;text-align:center;vertical-align:middle;">
                        <span style="color:#fff;font-size:10px;font-weight:800;">3</span>
                      </td>
                      <td style="padding-left:12px;font-size:12px;color:#7A6B5A;line-height:1.5;">You'll receive 48-hour early access before the public launch</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color:#F0EBE3;border-radius:0 0 20px 20px;padding:24px 40px;">
            <p style="margin:0;font-size:11px;color:#B0A898;line-height:1.7;text-align:center;">
              You're receiving this because you joined the waitlist at ecoplate.uci.edu.<br>
              No spam — ever. Unsubscribe any time by replying to this email.
            </p>
            <p style="margin:10px 0 0;font-size:10px;color:#C4BAB0;text-align:center;letter-spacing:0.03em;">
              &copy; 2026 EcoPlate &middot; UCI Campus Food Rescue Program
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

app.post(`${BASE}/waitlist-signup`, async (c) => {
  try {
    const { email, name } = await c.req.json();
    if (!email || !email.includes("@")) {
      return c.json({ error: "Invalid email address" }, 400);
    }
    const normalised = email.trim().toLowerCase();
    const key = `waitlist-signup:${normalised}`;
    const existing = await kv.get(key);
    if (existing) {
      // Return their original position
      const all = await kv.getByPrefix("waitlist-signup:");
      return c.json({ alreadyRegistered: true, count: all.length });
    }
    const firstName = ((name ?? "").trim().split(" ")[0]) || "there";
    await kv.set(key, {
      email: normalised,
      name: (name ?? "").trim(),
      joinedAt: new Date().toISOString(),
    });
    const all = await kv.getByPrefix("waitlist-signup:");
    const position = all.length;

    // Send confirmation email via Gmail SMTP (nodemailer)
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (gmailAppPassword) {
      try {
        const emailHtml = buildWaitlistEmail(firstName, normalised, position);
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "ecoplate.info@gmail.com",
            pass: gmailAppPassword,
          },
        });
        await transporter.sendMail({
          from: '"EcoPlate" <ecoplate.info@gmail.com>',
          to: normalised,
          subject: `You're on the waitlist — position #${position} at EcoPlate`,
          html: emailHtml,
        });
        console.log("Waitlist confirmation email sent to:", normalised);
      } catch (emailErr) {
        console.log("Email send error (non-fatal):", emailErr);
      }
    }

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
    const signups = await kv.getByPrefix("waitlist-signup:");
    return c.json({ signups, count: signups.length });
  } catch (e) {
    return c.json({ error: `Failed to fetch signups: ${e}` }, 500);
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