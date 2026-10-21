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
const listing = read("src/app/(public)/destinations/page.tsx");
const publicClient = read("src/lib/api/publicClient.ts");
const pageContent = read("src/components/public/country/CountryDestinationPageContent.tsx");
const hero = read("src/components/public/country/CountryDestinationHero.tsx");
const editor = read("src/components/admin/cms/CountryDestinationInfoPanel.tsx");

check("destination page reads its CMS guide during server rendering", page.includes("fetchCountryDestinationInfoForServer(slug)"));
check("server guide fetch bypasses relative browser API routing", serverData.includes("API_PROXY_TARGET") && serverData.includes("cache: \"no-store\""));
check("missing destination guides return not found instead of demo content", serverData.includes("Promise<CountryDestinationInfo | null>") && serverData.includes("return null"));
check("destination directory is sourced from published guide records", listing.includes("fetchPublicDestinationGuides()") && publicClient.includes('publicApi.get("/destination-guides")'));
check("tour count never falls back to a fake count", pageContent.includes("tourCount={tourCount}") && hero.includes("tourCount = 0") && !pageContent.includes("|| 24"));
check("admin can save each selected country guide to its scoped CMS block", editor.includes("country_info_") && editor.includes("Destination Overview &amp; Narrative"));

console.log(`\nCountry destination CMS flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
