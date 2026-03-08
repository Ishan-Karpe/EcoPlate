import { json } from "@sveltejs/kit";
import { get } from "$lib/kv";

export async function GET({ params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const reservation = await get(`res:${id}`);
    if (!reservation) return json({ error: "Reservation not found" }, { status: 404 });
    return json({ reservation });
  } catch (e) {
    return json({ error: `Failed to get reservation: ${e}` }, { status: 500 });
  }
}
