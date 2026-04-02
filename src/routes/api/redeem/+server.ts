import { json } from "@sveltejs/kit";
import { get, set } from "$lib/kv";
import { defaultUserState, updateStats } from "$lib/server/helpers";

export async function POST({ request }: { request: Request }) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return json({ valid: false, reason: "Pickup code is required" });
    }
    if (code.trim().length === 0 || code.trim().length > 20) {
      return json({ valid: false, reason: "Invalid code format" });
    }

    const upperCode = code.toUpperCase().trim();
    const codeRecord = (await get(`code:${upperCode}`)) as Record<string, unknown> | undefined;
    if (!codeRecord) {
      return json({ valid: false, reason: "Code not found" });
    }
    if (codeRecord.status === "redeemed") {
      return json({ valid: false, reason: "Already redeemed" });
    }
    if (codeRecord.status === "expired") {
      return json({ valid: false, reason: "Code expired or cancelled" });
    }

    const res = (await get(`res:${codeRecord.reservationId as string}`)) as
      | Record<string, unknown>
      | undefined;
    if (!res) return json({ valid: false, reason: "Reservation not found" });
    if (res.status !== "reserved") {
      return json({
        valid: false,
        reason: res.status === "picked_up" ? "Already redeemed" : "Code expired",
      });
    }

    await set(`code:${upperCode}`, { ...codeRecord, status: "redeemed" });

    const updatedRes = { ...res, status: "picked_up", pickedUpAt: new Date().toISOString() };
    await set(`res:${codeRecord.reservationId as string}`, updatedRes);

    await updateStats({ boxPickedUp: true });

    const userState = (await get(`user:${res.userId as string}`)) as
      | Record<string, unknown>
      | undefined;
    const baseState = userState ?? (defaultUserState() as Record<string, unknown>);
    await set(`user:${res.userId as string}`, {
      ...baseState,
      totalPickups: ((baseState.totalPickups as number | undefined) ?? 0) + 1,
    });

    const drop = (await get(`drop:${res.dropId as string}`)) ?? null;
    return json({
      valid: true,
      reservation: updatedRes,
      drop,
      location: res.dropLocation,
    });
  } catch (e) {
    console.log("Error redeeming code:", e);
    return json({ error: `Failed to redeem code: ${e}` }, { status: 500 });
  }
}
