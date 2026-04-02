import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { getByPrefix } from "$lib/kv";
import { getStats } from "$lib/server/helpers";
import { requireAdmin } from "$lib/server/auth";

export async function GET(event: RequestEvent) {
  const denied = requireAdmin(event);
  if (denied) return denied;
  try {
    const stats = (await getStats()) as {
      recentDrops: Array<{ date: string; posted: number; pickedUp: number; noShows: number }>;
      locationCaps: Array<{
        location: string;
        currentCap: number;
        consecutiveWeeksAbove85: number;
      }>;
    };
    const allDrops = (await getByPrefix("drop:")) as Array<Record<string, unknown>>;
    const allRes = (await getByPrefix("res:")) as Array<Record<string, unknown>>;

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayMap: Record<string, { posted: number; pickedUp: number; noShows: number }> = {};

    for (const drop of allDrops) {
      if (!drop.date) continue;
      const d = new Date(`${String(drop.date)}T12:00:00`);
      if (isNaN(d.getTime())) continue;
      const label = days[d.getDay()];
      if (!dayMap[label]) dayMap[label] = { posted: 0, pickedUp: 0, noShows: 0 };
      dayMap[label].posted += (drop.totalBoxes as number | undefined) ?? 0;
    }
    for (const res of allRes) {
      if (!res.createdAt) continue;
      const d = new Date(String(res.createdAt));
      const label = days[d.getDay()];
      if (!dayMap[label]) dayMap[label] = { posted: 0, pickedUp: 0, noShows: 0 };
      if (res.status === "picked_up") dayMap[label].pickedUp++;
      if (res.status === "no_show") dayMap[label].noShows++;
    }

    const recentDrops =
      Object.keys(dayMap).length > 0
        ? Object.entries(dayMap).map(([date, data]) => ({ date, ...data }))
        : stats.recentDrops;

    const locationCaps = stats.locationCaps.map((cap) => {
      const locationDrops = allDrops.filter((d) => d.location === cap.location);
      const locationRes = allRes.filter(
        (r) => r.dropLocation === cap.location && r.status === "picked_up"
      );
      const totalPosted = locationDrops.reduce(
        (s, d) => s + ((d.totalBoxes as number | undefined) ?? 0),
        0
      );
      const pickupRate = totalPosted > 0 ? (locationRes.length / totalPosted) * 100 : 0;
      const weeksAbove85 = pickupRate >= 85 ? cap.consecutiveWeeksAbove85 + 1 : 0;
      return { ...cap, consecutiveWeeksAbove85: weeksAbove85 };
    });

    return json({ stats: { ...stats, recentDrops, locationCaps } });
  } catch (e) {
    console.log("Error getting admin stats:", e);
    return json({ error: `Failed to get admin stats: ${e}` }, { status: 500 });
  }
}
