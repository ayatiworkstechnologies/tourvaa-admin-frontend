import { test, expect } from "@playwright/test";

const ROUTES = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
  { name: "Destinations", path: "/destinations" },
  { name: "Tours Catalog", path: "/tours" },
  { name: "Blogs", path: "/blogs" },
  { name: "Travel Advice", path: "/travel-advice" },
  { name: "External Day Trips", path: "/external-day-trips" },
  { name: "Wishlist", path: "/wishlist" },
  { name: "Compare", path: "/compare" },
  { name: "Cart", path: "/cart" },
  { name: "Traveller Login", path: "/login" },
  { name: "Traveller Register", path: "/register" },
  { name: "Forgot Password", path: "/forgot-password" },
  { name: "Agent Portal", path: "/agent-portal" },
  { name: "Agent Portal Login", path: "/agent-portal/login" },
  { name: "Supplier Portal", path: "/supplier-portal" },
  { name: "Supplier Portal Login", path: "/supplier-portal/login" },
  { name: "Affiliate Portal", path: "/affiliate-portal" },
  { name: "Terms & Conditions", path: "/terms" },
  { name: "Privacy Policy", path: "/privacy-policy" },
  { name: "Cookie Policy", path: "/cookie-policy" },
  { name: "Cancellation Policy", path: "/cancellation-policy" },
  { name: "Accessibility", path: "/accessibility" },
];

test.describe("Full Frontend Discovery and Error Sniffing", () => {
  for (const route of ROUTES) {
    test(`audit ${route.name} (${route.path}) for runtime errors and layout overflow`, async ({ page }) => {
      const pageErrors: string[] = [];
      const failedResponses: string[] = [];

      page.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });

      page.on("response", (res) => {
        const url = res.url();
        // Ignore external trackers, fonts, or third-party ads if any
        if (url.includes("localhost:3000") && res.status() >= 400) {
          failedResponses.push(`${res.status()} on ${url}`);
        }
      });

      // Navigate to route on desktop
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`http://localhost:3000${route.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);

      // Verify no unhandled runtime crashes
      expect(
        pageErrors,
        `Page ${route.path} threw unhandled runtime errors:\n${pageErrors.join("\n")}`
      ).toEqual([]);

      // Verify no critical 404/500 asset responses on local resources
      const criticalFailures = failedResponses.filter((f) => !f.includes("/api/"));
      expect(
        criticalFailures,
        `Page ${route.path} had broken local assets:\n${criticalFailures.join("\n")}`
      ).toEqual([]);

      // Check desktop horizontal overflow
      const desktopOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(
        desktopOverflow,
        `Page ${route.path} has horizontal overflow on desktop (1280px)`
      ).toBe(false);

      // Check mobile horizontal overflow
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(300);

      const mobileOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(
        mobileOverflow,
        `Page ${route.path} has horizontal overflow on mobile (375px)`
      ).toBe(false);
    });
  }
});
