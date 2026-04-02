import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { get, set } from "$lib/kv";
import { updateStats } from "$lib/server/helpers";
import { requireAdmin } from "$lib/server/auth";

export async function POST(event: RequestEvent) {
  const denied = requireAdmin(event);
  if (denied) return denied;
  const params = event.params;
  const request = event.request;
  try {
    const id = params.id!;
    const body = await request.json().catch(() => ({}));
    const boxStatus = body.boxStatus ?? "released";

    if (!["released", "donated", "disposed"].includes(boxStatus)) {
      return json(
        { error: "boxStatus must be 'released', 'donated', or 'disposed'" },
        { status: 400 }
      );
    }

    const res = (await get(`res:${id}`)) as Record<string, unknown> | undefined;
    if (!res) return json({ error: "Reservation not found" }, { status: 404 });

    const updated = {
      ...res,
      status: "no_show",
      boxStatus,
      noShowAt: new Date().toISOString(),
    };
    await set(`res:${id}`, updated);
    await set(`code:${res.pickupCode as string}`, {
      reservationId: id,
      dropId: res.dropId,
      status: "expired",
    });

    await updateStats({ noShow: true });

    const userState = (await get(`user:${res.userId as string}`)) as
      | Record<string, unknown>
      | undefined;
    if (userState) {
      await set(`user:${res.userId as string}`, {
        ...userState,
        noShowCount: ((userState.noShowCount as number | undefined) ?? 0) + 1,
      });
    }

    return json({ reservation: updated });
  } catch (e) {
    console.log("Error marking no-show:", e);
    return json({ error: `Failed to mark no-show: ${e}` }, { status: 500 });
  }
}
