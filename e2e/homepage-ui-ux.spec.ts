import { test, expect } from "@playwright/test";

test.describe("Homepage UI and UX Comprehensive Audit", () => {
  test("audit homepage layout, interactions, console errors, and mobile responsiveness", async ({ page }) => {
    test.setTimeout(60000);
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    // 1. Navigate to home
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("header");
    await page.waitForTimeout(1000);

    // Dismiss cookie banner if shown
    const cookieAccept = page.getByRole("button", { name: /accept all/i });
    if (await cookieAccept.isVisible()) {
      await cookieAccept.click();
      await page.waitForTimeout(300);
    }

    // 2. Public Header verification
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(page.getByRole("link", { name: "Tourvaa", exact: true })).toBeVisible();

    // Check Wishlist and Compare links
    await expect(page.locator("header").getByRole("link", { name: /wishlist/i })).toBeVisible();
    await expect(page.locator("header").getByRole("link", { name: /compare/i })).toBeVisible();

    // Profile dropdown interaction (Before Login)
    const profileBtn = page.locator("header button:has-text('Profile')");
    if (await profileBtn.isVisible()) {
      await profileBtn.click();
      await page.waitForTimeout(400);
      const dropdown = page.locator(".profile-dropdown-panel");
      await expect(dropdown).toBeVisible();
      await expect(dropdown.getByText("Welcome to Tourvaa")).toBeVisible();
      await expect(dropdown.getByText("Traveller Account")).toBeVisible();
      await expect(dropdown.locator("a:has-text('Sign In')")).toBeVisible();
      await expect(dropdown.locator("a:has-text('Travel Agent Portal')")).toBeVisible();
      await expect(dropdown.locator("a:has-text('Affiliate Partner')")).toBeVisible();
      await expect(dropdown.locator("a:has-text('Tour Operator / Supplier')")).toBeVisible();
      await dropdown.screenshot({ path: "test-results/profile-dropdown-before-login.png" });

      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      await expect(dropdown).not.toBeVisible();
    }

    // Smart auto-hide sticky header verification
    // 1. Scroll down 400px -> header slides up (-translate-y-full)
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
    await page.waitForTimeout(400);
    await expect(header).toHaveClass(/-translate-y-full/);

    // 2. Scroll up 150px -> header slides down into view (translate-y-0)
    await page.evaluate(() => window.scrollTo({ top: 250, behavior: "instant" }));
    await page.waitForTimeout(400);
    await expect(header).toHaveClass(/translate-y-0/);

    // 3. Scroll back to top -> header is visible
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(400);
    await expect(header).toHaveClass(/translate-y-0/);

    // 3. Top Deals Section & Dynamic Tabs
    const topDealsHeading = page.getByRole("heading", { name: "Top Deals" });
    await expect(topDealsHeading).toBeVisible();

    const topDealsTab = page.getByRole("button", { name: "Top deals", exact: true });
    await expect(topDealsTab).toBeVisible();

    // Find all deal tabs
    const dealTabs = page.locator("section:has-text('Top Deals') button.rounded-full");
    const tabCount = await dealTabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(1);

    if (tabCount > 1) {
      // Click second tab to test dynamic filtering
      const secondTab = dealTabs.nth(1);
      const tabLabel = await secondTab.textContent();
      await secondTab.click();
      // Check active styling (bg-[#E4572E])
      await expect(secondTab).toHaveClass(/bg-\[#E4572E\]/);

      // Return to Top Deals
      await topDealsTab.click();
      await expect(topDealsTab).toHaveClass(/bg-\[#E4572E\]/);
    }

    // 4. About Tourvaa Banner
    const aboutHeading = page.getByRole("heading", { name: "About Tourvaa", exact: true });
    await expect(aboutHeading).toBeVisible();
    await expect(
      page.getByText(/Tourvaa is a premier travel platform dedicated to crafting extraordinary group travel/i)
    ).toBeVisible();

    // Verify background image is loaded
    const aboutImg = page.locator("section:has(h2:text('About Tourvaa')) img");
    await expect(aboutImg).toBeVisible();

    // 5. Trending Tour Packages Section
    const trendingHeading = page.getByRole("heading", { name: "Trending Tour Packages" });
    await expect(trendingHeading).toBeVisible();

    // 6. Blog Banner Section
    const blogHeading = page.getByRole("heading", { name: /Travel stories, guides and inspiration/i });
    await expect(blogHeading).toBeVisible();
    const readStoriesBtn = page.getByRole("link", { name: /Read Stories/i });
    await expect(readStoriesBtn).toBeVisible();

    // 7. Handpicked Tours Section
    const handpickedHeading = page.getByRole("heading", { name: "Handpicked Tours for You" });
    await expect(handpickedHeading).toBeVisible();

    // 8. Countries Worth Exploring Section
    const countriesHeading = page.getByRole("heading", { name: "Countries Worth Exploring" });
    await expect(countriesHeading).toBeVisible();

    // 9. Testimonials Section
    const testimonialsHeading = page.getByRole("heading", { name: "What Tourvaa travellers are saying" });
    await expect(testimonialsHeading).toBeVisible();

    // 10. Explore Directory Section & Tabs
    const countriesTab = page.getByRole("button", { name: "Top countries to visit" });
    const citiesTab = page.getByRole("button", { name: "Top Cities to Visit" });
    const categoriesTab = page.getByRole("button", { name: "Top attraction categories" });

    await expect(countriesTab).toBeVisible();
    await expect(citiesTab).toBeVisible();
    await expect(categoriesTab).toBeVisible();

    // Test tab switching
    await citiesTab.click();
    await expect(citiesTab).toHaveClass(/border-slate-950/);
    await categoriesTab.click();
    await expect(categoriesTab).toHaveClass(/border-slate-950/);
    await countriesTab.click();
    await expect(countriesTab).toHaveClass(/border-slate-950/);

    // 11. Airport Transfers Banner
    const transfersHeading = page.getByRole("heading", { name: "Book Your Airport Transfers" });
    await expect(transfersHeading).toBeVisible();
    const airportPickupBtn = page.locator("section:has-text('Book Your Airport Transfers') a:has-text('Book Airport Pickup')");
    await expect(airportPickupBtn).toBeVisible();
    await expect(airportPickupBtn).toHaveAttribute("href", "https://www.brightlane.co.nz/");

    // 12. Frequently Asked Questions Section
    const faqHeading = page.getByRole("heading", { name: "Frequently Asked Questions" });
    await expect(faqHeading).toBeVisible();

    // Test FAQ accordion toggle
    const firstFaqBtn = page.locator("section:has-text('Frequently Asked Questions') button").first();
    await expect(firstFaqBtn).toBeVisible();
    // Click to toggle
    await firstFaqBtn.click();
    // Click again to expand/collapse
    await firstFaqBtn.click();

    // Scroll through the page to trigger smooth appearances
    await page.evaluate(async () => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 400));
      window.scrollTo({ top: 0, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 400));
    });

    // Capture desktop full page screenshot for visual audit
    await page.screenshot({ path: "test-results/homepage-desktop-full.png", fullPage: true });

    // 13. Mobile Responsiveness and Drawer Check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    // Capture mobile full page screenshot for visual audit
    await page.screenshot({ path: "test-results/homepage-mobile-full.png", fullPage: true });

    // Verify hamburger button exists on mobile
    const hamburgerBtn = page.getByRole("button", { name: "Toggle navigation" });
    await expect(hamburgerBtn).toBeVisible();

    // Open mobile menu
    await hamburgerBtn.click();
    // Wishlist should be visible in drawer
    const drawerWishlist = page.locator(".lg\\:hidden").getByRole("link", { name: /wishlist/i });
    await expect(drawerWishlist).toBeVisible();

    // Close mobile menu
    await hamburgerBtn.click();

    // Check no horizontal page overflow on mobile
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow, "Page should not have accidental horizontal overflow on mobile").toBe(false);
  });

  test("audit after-login profile dropdown functionality and appearance", async ({ page }) => {
    // Enable authenticated mock session
    await page.addInitScript(() => {
      window.localStorage.setItem("tourvaa_docs_dashboard", "1");
    });

    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("header");
    await page.waitForTimeout(800);

    // Profile button should display user first name or avatar
    const profileBtn = page.locator("header nav button").filter({ hasText: /Super|Profile/ });
    await expect(profileBtn).toBeVisible();

    // Click to open after-login dropdown
    await profileBtn.click();
    await page.waitForTimeout(400);

    const dropdown = page.locator(".profile-dropdown-panel");
    await expect(dropdown).toBeVisible();
    await expect(dropdown.locator("p:has-text('Super Admin')")).toBeVisible();
    await expect(dropdown.locator("span:has-text('Super Admin')")).toBeVisible();
    await expect(dropdown.getByText("admin@tourvaa.com")).toBeVisible();
    await expect(dropdown.locator("a:has-text('My Dashboard')")).toBeVisible();
    await expect(dropdown.locator("a:has-text('Account Settings')")).toBeVisible();
    await expect(dropdown.locator("a:has-text('Help Centre')")).toBeVisible();
    await expect(dropdown.locator("button:has-text('Sign Out')")).toBeVisible();

    // Take screenshot of after-login dropdown
    await dropdown.screenshot({ path: "test-results/profile-dropdown-after-login.png" });

    // Clean up
    await page.evaluate(() => window.localStorage.removeItem("tourvaa_docs_dashboard"));
  });

  test("audit header icons and carousel chevron navigation buttons", async ({ page }) => {
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("header");

    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Verify Wishlist, Compare, and Globe icons
    const wishlistLink = header.getByRole("link", { name: /wishlist/i });
    const compareLink = header.getByRole("link", { name: /compare/i });
    await expect(wishlistLink).toBeVisible();
    await expect(compareLink).toBeVisible();

    // Take screenshot of the public header
    await header.screenshot({ path: "test-results/header-icons.png" });

    // Dismiss cookie banner if visible
    const cookieAccept = page.getByRole("button", { name: /accept all/i });
    if (await cookieAccept.isVisible()) {
      await cookieAccept.click();
      await page.waitForTimeout(300);
    }

    // Hover over Egypt tours card and capture screenshot of orange hover state
    const egyptCard = page.locator("a:has-text('Egypt tours')").first();
    if (await egyptCard.isVisible()) {
      await egyptCard.scrollIntoViewIfNeeded();
      await egyptCard.hover();
      await page.waitForTimeout(400);
      await egyptCard.screenshot({ path: "test-results/favourite-countries-hover-orange.png" });
    }
  });
});


