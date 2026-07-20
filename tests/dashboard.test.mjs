/**
 * Frontend Dashboard Test
 *
 * Verifies:
 * - dashboardService.ts exists and exports required functions
 * - Dashboard page exists
 * - Dashboard components exist (if present)
 * - Dashboard uses /api (not /api/v1)
 * - Sidebar / permission-based logic exists
 * - No /api/v1 reference anywhere in dashboard-related files
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../src");

let passed = 0;
let failed = 0;
const errors = [];

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? " - " + detail : ""}`);
    failed++;
    errors.push(label);
  }
}


function readFile(rel) {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) return "";
  return readFileSync(p, "utf-8");
}

function hasExport(src, name) {
  return (
    src.includes(`export async function ${name}`) ||
    src.includes(`export function ${name}`) ||
    src.includes(`export const ${name}`)
  );
}

// ---------------------------------------------------------------------------
// Dashboard Service
// ---------------------------------------------------------------------------
console.log("\n=== Dashboard Service ===\n");

const svcSrc = readFile("lib/api/services/dashboardService.ts");
check("dashboardService.ts exists", svcSrc.length > 0);
check("getDashboardMe exported", hasExport(svcSrc, "getDashboardMe"));
check("getDashboardSummary exported", hasExport(svcSrc, "getDashboardSummary"));
check("getDashboardCharts exported", hasExport(svcSrc, "getDashboardCharts"));
check("getDashboardRecentActivities exported", hasExport(svcSrc, "getDashboardRecentActivities"));
check("getDashboardAlerts exported", hasExport(svcSrc, "getDashboardAlerts"));
check("dashboardService uses /dashboard/me", svcSrc.includes("/dashboard/me"));
check("dashboardService uses /dashboard/summary", svcSrc.includes("/dashboard/summary"));
check("dashboardService uses /dashboard/charts", svcSrc.includes("/dashboard/charts"));
check("dashboardService uses /dashboard/alerts", svcSrc.includes("/dashboard/alerts"));
check("dashboardService has no /api/v1", !svcSrc.includes("/api/v1"));

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------
console.log("\n=== Dashboard Page ===\n");

const pageSrc = readFile("app/admin/dashboard/page.tsx");
check("app/admin/dashboard/page.tsx exists", pageSrc.length > 0);
check("dashboard page uses /dashboard/me or useDashboard", pageSrc.includes("/dashboard/me") || pageSrc.includes("useDashboard"));
check("dashboard page has no /api/v1", !pageSrc.includes("/api/v1"));

// ---------------------------------------------------------------------------
// Auth Provider - dashboard_type and allowed_modules
// ---------------------------------------------------------------------------
console.log("\n=== Auth Provider Types ===\n");

const authProviderSrc = readFile("providers/AuthProvider.tsx");
check("AuthProvider.tsx exists", authProviderSrc.length > 0);
check("AuthProvider includes dashboard_type", authProviderSrc.includes("dashboard_type"));
check("AuthProvider includes allowed_modules", authProviderSrc.includes("allowed_modules"));
check("AuthProvider includes sidebar_menu", authProviderSrc.includes("sidebar_menu"));

// ---------------------------------------------------------------------------
// Auth Types
// ---------------------------------------------------------------------------
console.log("\n=== Auth Types ===\n");

const authTypesSrc = readFile("types/auth.ts");
check("types/auth.ts exists", authTypesSrc.length > 0);
check("AuthUser has user_type", authTypesSrc.includes("user_type"));
check("AuthUser has approval_status", authTypesSrc.includes("approval_status"));

// ---------------------------------------------------------------------------
// Dashboard Hook
// ---------------------------------------------------------------------------
console.log("\n=== Dashboard Hook ===\n");

const hookSrc = readFile("hooks/useDashboard.ts");
check("hooks/useDashboard.ts exists", hookSrc.length > 0);
check("useDashboard hook exported", hookSrc.includes("export function useDashboard") || hookSrc.includes("export const useDashboard"));

// ---------------------------------------------------------------------------
// Protected Route - permission check
// ---------------------------------------------------------------------------
console.log("\n=== Protected Route ===\n");

const protectedSrc = readFile("components/auth/ProtectedRoute.tsx");
check("ProtectedRoute.tsx exists", protectedSrc.length > 0);
check("ProtectedRoute checks permission", protectedSrc.includes("requiredPermission") || protectedSrc.includes("hasPermission"));

// ---------------------------------------------------------------------------
// No /api/v1 anywhere in dashboard-related files
// ---------------------------------------------------------------------------
console.log("\n=== API Path Hygiene ===\n");

const allSrc = [svcSrc, pageSrc, authProviderSrc, authTypesSrc, hookSrc].join("\n");
check("No /api/v1 in any dashboard file", !allSrc.includes("/api/v1"));

// Also check api client
const apiSrc = readFile("lib/api/client.ts");
check("lib/api/client.ts uses /api base path", apiSrc.includes('"/api"') || apiSrc.includes("'/api'") || apiSrc.includes("API_PATH_PREFIX"));
check("lib/api/client.ts has no /api/v1", !apiSrc.includes("/api/v1"));

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\nDashboard: ${passed} passed, ${failed} failed`);
if (errors.length) {
  console.error("Failed:", errors.join(", "));
  process.exit(1);
}
