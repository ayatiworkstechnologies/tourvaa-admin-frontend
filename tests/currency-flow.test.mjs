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
const listing = read("src/components/public/CountryTourListing.tsx");
const detailExperience = read("src/components/public/TourDetailExperience.tsx");
const booking = read("src/app/(public)/booking/[id]/page.tsx");

check("USD is the conversion base", hook.includes('baseCode: "USD"') && hook.includes('/currency/rates'));
check("visitor country is used for automatic currency", hook.includes('/currency/context') && hook.includes("navigator.language"));
check("currency preference persists", hook.includes("localStorage.setItem") && hook.includes("tourvaa_display_currency"));
check("selection made while rates load is not discarded", hook.includes("savedAtStart") && hook.includes("latestSaved") && hook.includes("!state.rates[normalized] && !state.loading"));
check("currency changes synchronize across browser tabs", hook.includes('addEventListener("storage"') && hook.includes('removeEventListener("storage"'));
check("conversion uses source and target rates", hook.includes("value / sourceRate") && hook.includes("* targetRate"));
check("public header exposes the selector", publicHeader.includes("<LanguageCurrencySelector"));
check("portal header exposes the selector", portalHeader.includes("<CurrencySelector"));
check("tour listing converts from each tour currency", listing.includes("format(t.price_start_per_person, t.currency)"));
check("tour details convert price and add-ons", detailExperience.includes('format(totalAmount, tourCurrency)') && detailExperience.includes('format(perPersonPrice, tourCurrency)'));
check("booking review converts display amounts", booking.includes("const { code: displayCurrency, format, formatExact }") && booking.includes("format(Number(priceEstimate.final_amount), priceEstimate.currency)"));
check("confirmed booking amount is shown in its own settled currency, not the display currency", booking.includes("formatExact(Number(bookingResult.amount), bookingResult.currency)"));
check("checkout explains the price breakdown is a display conversion", booking.includes("`Shown in ${displayCurrency}`"));

console.log(`\nCurrency flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
