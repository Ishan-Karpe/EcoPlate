import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { get, getByPrefix, set } from "$lib/kv";
import { getStats, updateStats } from "$lib/server/helpers";
import { requireAdmin } from "$lib/server/auth";
import { sendDropAlert } from "$lib/server/email";
import { getAdminSupabase } from "$lib/supabase-server";

export async function GET() {
  try {
    const drops = (await getByPrefix("drop:")) as Array<Record<string, unknown>>;
    const sorted = drops
      .filter((d) => d && d.id)
      .sort(
        (a, b) =>
          new Date((b.createdAt as string | undefined) ?? (b.date as string)).getTime() -
          new Date((a.createdAt as string | undefined) ?? (a.date as string)).getTime()
      );
    return json({ drops: sorted });
  } catch (e) {
    console.log("Error fetching drops:", e);
    return json({ error: `Failed to fetch drops: ${e}` }, { status: 500 });
  }
}

export async function POST(event: RequestEvent) {
  const denied = requireAdmin(event);
  if (denied) return denied;
  const request = event.request;
  try {
    const body = await request.json();
    const {
      location,
      locationDetail,
      boxes,
      windowStart,
      windowEnd,
      description,
      imageUrl,
      dailyCap,
      consecutiveWeeksAbove85,
    } = body;

    if (!location || typeof location !== "string" || location.trim().length === 0) {
      return json({ error: "Location name is required" }, { status: 400 });
    }
    const boxCount = parseInt(boxes);
    if (isNaN(boxCount) || boxCount < 1 || boxCount > 100) {
      return json({ error: "Box count must be between 1 and 100" }, { status: 400 });
    }
    if (
      !windowStart ||
      !windowEnd ||
      !/^\d{2}:\d{2}$/.test(windowStart) ||
      !/^\d{2}:\d{2}$/.test(windowEnd)
    ) {
      return json({ error: "Window times must be in HH:MM format" }, { status: 400 });
    }
    if (windowStart >= windowEnd) {
      return json({ error: "Window end must be after start" }, { status: 400 });
    }
    const safeDescription = typeof description === "string" ? description.slice(0, 500) : "";

    const id = `drop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const drop = {
      id,
      location,
      locationDetail: locationDetail ?? `${location} pickup area`,
      date: new Date().toISOString().split("T")[0],
      windowStart,
      windowEnd,
      totalBoxes: boxCount,
      remainingBoxes: boxCount,
      reservedBoxes: 0,
      priceMin: 7,
      priceMax: 7,
      status: "active",
      description: safeDescription || "Tonight's Fresh Box, freshly prepared by dining staff.",
      imageUrl: imageUrl ?? "",
      dailyCap: dailyCap ?? 30,
      consecutiveWeeksAbove85: consecutiveWeeksAbove85 ?? 0,
      createdAt: new Date().toISOString(),
    };

    await set(`drop:${id}`, drop);
    await updateStats({ boxesPosted: boxCount, dropCreated: true });

    const stats = (await getStats()) as {
      locationCaps: Array<{
        location: string;
        currentCap: number;
        consecutiveWeeksAbove85: number;
      }>;
    };
    const caps = stats.locationCaps.map((cap) => {
      if (cap.location === location) {
        return {
          ...cap,
          consecutiveWeeksAbove85: consecutiveWeeksAbove85 ?? cap.consecutiveWeeksAbove85,
        };
      }
      return cap;
    });
    await set("stats:global", { ...stats, locationCaps: caps });

    // Send drop alert emails to all registered users (fire-and-forget)
    (async () => {
      try {
        const supabase = getAdminSupabase();
        const { data } = await supabase.auth.admin.listUsers({ perPage: 500 });
        const users = data?.users ?? [];
        await Promise.allSettled(
          users
            .filter((u) => u.email)
            .map((u) =>
              sendDropAlert({
                to: u.email!,
                name: (u.user_metadata?.name as string | undefined) ?? "there",
                location: drop.location as string,
                locationDetail: drop.locationDetail as string,
                windowStart: drop.windowStart as string,
                windowEnd: drop.windowEnd as string,
                priceMin: drop.priceMin as number,
                priceMax: drop.priceMax as number,
                dropId: id,
              })
            )
        );
      } catch (err) {
        console.error("Failed to send drop alert emails:", err);
      }
    })();

    return json({ drop });
  } catch (e) {
    console.log("Error creating drop:", e);
    return json({ error: `Failed to create drop: ${e}` }, { status: 500 });
  }
}
