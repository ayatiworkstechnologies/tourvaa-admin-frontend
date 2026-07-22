import { expect, Page, test } from "@playwright/test";

type RoleCase = {
  name: string;
  emailEnv: string;
  passwordEnv: string;
  dashboard: string;
  bookings?: string;
};

const roles: RoleCase[] = [
  { name: "admin", emailEnv: "E2E_ADMIN_EMAIL", passwordEnv: "E2E_ADMIN_PASSWORD", dashboard: "/admin/dashboard", bookings: "/admin/bookings" },
  { name: "customer", emailEnv: "E2E_CUSTOMER_EMAIL", passwordEnv: "E2E_CUSTOMER_PASSWORD", dashboard: "/customer/dashboard", bookings: "/customer/bookings" },
  { name: "supplier", emailEnv: "E2E_SUPPLIER_EMAIL", passwordEnv: "E2E_SUPPLIER_PASSWORD", dashboard: "/supplier/dashboard", bookings: "/supplier/bookings" },
  { name: "agent", emailEnv: "E2E_AGENT_EMAIL", passwordEnv: "E2E_AGENT_PASSWORD", dashboard: "/agent/dashboard", bookings: "/agent/bookings" },
];

async function login(page: Page, role: RoleCase) {
  const email = process.env[role.emailEnv];
  const password = process.env[role.passwordEnv];
  await page.goto(`/login?role=${role.name}`);
  await page.getByPlaceholder("you@example.com").fill(email!);
  await page.getByPlaceholder("Your password").fill(password!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(new RegExp(role.dashboard.replaceAll("/", "\\/")));
}

test("public login screen is available", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  await expect(page.getByPlaceholder("Your password")).toBeVisible();
});

for (const role of roles) {
  test.describe(`${role.name} portal`, () => {
    test.skip(!process.env[role.emailEnv] || !process.env[role.passwordEnv], `Set ${role.emailEnv} and ${role.passwordEnv} to run ${role.name} flows.`);
    test("login establishes an httpOnly session and opens the dashboard", async ({ page, context }) => {
      await login(page, role);
      const cookies = await context.cookies();
      expect(cookies.find((cookie) => cookie.name === "tourvaa_access")?.httpOnly).toBe(true);
      const storedToken = await page.evaluate(() => window.localStorage.getItem("tourvaa_token"));
      expect(storedToken).toBeNull();
      await expect(page.locator("main")).toBeVisible();
    });

    test("role can open its bookings workflow", async ({ page }) => {
      await login(page, role);
      await page.goto(role.bookings!);
      await expect(page).toHaveURL(new RegExp(role.bookings!.replaceAll("/", "\\/")));
      await expect(page.locator("main")).toBeVisible();
    });
  });
}
