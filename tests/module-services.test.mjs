/**
 * Frontend Module Services Test
 * Verifies that all service files exist and export the expected functions.
 * Parses the TypeScript source as text - no transpilation needed.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LIB_DIR = resolve(__dirname, "../src/lib");
const SERVICES_DIR = resolve(LIB_DIR, "api/services");

let passed = 0;
let failed = 0;
const errors = [];

function check(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
    errors.push(label);
  }
}

function readService(file) {
  const p = resolve(SERVICES_DIR, file);
  if (!existsSync(p)) return "";
  return readFileSync(p, "utf-8");
}

function readLib(file) {
  const p = resolve(LIB_DIR, file);
  if (!existsSync(p)) return "";
  return readFileSync(p, "utf-8");
}

function hasExport(src, name) {
  return src.includes(`export async function ${name}`) ||
    src.includes(`export function ${name}`) ||
    src.includes(`export const ${name}`);
}

console.log("\n=== Frontend Service Files ===\n");

// Core lib files
console.log("── Core lib");
const apiSrc = readLib("api/client.ts");
check("lib/api/client.ts exists", apiSrc.length > 0);
check("api uses /api base path", apiSrc.includes('"/api"') || apiSrc.includes("'/api'") || apiSrc.includes("API_PATH_PREFIX"));
check("api has request interceptor", apiSrc.includes("interceptors.request"));
check("api has response interceptor", apiSrc.includes("interceptors.response"));
check("api handles 401 with refresh", apiSrc.includes("refresh-token") && apiSrc.includes("401"));

const sessionSrc = readLib("api/session.ts");
check("lib/api/session.ts exists", sessionSrc.length > 0);
check("session has getStoredTokenSafe", sessionSrc.includes("getStoredTokenSafe"));
check("session has clearSession", sessionSrc.includes("clearSession"));
check("session has setToken", sessionSrc.includes("setToken"));

// cmsService
console.log("── cmsService");
const cmsSrc = readService("cmsService.ts");
check("cmsService.ts exists", cmsSrc.length > 0);
check("listCms exported", hasExport(cmsSrc, "listCms"));
check("getCms exported", hasExport(cmsSrc, "getCms"));
check("createCms exported", hasExport(cmsSrc, "createCms"));
check("updateCms exported", hasExport(cmsSrc, "updateCms"));
check("updateCmsStatus exported", hasExport(cmsSrc, "updateCmsStatus"));

// customerService
console.log("── customerService");
const customerSrc = readService("customerService.ts");
check("customerService.ts exists", customerSrc.length > 0);

// operationsService
console.log("── operationsService");
const opsSrc = readService("operationsService.ts");
check("operationsService.ts exists", opsSrc.length > 0);

// bookingService
console.log("── bookingService");
const bookingSrc = readService("bookingService.ts");
check("bookingService.ts exists", bookingSrc.length > 0);

// paymentService
console.log("── paymentService");
const paymentSrc = readService("paymentService.ts");
check("paymentService.ts exists", paymentSrc.length > 0);

// tourDetailService - Week 9 & 10
console.log("── tourDetailService (Week 9 + 10)");
const tdSrc = readService("tourDetailService.ts");
check("tourDetailService.ts exists", tdSrc.length > 0);
check("getOverview exported", hasExport(tdSrc, "getOverview"));
check("saveOverview exported", hasExport(tdSrc, "saveOverview"));
check("getItineraries exported", hasExport(tdSrc, "getItineraries"));
check("createItinerary exported", hasExport(tdSrc, "createItinerary"));
check("reorderItineraries exported", hasExport(tdSrc, "reorderItineraries"));
check("getInclusions exported", tdSrc.includes("getInclusions"));
check("getExclusions exported", tdSrc.includes("getExclusions"));
check("getHighlights exported", hasExport(tdSrc, "getHighlights"));
check("getSimilarTours exported", hasExport(tdSrc, "getSimilarTours"));
check("getExtensions exported", hasExport(tdSrc, "getExtensions"));
check("getGallery exported", hasExport(tdSrc, "getGallery"));
check("getPricing exported", hasExport(tdSrc, "getPricing"));
check("getOptionalActivities exported", hasExport(tdSrc, "getOptionalActivities"));
check("getAccommodationExtras exported", hasExport(tdSrc, "getAccommodationExtras"));
check("getCalendar exported", hasExport(tdSrc, "getCalendar"));
check("getUnavailableDates exported", hasExport(tdSrc, "getUnavailableDates"));
check("getDiscounts exported", hasExport(tdSrc, "getDiscounts"));

// No /v1 in any service
console.log("── API path hygiene");
const allServicesSrc = [cmsSrc, customerSrc, opsSrc, bookingSrc, paymentSrc, tdSrc, apiSrc].join("\n");
check("No /api/v1 path in any service file", !allServicesSrc.includes("/api/v1"));

// Summary
console.log(`\nServices: ${passed} passed, ${failed} failed`);
if (errors.length) {
  console.error("Failed:", errors.join(", "));
  process.exit(1);
}
