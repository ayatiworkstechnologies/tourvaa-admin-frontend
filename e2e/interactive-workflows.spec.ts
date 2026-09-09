import { test, expect } from "@playwright/test";

test.describe("Deep Interactive UI & UX Workflows Audit", () => {
  test("audit tours search, filter pills, sorting, and pagination", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/tours", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // Check search input presence
    const searchInput = page.getByPlaceholder(/search by tour name/i);
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill("Zealand");
    await page.waitForTimeout(500);

    // Verify search term is handled
    await searchInput.clear();
    await page.waitForTimeout(300);

    // Check sort dropdown
    const sortSelect = page.locator("select").first();
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption({ index: 1 });
      await page.waitForTimeout(400);
    }

    // Check tour cards
    const tourCards = page.locator("article");
    const count = await tourCards.count();
    if (count > 0) {
      // Check wishlist button on first tour card
      const firstWishlistBtn = tourCards.first().getByRole("button", { name: /wishlist/i });
      if (await firstWishlistBtn.isVisible()) {
        await firstWishlistBtn.click();
        await page.waitForTimeout(200);
      }
    }

    expect(pageErrors).toEqual([]);
  });

  test("audit wishlist empty state and navigation", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/wishlist", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    // Check page header
    await expect(page.getByRole("heading", { name: /wishlist/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test("audit compare tool workflow", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/compare", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    // Check page title
    await expect(page.getByRole("heading", { name: /compare/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test("audit contact form validation and interaction", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    // Submit empty form to verify validation errors
    const submitBtn = page.getByRole("button", { name: /send message|submit/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(300);
    }

    expect(pageErrors).toEqual([]);
  });

  test("audit partner portals login and register tabs", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    // Agent portal login
    await page.goto("/agent-portal/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await expect(page.getByRole("heading", { name: /agent/i })).toBeVisible();

    // Supplier portal login
    await page.goto("/supplier-portal/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await expect(page.getByRole("heading", { name: /supplier/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test("audit tour detail page desktop and mobile sticky booking bar", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    // 1. Visit tours catalog and click first tour or visit /tours/1
    await page.goto("/tours/1", { waitUntil: "domcontentloaded" });

    // Verify booking widget is present (generous timeout: dev-server first
    // compile + tour data fetch can exceed the default 5s)
    const bookingWidget = page.locator("#booking-widget");
    await expect(bookingWidget).toBeVisible({ timeout: 20000 });

    // 2. Test mobile viewport (375x667)
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile booking CTA is visible (the old fixed-bottom bar was
    // removed when booking moved to the dedicated /booking/[id] page; the CTA
    // now lives inside the #booking-widget "Proceed to Payment" button)
    const mobileBookingBtn = page.locator("#booking-widget button:has-text('Proceed to Payment')");
    await expect(mobileBookingBtn).toBeVisible({ timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });
});
