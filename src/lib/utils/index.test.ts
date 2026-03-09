import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { calculateCurrentPrice, formatTime, generatePickupCode, getWindowState } from "./utils";
import { FOOD_IMAGE_POOL, LOCATION_FALLBACK_IMAGES, pickDropImage } from "./constants";
import type { Drop } from "./types";

function makeDrop(overrides: Partial<Drop> = {}): Drop {
  return {
    id: "drop-test",
    location: "Anteatery",
    locationDetail: "Main hall",
    date: "2026-03-01",
    windowStart: "11:00",
    windowEnd: "14:00",
    totalBoxes: 10,
    remainingBoxes: 5,
    reservedBoxes: 5,
    priceMin: 3,
    priceMax: 5,
    status: "active",
    description: "Test drop",
    imageUrl: "",
    dailyCap: 30,
    consecutiveWeeksAbove85: 0,
    ...overrides,
  };
}

describe("calculateCurrentPrice", () => {
  it("returns min price when supply is high", () => {
    const drop = makeDrop({
      totalBoxes: 10,
      remainingBoxes: 7,
      reservedBoxes: 3,
      priceMin: 3,
      priceMax: 5,
    });
    expect(calculateCurrentPrice(drop)).toBe(3);
  });

  it("returns max price when supply is low and demand is high", () => {
    const drop = makeDrop({
      totalBoxes: 10,
      remainingBoxes: 1,
      reservedBoxes: 9,
      priceMin: 3,
      priceMax: 5,
    });
    expect(calculateCurrentPrice(drop)).toBe(5);
  });

  it("interpolates and rounds in the middle branch", () => {
    const drop = makeDrop({
      totalBoxes: 10,
      remainingBoxes: 3,
      reservedBoxes: 7,
      priceMin: 3,
      priceMax: 5,
    });
    expect(calculateCurrentPrice(drop)).toBe(4);
  });
});

describe("generatePickupCode", () => {
  it("creates 6-char codes from the allowed charset", () => {
    const code = generatePickupCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });
});

describe("getWindowState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns before when now is before the window", () => {
    vi.setSystemTime(new Date("2026-03-01T10:00:00"));
    expect(getWindowState("11:00", "14:00")).toBe("before");
  });

  it("returns during when now is inside the window", () => {
    vi.setSystemTime(new Date("2026-03-01T12:30:00"));
    expect(getWindowState("11:00", "14:00")).toBe("during");
  });

  it("returns after when now is after the window", () => {
    vi.setSystemTime(new Date("2026-03-01T15:01:00"));
    expect(getWindowState("11:00", "14:00")).toBe("after");
  });
});

describe("formatTime", () => {
  it("formats 24h time to AM/PM", () => {
    expect(formatTime("13:05")).toBe("1:05 PM");
    expect(formatTime("00:00")).toBe("12:00 AM");
    expect(formatTime("12:00")).toBe("12:00 PM");
  });
});

describe("pickDropImage", () => {
  it("matches a keyword-specific image", () => {
    const image = pickDropImage("Tonight pasta and vegetables", "Anteatery");
    expect(image).toBe(FOOD_IMAGE_POOL[0]?.url);
  });

  it("falls back to location image when no keyword matches", () => {
    const image = pickDropImage("mystery dish", "Brandywine");
    expect(image).toBe(LOCATION_FALLBACK_IMAGES.Brandywine);
  });

  it("falls back to Anteatery image for unknown locations", () => {
    const image = pickDropImage("unknown item", "Unknown");
    expect(image).toBe(LOCATION_FALLBACK_IMAGES.Anteatery);
  });
});
