import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleErrors = [];
page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
page.on("pageerror", (err) => consoleErrors.push(String(err)));

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.waitForSelector('input[autocomplete="username"]', { timeout: 15000 });
await page.fill('input[autocomplete="username"]', "qa-portal-test@example.com");
await page.fill('input[autocomplete="current-password"]', "QaTest@12345");
await page.click('button[type="submit"]');

try {
  await page.waitForURL(/\/customer\/dashboard/, { timeout: 20000 });
} catch {
  console.log("LOGIN_FAILED_URL:", page.url());
  await browser.close();
  process.exit(1);
}

await page.waitForSelector("text=Profile Details", { timeout: 15000 });
await page.waitForTimeout(800);
await page.screenshot({ path: "portal_dashboard.png", fullPage: true });

// check sidebar doesn't have removed items and topbar is gone
const hasBrowseTours = await page.locator("text=Browse Tours").count();
const hasSearchPlaceholder = await page.locator('input[placeholder*="Search destinations"]').count();
const hasSettingsLink = await page.locator("text=Settings").count();
const hasLogout = await page.locator("text=Logout").count();

console.log("hasBrowseTours(shouldBe0):", hasBrowseTours);
console.log("hasTopbarSearch(shouldBe0):", hasSearchPlaceholder);
console.log("hasSettingsLink(shouldBe>=1):", hasSettingsLink);
console.log("hasLogout(shouldBe>=1):", hasLogout);

await page.goto(`${BASE}/customer/bookings`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: "portal_bookings.png", fullPage: true });

console.log("URL:", page.url());
console.log("CONSOLE_ERRORS:", JSON.stringify(consoleErrors));
await browser.close();
