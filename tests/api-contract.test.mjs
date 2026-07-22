/** Cross-repository API contract check. Requires Python and the sibling backend. */
import { readFileSync, readdirSync } from "fs";
import { dirname, extname, join, relative, resolve } from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendRoot = resolve(root, "../tourvaa-admin-backend");

const registryScript = [
  "import json",
  "from app.main import app",
  "schema = app.openapi()",
  "print(json.dumps([{'path': path, 'methods': [method.upper() for method in operations.keys()]} for path, operations in schema['paths'].items()]))",
].join("; ");
const registryResult = spawnSync("python", ["-c", registryScript], { cwd: backendRoot, encoding: "utf8" });
if (registryResult.status !== 0) {
  console.error(registryResult.stderr || "Could not load the FastAPI route registry");
  process.exit(1);
}
const registry = JSON.parse(registryResult.stdout.trim().split(/\r?\n/).at(-1));

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return filesIn(path);
    return [".ts", ".tsx"].includes(extname(entry.name)) ? [path] : [];
  });
}

function normalizeFrontendPath(client, value) {
  if (/^https?:\/\//.test(value) || !value.startsWith("/")) return null;
  const prefix = client === "publicApi" ? "/api/public" : client === "cmsApi" ? "/api/cms" : "/api";
  let clean = value.replace(/\$\{buildQuery\([^}]+\)\}/g, "").split("?")[0].replace(/\$\{[^}]+\}/g, "{value}");
  if (value.includes("?") && clean.endsWith("{value}")) clean = clean.slice(0, -7);
  return `${prefix}${clean}`.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
}

function routeMatches(frontendPath, backendPath) {
  const frontendParts = frontendPath.split("/").filter(Boolean);
  const backendParts = backendPath.replace(/\/$/, "").split("/").filter(Boolean);
  return frontendParts.length === backendParts.length && backendParts.every((part, index) => part.startsWith("{") || frontendParts[index].startsWith("{") || part === frontendParts[index]);
}

const calls = [];
for (const file of filesIn(resolve(root, "src"))) {
  const source = readFileSync(file, "utf8");
  const pattern = /\b(api|publicApi|cmsApi|authAxios)\.(get|post|put|patch|delete)\s*\(\s*(["'`])([^"'`]+)\3/g;
  for (const match of source.matchAll(pattern)) {
    const path = normalizeFrontendPath(match[1], match[4]);
    if (path) calls.push({ method: match[2].toUpperCase(), path, file: relative(root, file) });
  }
}

const ignored = new Set([
  // Next.js same-origin endpoints, not FastAPI routes.
  "GET /api/settings/public",
]);
const missing = calls.filter((call) => !ignored.has(`${call.method} ${call.path}`) && !registry.some((route) => route.methods.includes(call.method) && routeMatches(call.path, route.path)));
const uniqueMissing = [...new Map(missing.map((item) => [`${item.method} ${item.path} ${item.file}`, item])).values()];

console.log("\n=== Frontend / Backend API Contract ===\n");
if (uniqueMissing.length) {
  uniqueMissing.forEach((item) => console.error(`  FAIL ${item.method} ${item.path} (${item.file})`));
  console.error(`\nContract: ${calls.length - uniqueMissing.length} matched, ${uniqueMissing.length} missing`);
  process.exit(1);
}
console.log(`  ok all ${calls.length} statically declared frontend API calls match FastAPI routes`);
console.log("\nContract: passed");
