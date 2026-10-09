import { expect, test, type Page } from "@playwright/test";

const groups = {
  "operations": ["/supplier/dashboard", "/supplier/bookings", "/supplier/tours"],
  "commercial": ["/supplier/discounts", "/supplier/earnings", "/supplier/payouts", "/supplier/invoices"],
  "communication": ["/supplier/messages", "/supplier/notifications", "/supplier/reports"],
  "account": ["/supplier/profile", "/supplier/onboarding"],
};

async function signIn(page: Page) {
  const email = process.env.E2E_SUPPLIER_EMAIL;
  const password = process.env.E2E_SUPPLIER_PASSWORD;
  test.skip(!email || !password, "Set E2E_SUPPLIER_EMAIL and E2E_SUPPLIER_PASSWORD to audit authenticated supplier routes.");

  await page.goto("/supplier-portal/login");
  await page.getByPlaceholder("name@example.com or mobile number").fill(email!);
  await page.getByPlaceholder("Enter your password").fill(password!);
  await page.getByRole("button", { name: /sign in as supplier/i }).click();
  await expect(page).toHaveURL(/\/supplier\/dashboard/);
}

for (const [name, routes] of Object.entries(groups)) {
  test(`supplier ${name} render without client errors or server failures`, async ({ page }) => {
    const pageErrors: string[] = [];
    const serverFailures: string[] = [];
    const authorizationFailures: string[] = [];

    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (url.origin !== new URL(page.url()).origin) return;
      if (response.status() >= 500) serverFailures.push(`${response.status()} ${url.pathname}`);
      if (response.status() === 401 || response.status() === 403) authorizationFailures.push(`${response.status()} ${url.pathname}`);
    });

    await signIn(page);
    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(route.replaceAll("/", "\\/")));
      await expect(page.locator("main")).toBeVisible();
      await page.waitForTimeout(350);
    }

    expect(pageErrors, `Client errors in ${name}:\n${pageErrors.join("\n")}`).toEqual([]);
    expect(serverFailures, `Server failures in ${name}:\n${serverFailures.join("\n")}`).toEqual([]);
    expect(authorizationFailures, `Unexpected authorization failures in ${name}:\n${authorizationFailures.join("\n")}`).toEqual([]);
  });
}
