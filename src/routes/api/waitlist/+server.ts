import { json } from "@sveltejs/kit";
import { get, set } from "$lib/kv";

export async function POST({ request }: { request: Request }) {
  try {
    const { dropId, userId } = await request.json();

    if (!dropId || typeof dropId !== "string") {
      return json({ error: "dropId is required" }, { status: 400 });
    }
    if (!userId || typeof userId !== "string") {
      return json({ error: "userId is required" }, { status: 400 });
    }

    const key = `waitlist:${dropId}:${userId}`;
    const existing = await get(key);
    if (existing) return json({ alreadyOnWaitlist: true });

    await set(key, {
      id: `wl-${Date.now()}`,
      dropId,
      userId,
      createdAt: new Date().toISOString(),
      notified: false,
    });
    return json({ success: true });
  } catch (e) {
    console.log("Error joining waitlist:", e);
    return json({ error: `Failed to join waitlist: ${e}` }, { status: 500 });
  }
}
