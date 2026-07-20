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
check("protected requests attach the bearer token", client.includes("config.headers.Authorization = `Bearer ${token}`"));
check("public API requests do not receive the bearer token", client.includes("!isPublicApiPath(config.url)"));
check("concurrent 401 responses share one refresh operation", client.includes("isRefreshing") && client.includes("refreshQueue"));
check("retried requests use the refreshed token", client.includes("originalRequest.headers.Authorization = `Bearer ${newToken}`"));
check("expired sessions always return to the shared login", client.includes('window.location.assign("/login")'));
check("failed refresh clears stored authentication", client.includes("clearSession()"));

const auth = read("src/providers/AuthProvider.tsx");
check("session restoration loads dashboard identity", auth.includes('api.get("/dashboard/me")'));
check("invalid restored sessions clear local state", auth.includes("clearSession()") && auth.includes("setDashboard(null)"));
check("authenticated login pages redirect by role", auth.includes("getDashboardPath(roleSlug)"));
check("explicit logout always uses the shared login", auth.includes('router.replace("/login")') && auth.includes("const logout = useCallback(()"));

const adminGuard = read("src/components/admin/AdminRouteGuard.tsx");
check("admin guard rejects non-admin dashboard types", adminGuard.includes("ADMIN_DASHBOARD_TYPES.has(dashboard.dashboard_type)"));
check("admin guard sends signed-out users to the shared login", adminGuard.includes('router.replace("/login")'));

console.log(`\nAuthentication flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
