import type { Drop } from "./types";

export function generatePickupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function getWindowState(
  windowStart: string,
  windowEnd: string
): "before" | "during" | "after" {
  const now = new Date();
  const [startH, startM] = windowStart.split(":").map(Number);
  const [endH, endM] = windowEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (nowMinutes < startMinutes) return "before";
  if (nowMinutes >= endMinutes) return "after";
  return "during";
}

export function calculateCurrentPrice(drop: Drop): number {
  if (drop.totalBoxes === 0) return drop.priceMin;
  const supplyRatio = drop.remainingBoxes / drop.totalBoxes;
  const demandRatio = drop.reservedBoxes / drop.totalBoxes;
  if (supplyRatio > 0.5) {
    return drop.priceMin;
  } else if (supplyRatio < 0.2 && demandRatio > 0.7) {
    return drop.priceMax;
  } else {
    const raw = drop.priceMin + (drop.priceMax - drop.priceMin) * (1 - supplyRatio) * demandRatio;
    return Math.min(drop.priceMax, Math.max(drop.priceMin, Math.round(raw)));
  }
}
