import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { get, getByPrefix, set } from "$lib/kv";
import { defaultUserState, updateStats } from "$lib/server/helpers";
import { calculateCurrentPrice, generatePickupCode } from "$lib/utils";
import { sendReservationConfirmation } from "$lib/server/email";

export async function POST(event: RequestEvent) {
  try {
    const body = await event.request.json();
    const { dropId, userId, paymentMethod, cardLast4 } = body;

    if (!dropId || typeof dropId !== "string") {
      return json({ error: "dropId is required" }, { status: 400 });
    }
    if (!userId || typeof userId !== "string") {
      return json({ error: "userId is required" }, { status: 400 });
    }

    const session = event.locals.session;
    const isGuest = userId.startsWith("guest-");
    if (!isGuest && (!session?.user || session.user.id !== userId)) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }
    if (!paymentMethod || !["card", "credit", "pay_at_pickup"].includes(paymentMethod)) {
      return json(
        { error: "paymentMethod must be 'card', 'credit', or 'pay_at_pickup'" },
        { status: 400 }
      );
    }

    const drop = (await get(`drop:${dropId}`)) as Record<string, unknown> | undefined;
    if (!drop) return json({ error: "Drop not found" }, { status: 404 });
    if ((drop.remainingBoxes as number) <= 0)
      return json({ error: "Drop is sold out" }, { status: 409 });

    const allRes = (await getByPrefix("res:")) as Array<Record<string, unknown>>;
    const existing = allRes.find(
      (r) => r.userId === userId && r.dropId === dropId && r.status === "reserved"
    );
    if (existing)
      return json({ error: "Already have an active reservation for this drop" }, { status: 409 });

    const code = generatePickupCode();
    const currentPrice = calculateCurrentPrice({
      totalBoxes: drop.totalBoxes as number,
      remainingBoxes: drop.remainingBoxes as number,
      reservedBoxes: drop.reservedBoxes as number,
      priceMin: drop.priceMin as number,
      priceMax: drop.priceMax as number,
      id: String(drop.id ?? ""),
      location: String(drop.location ?? ""),
      locationDetail: String(drop.locationDetail ?? ""),
      date: String(drop.date ?? ""),
      windowStart: String(drop.windowStart ?? ""),
      windowEnd: String(drop.windowEnd ?? ""),
      status: (drop.status as "upcoming" | "active" | "ended") ?? "active",
      description: String(drop.description ?? ""),
      imageUrl: String(drop.imageUrl ?? ""),
      dailyCap: Number(drop.dailyCap ?? 0),
      consecutiveWeeksAbove85: Number(drop.consecutiveWeeksAbove85 ?? 0),
    });
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

    await set(`res:${resId}`, reservation);
    await set(`code:${code}`, { reservationId: resId, dropId, status: "valid" });

    const updatedDrop = {
      ...drop,
      remainingBoxes: (drop.remainingBoxes as number) - 1,
      reservedBoxes: (drop.reservedBoxes as number) + 1,
    };
    await set(`drop:${dropId}`, updatedDrop);

    await updateStats({ reservationCreated: true });

    const userState =
      ((await get(`user:${userId}`)) as Record<string, unknown> | undefined) ?? defaultUserState();
    const userUpdates: Record<string, unknown> = {};
    if (paymentMethod === "card" && cardLast4 && !userState.hasCardSaved) {
      userUpdates.hasCardSaved = true;
      userUpdates.cardLast4 = cardLast4;
    }
    if (paymentMethod === "credit") {
      userUpdates.creditsRemaining = Math.max(
        0,
        ((userState.creditsRemaining as number | undefined) ?? 0) - 1
      );
    }
    if (Object.keys(userUpdates).length > 0) {
      await set(`user:${userId}`, { ...userState, ...userUpdates });
    }

    // Send confirmation email to authenticated users (fire-and-forget)
    if (!isGuest && session?.user?.email) {
      const userName = (session.user.user_metadata?.name as string | undefined) ?? "there";
      sendReservationConfirmation({
        to: session.user.email,
        name: userName,
        pickupCode: code,
        location: String(drop.location ?? ""),
        locationDetail: String(drop.locationDetail ?? ""),
        windowStart: String(drop.windowStart ?? ""),
        windowEnd: String(drop.windowEnd ?? ""),
        price: currentPrice,
      }).catch((err) => console.error("Failed to send confirmation email:", err));
    }

    return json({ reservation, drop: updatedDrop });
  } catch (e) {
    console.log("Error creating reservation:", e);
    return json({ error: `Failed to create reservation: ${e}` }, { status: 500 });
  }
}

export async function GET(event: RequestEvent) {
  try {
    const userId = event.url.searchParams.get("userId");
    if (!userId) {
      return json({ error: "userId query parameter is required" }, { status: 400 });
    }

    const session = event.locals.session;
    const isGuest = userId.startsWith("guest-");
    if (!isGuest && (!session?.user || session.user.id !== userId)) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }

    const all = (await getByPrefix("res:")) as Array<Record<string, unknown>>;
    const filtered = all.filter((r) => r.userId === userId);
    return json({ reservations: filtered });
  } catch (e) {
    console.log("Error getting reservations:", e);
    return json({ error: `Failed to get reservations: ${e}` }, { status: 500 });
  }
}
