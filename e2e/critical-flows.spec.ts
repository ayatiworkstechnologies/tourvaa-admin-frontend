import { expect, Page, test } from "@playwright/test";

type RoleCase = {
  name: string;
  emailEnv: string;
  passwordEnv: string;
  loginPath: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  signInLabel: RegExp;
  dashboard: string;
  bookings?: string;
};

const roles: RoleCase[] = [
  { name: "admin", emailEnv: "E2E_ADMIN_EMAIL", passwordEnv: "E2E_ADMIN_PASSWORD", loginPath: "/admin/login", emailPlaceholder: "Enter email address", passwordPlaceholder: "Password", signInLabel: /^login$/i, dashboard: "/admin/dashboard", bookings: "/admin/bookings" },
  { name: "customer", emailEnv: "E2E_CUSTOMER_EMAIL", passwordEnv: "E2E_CUSTOMER_PASSWORD", loginPath: "/login", emailPlaceholder: "you@example.com or +919876543210", passwordPlaceholder: "Your password", signInLabel: /sign in as traveller/i, dashboard: "/customer/dashboard", bookings: "/customer/bookings" },
  { name: "supplier", emailEnv: "E2E_SUPPLIER_EMAIL", passwordEnv: "E2E_SUPPLIER_PASSWORD", loginPath: "/supplier-portal/login", emailPlaceholder: "you@example.com or +919876543210", passwordPlaceholder: "Your password", signInLabel: /sign in as supplier/i, dashboard: "/supplier/dashboard", bookings: "/supplier/bookings" },
  { name: "agent", emailEnv: "E2E_AGENT_EMAIL", passwordEnv: "E2E_AGENT_PASSWORD", loginPath: "/agent-portal/login", emailPlaceholder: "you@example.com or +919876543210", passwordPlaceholder: "Your password", signInLabel: /sign in as agent/i, dashboard: "/agent/dashboard", bookings: "/agent/bookings" },
];

async function login(page: Page, role: RoleCase) {
  const email = process.env[role.emailEnv];
  const password = process.env[role.passwordEnv];
  await page.goto(role.loginPath);
  await page.getByPlaceholder(role.emailPlaceholder).fill(email!);
  await page.getByPlaceholder(role.passwordPlaceholder).fill(password!);
  await page.getByRole("button", { name: role.signInLabel }).click();
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
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
      await login(page, role);
      const cookies = await context.cookies();
      expect(cookies.find((cookie) => cookie.name === "tourvaa_access")?.httpOnly).toBe(true);
      const storedToken = await page.evaluate(() => window.localStorage.getItem("tourvaa_token"));
      expect(storedToken).toBeNull();
      await expect(page.locator("main"), pageErrors.join("\n\n") || "Dashboard main content should render").toBeVisible();
    });

    test("role can open its bookings workflow", async ({ page }) => {
      await login(page, role);
      await page.goto(role.bookings!);
      await expect(page).toHaveURL(new RegExp(role.bookings!.replaceAll("/", "\\/")));
      await expect(page.locator("main")).toBeVisible();
    });
  });
}
