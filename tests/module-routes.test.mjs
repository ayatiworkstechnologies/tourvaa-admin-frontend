/**
 * Frontend Module Routes Test
 * Verifies that all admin page routes exist as files and are not empty.
 * No server required — pure filesystem checks.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, "../app");

let passed = 0;
let failed = 0;
const errors = [];

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? " — " + detail : ""}`);
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

// Auth routes
console.log("── Auth");
check("login/page.tsx exists", routeExists("login/page.tsx"));
check("login/page.tsx has content", routeNotEmpty("login/page.tsx"));
check("register/page.tsx exists", routeExists("register/page.tsx"));
check("forgot-password/page.tsx exists", routeExists("forgot-password/page.tsx"));
check("reset-password/page.tsx exists", routeExists("reset-password/page.tsx"));

// Dashboard
console.log("── Dashboard");
check("dashboard/page.tsx exists", routeExists("dashboard/page.tsx"));
check("dashboard/page.tsx has content", routeNotEmpty("dashboard/page.tsx"));

// RBAC
console.log("── RBAC");
check("roles/page.tsx exists", routeExists("roles/page.tsx"));
check("permissions/page.tsx exists", routeExists("permissions/page.tsx"));
check("users/page.tsx exists", routeExists("users/page.tsx"));

// CMS — Customers, Suppliers, Agents, Affiliates
console.log("── Customers / Suppliers / Agents / Affiliates");
check("customers/page.tsx exists", routeExists("customers/page.tsx"));
check("customers/[id]/page.tsx exists", routeExists("customers/[id]/page.tsx"));
check("suppliers/page.tsx exists", routeExists("suppliers/page.tsx"));
check("suppliers/[id]/page.tsx exists", routeExists("suppliers/[id]/page.tsx"));
check("agents/page.tsx exists", routeExists("agents/page.tsx"));
check("agents/[id]/page.tsx exists", routeExists("agents/[id]/page.tsx"));
check("affiliates/page.tsx exists", routeExists("affiliates/page.tsx"));
check("affiliates/[id]/page.tsx exists", routeExists("affiliates/[id]/page.tsx"));

// Tours
console.log("── Tours");
check("tours/page.tsx exists", routeExists("tours/page.tsx"));
check("tours/create/page.tsx exists", routeExists("tours/create/page.tsx"));
check("tours/[id]/edit/page.tsx exists", routeExists("tours/[id]/edit/page.tsx"));
check("tours/categories/page.tsx exists", routeExists("tours/categories/page.tsx"));
check("tours/subcategories/page.tsx exists", routeExists("tours/subcategories/page.tsx"));

// Settings
console.log("── Settings");
check("settings/page.tsx exists", routeExists("settings/page.tsx"));
check("settings/countries/page.tsx exists", routeExists("settings/countries/page.tsx"));
check("settings/cities/page.tsx exists", routeExists("settings/cities/page.tsx"));
check("settings/payment/page.tsx exists", routeExists("settings/payment/page.tsx"));
check("settings/api/page.tsx exists", routeExists("settings/api/page.tsx"));

// Reports & Profile
console.log("── Reports / Profile");
check("reports/page.tsx exists", routeExists("reports/page.tsx"));
check("profile/page.tsx exists", routeExists("profile/page.tsx"));

// Summary
console.log(`\nRoutes: ${passed} passed, ${failed} failed`);
if (errors.length) {
  console.error("Failed:", errors.join(", "));
  process.exit(1);
}
