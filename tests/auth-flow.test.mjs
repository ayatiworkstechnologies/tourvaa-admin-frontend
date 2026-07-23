/** Authentication and session-expiry contract checks. No server required. */
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  ok ${label}`);
    passed++;
  } else {
    console.error(`  FAIL ${label}`);
    failed++;
  }
}

console.log("\n=== Authentication and Session Flow ===\n");

const client = read("src/lib/api/client.ts");
check("API requests include secure cookie credentials", (client.match(/withCredentials: true/g) || []).length >= 2);
check("browser requests never attach JavaScript bearer tokens", !client.includes("config.headers.Authorization"));
check("concurrent 401 responses share one refresh operation", client.includes("isRefreshing") && client.includes("refreshQueue"));
check("retried requests rely on the refreshed httpOnly cookie", client.includes('client_type: "web-cookie"') && !client.includes("newToken"));
check("expired sessions return to the matching portal login", client.includes('window.location.pathname.startsWith("/admin") ? "/admin/login" : "/login"'));
check("failed refresh clears stored authentication", client.includes("clearSession()"));

const session = read("src/lib/api/session.ts");
check("access tokens are never read from localStorage", !session.includes("localStorage.getItem(TOKEN_KEY)"));
check("access tokens are never written to localStorage", !session.includes("localStorage.setItem(TOKEN_KEY"));

const auth = read("src/providers/AuthProvider.tsx");
const verifyEmail = read("src/app/(public)/auth/verify-email/page.tsx");
check("verification and account-status pages remain public", auth.includes('"/auth/verify-email"') && auth.includes('"/account-status"'));
check("completed verification redirects to sign in", verifyEmail.includes("router.replace(loginHref)") && verifyEmail.includes("Password created"));
check("session restoration loads dashboard identity", auth.includes('api.get("/dashboard/me")'));
check("invalid restored sessions clear local state", auth.includes("clearSession()") && auth.includes("setDashboard(null)"));
check("authenticated login pages redirect by role", auth.includes("getDashboardPath(roleSlug)"));
check("explicit logout returns to the matching portal login", auth.includes('pathname.startsWith("/admin") ? "/admin/login" : "/login"') && auth.includes("const logout = useCallback((redirectTo?: string)"));

const adminGuard = read("src/components/admin/AdminRouteGuard.tsx");
check("admin guard rejects non-admin dashboard types", adminGuard.includes("ADMIN_DASHBOARD_TYPES.has(dashboard.dashboard_type)"));
check("admin guard sends signed-out users to the dedicated admin login", adminGuard.includes('router.replace("/admin/login")'));

console.log(`\nAuthentication flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
