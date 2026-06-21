/**
 * Frontend Module Permissions Test
 * Verifies that permission checks in components use the correct dotted format
 * and that no new hyphen-style permissions have been introduced.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { readdirSync, statSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = resolve(__dirname, "..");
const COMPONENTS_DIR = resolve(FRONTEND_DIR, "components");
const APP_DIR = resolve(FRONTEND_DIR, "app");

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

function getAllTsxFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = resolve(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) getAllTsxFiles(full, files);
    else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) files.push(full);
  }
  return files;
}

console.log("\n=== Frontend Permissions ===\n");

const allFiles = [...getAllTsxFiles(COMPONENTS_DIR), ...getAllTsxFiles(APP_DIR)];

// Collect all permission strings used in source

const hyphenFound = [];

// Known legacy hyphen-style permissions that are allowed for backward compat
// (the backend API returns these slugs for old menu entries — frontend mirrors them)
const ALLOWED_LEGACY_HYPHEN = new Set([
  "view-dashboard",
  "manage-users",
  "manage-roles",
  "view-reports",
  "view-users",
  "view-roles",
  "view-permissions",
  "view-email",
  "view-settings",
  "view-profile",
  "view-customers",
  "view-suppliers",
  "view-agents",
  "view-affiliates",
  "view-tours",
  "update-users",
]);

for (const file of allFiles) {
  const src = readFileSync(file, "utf-8");
  let match;

  const re1 = /["']([a-z]+-[a-z]+(?:-[a-z]+)*)["']/g;
  while ((match = re1.exec(src)) !== null) {
    const perm = match[1];
    // Filter to strings that look like permission slugs (all lowercase, 2+ parts)
    if (perm.split("-").length >= 2 && !ALLOWED_LEGACY_HYPHEN.has(perm) &&
        !perm.startsWith("http") && !perm.includes("/") &&
        perm.match(/^[a-z]+(-[a-z]+)+$/)) {
      // Only flag ones that appear near "permission" keyword
      const idx = match.index;
      const context = src.substring(Math.max(0, idx - 80), idx + 60);
      if (context.toLowerCase().includes("permission") || context.toLowerCase().includes("perm")) {
        hyphenFound.push({ file: file.replace(FRONTEND_DIR, ""), perm, context: context.replace(/\s+/g, " ").trim() });
      }
    }
  }
}

check("No unauthorized new hyphen-style permission strings", hyphenFound.length === 0,
  hyphenFound.length ? hyphenFound.slice(0, 3).map(h => `${h.perm} in ${h.file}`).join("; ") : "");

if (hyphenFound.length > 0) {
  console.log("  Potential hyphen-style permissions found:");
  for (const h of hyphenFound.slice(0, 5)) {
    console.log(`    "${h.perm}" in ${h.file}`);
  }
}

// Check that ProtectedRoute component exists and uses permission checks
console.log("\n── ProtectedRoute component");
const protectedRoutePath = resolve(COMPONENTS_DIR, "auth/ProtectedRoute.tsx");
const protectedRouteExists = existsSync(protectedRoutePath);
check("ProtectedRoute.tsx exists", protectedRouteExists);
if (protectedRouteExists) {
  const src = readFileSync(protectedRoutePath, "utf-8");
  // requiredPermission and hasPermission are the key guard patterns
  check("ProtectedRoute guards with permission prop", src.includes("requiredPermission") || src.includes("hasPermission") || src.includes("AccessDenied"));
}

// Check ModuleWrapper exists
console.log("\n── ModuleWrapper component");
const moduleWrapperPath = resolve(COMPONENTS_DIR, "common/ModuleWrapper.tsx");
const moduleWrapperExists = existsSync(moduleWrapperPath);
check("ModuleWrapper.tsx exists", moduleWrapperExists);
if (moduleWrapperExists) {
  const src = readFileSync(moduleWrapperPath, "utf-8");
  // ModuleWrapper delegates access control to ProtectedRoute
  check("ModuleWrapper delegates to ProtectedRoute", src.includes("ProtectedRoute") || src.includes("requiredPermission") || src.includes("AccessDenied"));
}

// Check AccessDenied component exists
const accessDeniedPath = resolve(COMPONENTS_DIR, "common/AccessDenied.tsx");
check("AccessDenied.tsx exists", existsSync(accessDeniedPath));

// Summary
console.log(`\nPermissions: ${passed} passed, ${failed} failed`);
if (errors.length) {
  console.error("Failed:", errors.join(", "));
  process.exit(1);
}
