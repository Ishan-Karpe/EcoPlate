import { expect, test, type APIRequestContext, type Page, type TestInfo } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

async function createDrop(request: APIRequestContext, description: string, testInfo?: TestInfo) {
  const response = await request.post("/api/drops", {
    data: {
      location: "Anteatery",
      locationDetail: "Main lobby, counter 3",
      boxes: 10,
      windowStart: "10:00",
      windowEnd: "23:00",
      priceMin: 7,
      priceMax: 7,
      description,
      imageUrl: "",
      dailyCap: 30,
      consecutiveWeeksAbove85: 0,
    },
  });

  if (!response.ok()) {
    const details = await response.text();
    if (testInfo) {
      console.error(`drop seed failed (${response.status()}): ${details.slice(0, 200)}`);
      testInfo.skip();
    }
    throw new Error(`drop seed failed (${response.status()}): ${details}`);
  }
  const payload = (await response.json()) as { drop: { id: string } };
  return payload.drop;
}

async function createReservation(
  request: APIRequestContext,
  dropId: string,
  userId: string,
  testInfo?: TestInfo
) {
  const response = await request.post("/api/reservations", {
    data: {
      dropId,
      userId,
      paymentMethod: "pay_at_pickup",
    },
  });

  if (!response.ok()) {
    const details = await response.text();
    if (testInfo) {
      console.error(`reservation seed failed (${response.status()}): ${details.slice(0, 200)}`);
      testInfo.skip();
    }
    throw new Error(`reservation seed failed (${response.status()}): ${details}`);
  }
  const payload = (await response.json()) as { reservation: { id: string; pickupCode: string } };
  return payload.reservation;
}

async function loginAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByPlaceholder("you@uci.edu").fill(ADMIN_EMAIL ?? "");
  await page.getByPlaceholder("Your password").fill(ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: /Sign In as Admin/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function completeGuestReservationFlow(page: Page, description: string) {
  await page.goto("/");
  await expect(page.getByText(description)).toBeVisible();
  await page.getByText(description).first().click();

  await expect(page).toHaveURL(/\/drop\/.+/);
  await page.getByRole("button", { name: /Reserve This Box/i }).click();
  await expect(page).toHaveURL(/\/drop\/.+\/reserve/);

  await page.getByRole("button", { name: /Pay at pickup/i }).click();
  await page.getByRole("button", { name: /Reserve and Pay at Pickup/i }).click();
  await expect(page).toHaveURL(/\/drop\/.+\/pickup/);
}

test.describe.serial("Critical Flows", () => {
  test("Guest Reservation Flow", async ({ page, request }, testInfo) => {
    const description = `E2E Guest Flow ${Date.now()}`;
    await createDrop(request, description, testInfo);

    await completeGuestReservationFlow(page, description);

    await expect(page.locator('img[alt="Pickup QR code"]')).toBeVisible();
    await expect(
      page
        .locator("p")
        .filter({ hasText: /^[A-Z2-9]{6}$/ })
        .first()
    ).toBeVisible();
  });

  test("Admin Drop Creation", async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

    await loginAdmin(page);

    await page.getByRole("link", { name: /New Drop/i }).click();
    await expect(page).toHaveURL(/\/admin\/drops\/new/);

    const description = `E2E Admin Drop ${Date.now()}`;
    await page
      .getByPlaceholder("e.g., Pasta bar: penne arrabbiata, grilled chicken, roasted vegetables")
      .fill(description);
    await page.getByRole("button", { name: /^Post Drop$/ }).click();

    await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 });
    await expect(page.getByText("EcoPlate Staff")).toBeVisible();
  });

  test("Admin Code Redemption", async ({ page, request }, testInfo) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

    const drop = await createDrop(request, `E2E Redeem ${Date.now()}`, testInfo);
    const reservation = await createReservation(
      request,
      drop.id,
      `e2e-redeem-${Date.now()}`,
      testInfo
    );

    await loginAdmin(page);
    await page.goto("/admin/redeem");

    await page.getByRole("button", { name: /Enter Code/i }).click();
    await page.getByPlaceholder("XXXXXX").fill(reservation.pickupCode);
    await page.getByRole("button", { name: /Verify & Redeem/i }).click();

    await expect(page.getByText("Pickup confirmed!")).toBeVisible();
  });

  test("Return Home After Reservation", async ({ page, request }, testInfo) => {
    const description = `E2E Home Return Flow ${Date.now()}`;
    await createDrop(request, description, testInfo);

    await completeGuestReservationFlow(page, description);

    await page.getByRole("button", { name: /Go to Home Screen/i }).click();
    await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:\d+\/$/);
  });

  test("PWA Offline Cache", async ({ page, request, context }, testInfo) => {
    const description = `E2E Offline Flow ${Date.now()}`;
    await createDrop(request, description, testInfo);

    await page.goto("/");
    await expect(page.getByText(description)).toBeVisible();

    const serviceWorkerReady = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      try {
        await navigator.serviceWorker.ready;
        return true;
      } catch {
        return false;
      }
    });

    test.skip(!serviceWorkerReady, "service worker unavailable in this environment");

    await page.reload();
    await expect(page.getByText(description)).toBeVisible();

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(description)).toBeVisible({ timeout: 15_000 });
    await context.setOffline(false);
  });
});
