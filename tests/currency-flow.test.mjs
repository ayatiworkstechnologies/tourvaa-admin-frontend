/** Site-wide display-currency and immutable checkout-currency contract checks. */
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

console.log("\n=== Currency Flow ===\n");
const hook = read("src/hooks/useCurrency.ts");
const publicHeader = read("src/components/public/PublicHeader.tsx");
const portalHeader = read("src/components/layout/Header.tsx");
const tours = read("src/app/(public)/tours/page.tsx");
const detail = read("src/app/(public)/tours/[id]/page.tsx");
const booking = read("src/app/(public)/booking/[id]/page.tsx");

check("USD is the conversion base", hook.includes('baseCode: "USD"') && hook.includes('/currency/rates'));
check("visitor country is used for automatic currency", hook.includes('/currency/context') && hook.includes("navigator.language"));
check("currency preference persists", hook.includes("localStorage.setItem") && hook.includes("tourvaa_display_currency"));
check("conversion uses source and target rates", hook.includes("value / sourceRate") && hook.includes("* targetRate"));
check("public header exposes the selector", publicHeader.includes("<CurrencySelector"));
check("portal header exposes the selector", portalHeader.includes("<CurrencySelector"));
check("tour listing converts from each tour currency", tours.includes("formatCompact(tour.price_start_per_person, tour.currency"));
check("tour details convert price and add-ons", detail.includes("displayMoney(tour.price_start_per_person") && detail.includes("displayMoney(a.price"));
check("booking review converts display amounts", booking.includes("const { format: money") && booking.includes("money(pricing.total, currency)"));
check("gateway still receives immutable booking currency", booking.includes("currency: booking.currency"));
check("checkout explains indicative conversion", booking.includes("displayed conversion is indicative"));

console.log(`\nCurrency flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);

