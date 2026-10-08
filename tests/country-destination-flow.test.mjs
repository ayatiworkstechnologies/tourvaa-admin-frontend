/** Country destination-guide CMS source-of-truth checks. */
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) { console.log(`  ok ${label}`); passed++; }
  else { console.error(`  FAIL ${label}`); failed++; }
}

console.log("\n=== Country Destination CMS Flow ===\n");
const page = read("src/app/(public)/destinations/[slug]/page.tsx");
const serverData = read("src/lib/data/countryDestinationCms.ts");
const editor = read("src/components/admin/cms/CountryDestinationInfoPanel.tsx");

check("destination page reads its CMS guide during server rendering", page.includes("fetchCountryDestinationInfoForServer(slug)"));
check("server guide fetch bypasses relative browser API routing", serverData.includes("API_PROXY_TARGET") && serverData.includes("cache: \"no-store\""));
check("saved guide content merges with a complete country fallback", ["quick_facts", "why_visit", "best_time_to_visit", "monsoon_info", "temperature_info", "best_places_to_visit", "travel_info"].every((field) => serverData.includes(field)));
check("admin can save each selected country guide to its scoped CMS block", editor.includes("country_info_${slug}") && editor.includes("Destination Guide CMS"));

console.log(`\nCountry destination CMS flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
