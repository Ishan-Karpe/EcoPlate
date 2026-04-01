import { get, set } from "$lib/kv";

export function defaultUserState() {
  return {
    isFirstTime: false,
    totalPickups: 0,
    noShowCount: 0,
    hasAccount: true,
    hasCardSaved: false,
    cardLast4: "",
    membership: null,
    creditsRemaining: 0,
  };
}

export async function getStats() {
  const stats = await get("stats:global");
  if (stats) return stats as Record<string, unknown>;
  return {
    totalDrops: 0,
    totalBoxesPosted: 0,
    totalBoxesPickedUp: 0,
    totalReservations: 0,
    totalNoShows: 0,
    pickupRate: 0,
    noShowRate: 0,
    avgRating: 0,
    locationCaps: [],
    recentDrops: [],
  };
}

export async function updateStats(update: {
  boxesPosted?: number;
  dropCreated?: boolean;
  reservationCreated?: boolean;
  boxPickedUp?: boolean;
  noShow?: boolean;
  newRating?: { value: number; previousAvg: number; previousCount: number };
}) {
  const stats = (await getStats()) as {
    totalDrops: number;
    totalBoxesPosted: number;
    totalBoxesPickedUp: number;
    totalReservations: number;
    totalNoShows: number;
    pickupRate: number;
    noShowRate: number;
    avgRating: number;
    locationCaps: Array<{ location: string; currentCap: number; consecutiveWeeksAbove85: number }>;
    recentDrops: Array<{ date: string; posted: number; pickedUp: number; noShows: number }>;
  };
  const totalPosted = stats.totalBoxesPosted + (update.boxesPosted ?? 0);
  const totalPickedUp = stats.totalBoxesPickedUp + (update.boxPickedUp ? 1 : 0);
  const totalNoShows = stats.totalNoShows + (update.noShow ? 1 : 0);
  const totalReservations = stats.totalReservations + (update.reservationCreated ? 1 : 0);
  const totalDrops = stats.totalDrops + (update.dropCreated ? 1 : 0);
  const pickupRate = totalPosted > 0 ? Math.round((totalPickedUp / totalPosted) * 100) : 0;
  const noShowRate =
    totalReservations > 0 ? Math.round((totalNoShows / totalReservations) * 1000) / 10 : 0;

  let avgRating = stats.avgRating;
  if (update.newRating) {
    const { value, previousAvg, previousCount } = update.newRating;
    avgRating =
      previousCount === 0
        ? value
        : Math.round(((previousAvg * previousCount + value) / (previousCount + 1)) * 10) / 10;
  }

  const updated = {
    ...stats,
    totalDrops,
    totalBoxesPosted: totalPosted,
    totalBoxesPickedUp: totalPickedUp,
    totalReservations,
    totalNoShows,
    pickupRate,
    noShowRate,
    avgRating,
  };
  await set("stats:global", updated);
  return updated;
}
