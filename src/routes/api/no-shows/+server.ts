import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { get, getByPrefix } from "$lib/kv";
import { requireAdmin } from "$lib/server/auth";

export async function GET(event: RequestEvent) {
  const denied = requireAdmin(event);
  if (denied) return denied;
  try {
    const allReservations = (await getByPrefix("res:")) as Array<Record<string, unknown>>;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const noShows: Array<Record<string, unknown>> = [];

    for (const res of allReservations) {
      if (res.status !== "reserved" && res.status !== "no_show") continue;

      const drop = (await get(`drop:${res.dropId as string}`)) as
        | Record<string, unknown>
        | undefined;
      if (!drop) continue;
      if (drop.date !== todayStr) continue;

      const [endH, endM] = String(drop.windowEnd ?? "23:59")
        .split(":")
        .map(Number);
      const windowEndMs = new Date();
      windowEndMs.setHours(endH, endM, 0, 0);

      const windowEnded = now > windowEndMs;
      const alreadyMarked = res.status === "no_show";

      if (windowEnded || alreadyMarked) {
        const userState = (await get(`user:${res.userId as string}`)) as
          | Record<string, unknown>
          | undefined;
        noShows.push({
          reservationId: res.id,
          code: res.pickupCode,
          location: drop.location,
          time: `${endH % 12 || 12}:${String(endM).padStart(2, "0")} ${endH >= 12 ? "PM" : "AM"}`,
          repeatOffender: ((userState?.noShowCount as number | undefined) ?? 0) >= 2,
          boxStatus: res.boxStatus ?? (alreadyMarked ? "released" : null),
          alreadyMarked,
        });
      }
    }

    return json({ noShows });
  } catch (e) {
    console.log("Error fetching no-shows:", e);
    return json({ error: `Failed to fetch no-shows: ${e}` }, { status: 500 });
  }
}
