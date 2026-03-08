import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { get, set } from "$lib/kv";
import { getStats, updateStats } from "$lib/server/helpers";

export async function POST(event: RequestEvent) {
  try {
    const id = event.params.id!;
    const { rating, userId } = await event.request.json();

    if (!userId || typeof userId !== "string") {
      return json({ error: "userId is required" }, { status: 400 });
    }

    const session = event.locals.session;
    const isGuest = userId.startsWith("guest-");
    if (!isGuest && (!session?.user || session.user.id !== userId)) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }
    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const res = (await get(`res:${id}`)) as Record<string, unknown> | undefined;
    if (!res) return json({ error: "Reservation not found" }, { status: 404 });

    const updated = { ...res, rating: numRating, ratedAt: new Date().toISOString() };
    await set(`res:${id}`, updated);

    // Note: totalPickups is incremented in /redeem when the pickup code is verified,
    // not here, to avoid double-counting.

    const stats = (await getStats()) as { avgRating: number; totalBoxesPickedUp: number };
    await updateStats({
      newRating: {
        value: numRating,
        previousAvg: stats.avgRating,
        previousCount: stats.totalBoxesPickedUp,
      },
    });

    return json({ reservation: updated });
  } catch (e) {
    console.log("Error submitting rating:", e);
    return json({ error: `Failed to submit rating: ${e}` }, { status: 500 });
  }
}
