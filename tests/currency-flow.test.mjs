/** Site-wide display-currency and rate-locked checkout-currency contract checks. */
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
const currencyUtils = read("src/lib/utils/currency.ts");
const publicHeader = read("src/components/public/PublicHeader.tsx");
const publicSelector = read("src/components/public/LanguageCurrencySelector.tsx");
const portalHeader = read("src/components/layout/Header.tsx");
const publicPortalHeader = read("src/components/public/portal/PortalPublicHeader.tsx");
const affiliateDashboard = read("src/app/affiliate/dashboard/page.tsx");
const affiliateConversions = read("src/app/affiliate/conversions/page.tsx");
const affiliateCommissions = read("src/app/affiliate/commissions/page.tsx");
const customerTable = read("src/components/customers/CustomerTable.tsx");
const agentDetail = read("src/app/admin/agents/[id]/page.tsx");
const bookingTable = read("src/components/bookings/BookingTable.tsx");
const cancellations = read("src/app/customer/cancellations/page.tsx");
const adminDiscounts = read("src/app/admin/discounts/page.tsx");
const listing = read("src/components/public/CountryTourListing.tsx");
check("country-search tour cards display active discount badges on images", listing.includes("DiscountCardBadge") && listing.includes("hasActiveDiscount({"));
const detailExperience = read("src/components/public/TourDetailExperience.tsx");
const booking = read("src/app/(public)/booking/[id]/page.tsx");

check("USD is the conversion base", hook.includes('baseCode: "USD"') && hook.includes('/currency/rates'));
check("visitor country is used for automatic currency", hook.includes('/currency/context') && hook.includes("navigator.language"));
check("country source preserves IP detection and manual overrides", hook.includes("countrySource") && hook.includes('countrySource: "manual"') && hook.includes('detectedCountrySource = "locale"'));
check("currency preference persists", hook.includes("localStorage.setItem") && hook.includes("tourvaa_display_currency"));
check("shared money formatting uses selected-currency symbols", (currencyUtils.match(/currencyDisplay: "narrowSymbol"/g) || []).length >= 2 && !currencyUtils.includes('currencyDisplay: "code"'));
check("shared money formatting distinguishes dollar currencies", ["USD: \"US$\"", "NZD: \"NZ$\"", "SGD: \"S$\"", "AUD: \"A$\"", "CAD: \"C$\"", "HKD: \"HK$\""].every((symbol) => currencyUtils.includes(symbol)));
check("selection made while rates load is not discarded", hook.includes("savedAtStart") && hook.includes("latestSaved") && hook.includes("!state.rates[normalized] && !state.loading"));
check("currency changes synchronize across browser tabs", hook.includes('addEventListener("storage"') && hook.includes('removeEventListener("storage"'));
check("conversion uses source and target rates", hook.includes("value / sourceRate") && hook.includes("* targetRate"));
check("public header exposes the selector", publicHeader.includes("<LanguageCurrencySelector"));
check("public header connects country selection to the saved currency context", publicHeader.includes("<LanguageCurrencySelector showCountry") && publicSelector.includes("fetchPublicCountries") && publicSelector.includes("setCountry(country.country_code, country.currency_code)"));
check(
  "public-header mobile location menu is viewport anchored and stays within screen gutters",
  publicHeader.includes("mobileViewportMenu") &&
    publicSelector.includes('mobileViewportMenu ? "static sm:relative" : "relative"') &&
    publicSelector.includes("max-sm:inset-x-2 max-sm:top-full max-sm:w-auto max-sm:max-w-none"),
);
check("public country selector updates the local currency without changing the current page", publicSelector.includes("setCountry(country.country_code, country.currency_code)") && !publicSelector.includes("router.push(") && !publicSelector.includes("destinationUrl"));
check("public location selector presents one searchable country and currency list", publicSelector.includes('placeholder={showCountry ? "Search country or currency..."') && publicSelector.includes('setCountry(country.country_code, country.currency_code)') && !publicSelector.includes('activeTab === "country"') && !publicSelector.includes('role="tablist"'));
check("public location selector omits detection copy and tab controls", !publicSelector.includes("Auto-detected from your IP address.") && !publicSelector.includes("Enabled countries control the available currencies.") && !publicSelector.includes('>Country</button>') && !publicSelector.includes('>Currency</button>'));
check("public header currency list only exposes currencies for enabled countries plus USD", publicSelector.includes('new Set(["USD", ...countries.map') && publicSelector.includes("enabledCurrencyCodes.has(currency.code.toUpperCase())"));
check("portal header exposes the selector", portalHeader.includes("<CurrencySelector"));
check("public partner portal header uses the shared dynamic currency selector", publicPortalHeader.includes("<LanguageCurrencySelector") && !publicPortalHeader.includes(">\n              USD\n            <"));
check("affiliate dashboard converts commissions from their source currency", affiliateDashboard.includes('format(c.commission_amount, c.currency || "USD")') && affiliateDashboard.includes('formatCompact(summary.total_commission, summary.currency || "USD")'));
check("affiliate conversion totals and rows follow the selected display currency", affiliateConversions.includes("convert(conversion.commission_amount, conversion.currency || \"USD\")") && affiliateConversions.includes('format(c.booking_amount, c.currency || "USD")') && affiliateConversions.includes("shown in ${displayCurrency}"));
check("affiliate commission summary follows the selected display currency", affiliateCommissions.includes('format(value, summary.currency || "USD")'));
check("admin customer payment summaries follow the selected display currency", customerTable.includes("const { format: money } = useCurrency()") && !customerTable.includes("formatExact: money"));
check(
  "admin agent detail converts source-currency amounts and protects mixed-currency aggregates",
  agentDetail.includes("const { code: displayCurrency, format: moneyText } = useCurrency()")
    && agentDetail.includes("currency={displayCurrency}")
    && agentDetail.includes("summaryMoney(summary?.amount_paid)")
    && agentDetail.includes("moneyText(b.final_amount, b.currency)")
    && agentDetail.includes("has_mixed_currencies")
    && agentDetail.includes('"Multiple currencies"'),
);
check("admin booking list, customer refunds, and discount usage use the selected display currency", bookingTable.includes("const { format: money } = useCurrency()") && !bookingTable.includes("toLocaleString()") && cancellations.includes("const { format: money } = useCurrency()") && adminDiscounts.includes("const { format: money } = useCurrency()"));
check("tour listing converts from each tour currency", listing.includes("format(t.price_start_per_person, t.currency)"));
check("tour listing budget labels follow the active display currency while API ranges keep their source currency", listing.includes("const displayBudgetOptions = useMemo") && listing.includes("format(option.max, sourceCurrency)") && listing.includes("displayBudgetOptions.map"));
check("tour details convert price and add-ons", detailExperience.includes('format(totalAmount, pricingCurrency)') && detailExperience.includes('format(displayedPerPersonPrice, pricingCurrency)'));
check("booking review converts display amounts", booking.includes("const { code: displayCurrency, format, formatExact }") && booking.includes("format(Number(priceEstimate.final_amount), priceEstimate.currency)"));
check("customer and agent checkout both send the selected currency for server-side rate locking", (booking.match(/display_currency: displayCurrency/g) || []).length >= 2);
check("checkout explains that the selected gateway currency and rate are locked", booking.includes("Your payment gateway will charge you in") && booking.includes("{displayCurrency}") && booking.includes("exchange rate are locked"));
check("confirmed booking amount is shown in its own settled currency, not the display currency", booking.includes("formatExact(Number(bookingResult.amount), bookingResult.currency)"));
check("checkout explains the price breakdown is a display conversion", booking.includes("`Shown in ${displayCurrency}`"));

console.log(`\nCurrency flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
