import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { del, get, getByPrefix, set } from "$lib/kv";
import { requireAdmin } from "$lib/server/auth";

export async function PATCH(event: RequestEvent) {
  const authError = requireAdmin(event);
  if (authError) return authError;
  const { params, request } = event;
  try {
    const id = params.id;
    const body = await request.json();
    const drop = await get(`drop:${id}`);
    if (!drop) return json({ error: "Drop not found" }, { status: 404 });
    const updated = { ...(drop as Record<string, unknown>), ...(body as Record<string, unknown>) };
    await set(`drop:${id}`, updated);
    return json({ drop: updated });
  } catch (e) {
    console.log("Error updating drop:", e);
    return json({ error: `Failed to update drop: ${e}` }, { status: 500 });
  }
}

export async function DELETE(event: RequestEvent) {
  const authError = requireAdmin(event);
  if (authError) return authError;
  const { params } = event;
  try {
    const id = params.id;
    const drop = await get(`drop:${id}`);
    if (!drop) return json({ error: "Drop not found" }, { status: 404 });

    const allRes = (await getByPrefix("res:")) as Array<Record<string, unknown>>;
    for (const res of allRes) {
      if (res.dropId === id && res.status === "reserved") {
        await set(`res:${res.id as string}`, {
          ...res,
          status: "cancelled",
          cancelledAt: new Date().toISOString(),
        });
        if (res.pickupCode) {
          await set(`code:${res.pickupCode as string}`, {
            reservationId: res.id,
            dropId: id,
            status: "expired",
          });
        }
        if (res.paymentMethod === "credit" && res.userId) {
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
      }
    }

    await del(`drop:${id}`);
    console.log("Drop deleted:", id);
    return json({ success: true, deletedId: id });
  } catch (e) {
    console.log("Error deleting drop:", e);
    return json({ error: `Failed to delete drop: ${e}` }, { status: 500 });
  }
}
