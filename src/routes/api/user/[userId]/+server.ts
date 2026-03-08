import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { get, set } from "$lib/kv";
import { defaultUserState } from "$lib/server/helpers";

function checkUserAccess(event: RequestEvent, userId: string) {
  const session = event.locals.session;
  const isGuest = userId.startsWith("guest-");
  if (isGuest) return null;
  if (!session?.user) {
    return json({ error: "Authentication required" }, { status: 401 });
  }
  const role =
    (session.user.user_metadata?.role as string) ?? (session.user.app_metadata?.role as string);
  if (session.user.id !== userId && role !== "admin") {
    return json({ error: "Unauthorized" }, { status: 403 });
  }
  return null;
}

export async function GET(event: RequestEvent) {
  const userId = event.params.userId!;
  const authError = checkUserAccess(event, userId);
  if (authError) return authError;
  try {
    const user = await get(`user:${userId}`);
    return json({ user: user ?? defaultUserState() });
  } catch (e) {
    console.log("Error getting user:", e);
    return json({ error: `Failed to get user: ${e}` }, { status: 500 });
  }
}

export async function PUT(event: RequestEvent) {
  const userId = event.params.userId!;
  const authError = checkUserAccess(event, userId);
  if (authError) return authError;
  try {
    const body = await event.request.json();
    const existing =
      ((await get(`user:${userId}`)) as Record<string, unknown> | undefined) ?? defaultUserState();
    const updated = { ...existing, ...(body as Record<string, unknown>) };
    await set(`user:${userId}`, updated);
    return json({ user: updated });
  } catch (e) {
    console.log("Error updating user:", e);
    return json({ error: `Failed to update user: ${e}` }, { status: 500 });
  }
}
