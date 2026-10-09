import { expect, test, type Page } from "@playwright/test";

const groups = {
  "core operations": ["/admin/dashboard", "/admin/bookings", "/admin/tours"],
  "partner operations": ["/admin/customers", "/admin/suppliers", "/admin/agents"],
  "payments and service": ["/admin/payments", "/admin/invoices", "/admin/refunds", "/admin/supplier-payouts", "/admin/agent-payouts"],
  "support operations": ["/admin/reviews", "/admin/messages", "/admin/contact-enquiries", "/admin/checkout-sessions"],
  "access control": ["/admin/users", "/admin/roles", "/admin/permissions"],
  "system settings": ["/admin/settings", "/admin/settings/countries", "/admin/settings/cities"],
  "system configuration": ["/admin/settings/payment", "/admin/settings/api", "/admin/integrations"],
  "content management": ["/admin/cms", "/admin/blogs", "/admin/email-templates"],
  "oversight": ["/admin/notifications", "/admin/activity-logs", "/admin/audit-logs", "/admin/tour-approval"],
};

async function signIn(page: Page) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to audit authenticated admin routes.");

  await page.goto("/admin/login");
  await page.getByPlaceholder("name@company.com").fill(email!);
  await page.getByPlaceholder("Enter your password").fill(password!);
  await page.getByRole("button", { name: /^login$/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
}

for (const [name, routes] of Object.entries(groups)) {
  test(`admin ${name} render without client errors or server failures`, async ({ page }) => {
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
