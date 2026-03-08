import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { get, set } from "$lib/kv";

export async function POST(event: RequestEvent) {
  try {
    const id = event.params.id!;
    const res = (await get(`res:${id}`)) as Record<string, unknown> | undefined;
    if (!res) return json({ error: "Reservation not found" }, { status: 404 });
    if (res.status !== "reserved")
      return json({ error: "Reservation is not active" }, { status: 400 });

    const session = event.locals.session;
    const resUserId = res.userId as string;
    const isGuest = resUserId.startsWith("guest-");
    if (!isGuest && (!session?.user || session.user.id !== resUserId)) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedRes = { ...res, status: "cancelled", cancelledAt: new Date().toISOString() };
    await set(`res:${id}`, updatedRes);
    await set(`code:${res.pickupCode as string}`, {
      reservationId: id,
      dropId: res.dropId,
      status: "expired",
    });

    const drop = (await get(`drop:${res.dropId as string}`)) as Record<string, unknown> | undefined;
    if (drop) {
      await set(`drop:${res.dropId as string}`, {
        ...drop,
        remainingBoxes: (drop.remainingBoxes as number) + 1,
        reservedBoxes: Math.max(0, (drop.reservedBoxes as number) - 1),
      });
    }

    if (res.paymentMethod === "credit") {
      const userState = (await get(`user:${res.userId as string}`)) as
        | Record<string, unknown>
        | undefined;
      if (userState) {
        await set(`user:${res.userId as string}`, {
          ...userState,
          creditsRemaining: ((userState.creditsRemaining as number | undefined) ?? 0) + 1,
        });
      }
    }

    return json({ reservation: updatedRes });
  } catch (e) {
    console.log("Error cancelling reservation:", e);
    return json({ error: `Failed to cancel reservation: ${e}` }, { status: 500 });
  }
}
