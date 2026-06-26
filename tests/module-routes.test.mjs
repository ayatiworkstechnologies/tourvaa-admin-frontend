/**
 * Frontend Module Routes Test
 * Verifies that all admin page routes exist as files and are not empty.
 * No server required - pure filesystem checks.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, "../app");

let passed = 0;
let failed = 0;
const errors = [];

function check(label, condition, detail) {
  detail = detail || "";
  if (condition) {
    console.log("  ok " + label);
    passed++;
  } else {
    console.error("  FAIL " + label + (detail ? " -- " + detail : ""));
    failed++;
    errors.push(label);
  }
}

function routeExists(route) {
  return existsSync(resolve(APP_DIR, route));
}

function routeNotEmpty(route) {
  const file = resolve(APP_DIR, route);
  if (!existsSync(file)) return false;
  const content = readFileSync(file, "utf-8").trim();
  return content.length > 50;
}

console.log("\n=== Frontend Module Routes ===\n");

// Auth routes - login/register live in the (public) route group
console.log("-- Auth");
const loginExists = routeExists("login/page.tsx") || routeExists("(public)/login/page.tsx");
const loginNotEmpty = routeNotEmpty("login/page.tsx") || routeNotEmpty("(public)/login/page.tsx");
const registerExists = routeExists("register/page.tsx") || routeExists("(public)/register/page.tsx");
const forgotExists = routeExists("forgot-password/page.tsx") || routeExists("(public)/forgot-password/page.tsx");
const resetExists = routeExists("reset-password/page.tsx") || routeExists("(public)/reset-password/page.tsx");
check("login/page.tsx exists", loginExists);
check("login/page.tsx has content", loginNotEmpty);
check("register/page.tsx exists", registerExists);
check("forgot-password/page.tsx exists", forgotExists);
check("reset-password/page.tsx exists", resetExists);

// Dashboard
console.log("-- Dashboard");
check("admin/dashboard/page.tsx exists", routeExists("admin/dashboard/page.tsx"));
check("admin/dashboard/page.tsx has content", routeNotEmpty("admin/dashboard/page.tsx"));

// RBAC
console.log("-- RBAC");
check("admin/roles/page.tsx exists", routeExists("admin/roles/page.tsx"));
check("admin/permissions/page.tsx exists", routeExists("admin/permissions/page.tsx"));
check("admin/users/page.tsx exists", routeExists("admin/users/page.tsx"));

// Customers, Suppliers, Agents, Affiliates
console.log("-- Customers / Suppliers / Agents / Affiliates");
check("admin/customers/page.tsx exists", routeExists("admin/customers/page.tsx"));
check("admin/customers/[id]/page.tsx exists", routeExists("admin/customers/[id]/page.tsx"));
check("admin/suppliers/page.tsx exists", routeExists("admin/suppliers/page.tsx"));
check("admin/suppliers/[id]/page.tsx exists", routeExists("admin/suppliers/[id]/page.tsx"));
check("admin/agents/page.tsx exists", routeExists("admin/agents/page.tsx"));
check("admin/agents/[id]/page.tsx exists", routeExists("admin/agents/[id]/page.tsx"));
check("admin/affiliates/page.tsx exists", routeExists("admin/affiliates/page.tsx"));
check("admin/affiliates/[id]/page.tsx exists", routeExists("admin/affiliates/[id]/page.tsx"));

// Tours
console.log("-- Tours");
check("admin/tours/page.tsx exists", routeExists("admin/tours/page.tsx"));
check("admin/tours/create/page.tsx exists", routeExists("admin/tours/create/page.tsx"));
check("admin/tours/[id]/edit/page.tsx exists", routeExists("admin/tours/[id]/edit/page.tsx"));
check("admin/tours/categories/page.tsx exists", routeExists("admin/tours/categories/page.tsx"));
check("admin/tours/subcategories/page.tsx exists", routeExists("admin/tours/subcategories/page.tsx"));

// Settings
console.log("-- Settings");
check("admin/settings/page.tsx exists", routeExists("admin/settings/page.tsx"));
check("admin/settings/countries/page.tsx exists", routeExists("admin/settings/countries/page.tsx"));
check("admin/settings/cities/page.tsx exists", routeExists("admin/settings/cities/page.tsx"));
check("admin/settings/payment/page.tsx exists", routeExists("admin/settings/payment/page.tsx"));
check("admin/settings/api/page.tsx exists", routeExists("admin/settings/api/page.tsx"));

// Reports and Profile
console.log("-- Reports / Profile");
check("admin/reports/page.tsx exists", routeExists("admin/reports/page.tsx"));
check("admin/profile/page.tsx exists", routeExists("admin/profile/page.tsx"));

// Summary
console.log("\nRoutes: " + passed + " passed, " + failed + " failed");
if (errors.length) {
  console.error("Failed: " + errors.join(", "));
  process.exit(1);
}
