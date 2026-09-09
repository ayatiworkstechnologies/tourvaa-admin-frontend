/** Customer journey contract checks. No server required. */
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  ok ${label}`);
    passed++;
  } else {
    console.error(`  FAIL ${label}`);
    failed++;
  }
}

console.log("\n=== Customer Booking Flow ===\n");

const search = read("src/components/public/HeroFilterBar.tsx");
const homepage = read("src/app/(public)/page.tsx");
check("homepage destination filter uses the active country API list", homepage.includes("setSearchCountries(countryResult.value)") && homepage.includes("countries={searchCountries}") && search.includes("return countries.filter((c) => c.country_name.toLowerCase().includes(q))") && search.includes("filtered.map((country)"));
check("search preserves travel date", search.includes('params.set("travel_date"'));
check("search preserves adult count", search.includes('params.set("adults"'));
check("search preserves child count", search.includes('params.set("children"'));

const detail = read("src/app/(public)/tours/[id]/page.tsx");
check("tour links preserve booking query", detail.includes("bookingQuery"));
check("login return path preserves booking context", detail.includes("encodeURIComponent(returnPath)"));
check("tour CTA opens dedicated public booking flow", detail.includes('`/booking/${tour.id}'));
const detailExperience = read("src/components/public/TourDetailExperience.tsx");
check("tour detail booking CTA has no cart actions", !detailExperience.includes("addToCart") && !detailExperience.includes("ShoppingCart"));

// The booking form was moved off the tour detail page into a dedicated
// checkout-session flow at /booking/[id] (see HeroFilterBar/customer-flow
// architecture notes) - these checks target that page, not the tour detail
// page. The flow is a plain-state 4-step wizard (Passengers & Accommodation
// -> Passenger Details -> Payment -> Confirmation) backed by a real
// server-side CheckoutSession, not a client-only react-hook-form wizard.
const publicBooking = read("src/app/(public)/booking/[id]/page.tsx");
check("public booking has four visible stages", publicBooking.includes("Passengers &amp; Accommodation") && publicBooking.includes("Passenger Details") && publicBooking.includes(">Payment<") && publicBooking.includes("Booking Received"));
check("public booking is backed by a real checkout session", publicBooking.includes('.post("/checkout/start"') && publicBooking.includes("sessionKey"));
check("public booking confirms through the checkout-session endpoint", publicBooking.includes("/checkout/session/${sessionKey}/confirm"));
check("public booking requires a logged-in customer", publicBooking.includes('roleSlug === "customer"') && publicBooking.includes("router.replace(`/login?redirect="));
check("public booking uses live server-calculated pricing", publicBooking.includes('"/bookings/calculate-price"') && publicBooking.includes("priceEstimate"));
check("booking continues to the payment step", publicBooking.includes("setStep(3)"));
check("success copy explains pending payment confirmation", publicBooking.includes("pending payment confirmation"));
check("traveller fields follow selected adult and child counts", publicBooking.includes("adultCount + childCount") && publicBooking.includes('i < adultCount ? "adult" : "child"'));
check("every traveller submits a normalized age", publicBooking.includes("age: calcAge(p.birthDay, p.birthMonth, p.birthYear)"));
check("adult and child ages are validated", publicBooking.includes("age < 12 || age > 120") && publicBooking.includes("age < 3 || age > 11"));
check("optional activities selection feeds price and checkout data", publicBooking.includes("optionalActivitiesPayload") && publicBooking.includes("optional_activities: optionalActivitiesPayload"));

const customerBooking = read("src/app/customer/bookings/[id]/page.tsx");
check("new booking opens payment UI", customerBooking.includes('searchParams.get("pay") === "1"'));
check("payment copy remains pending supplier acceptance", customerBooking.includes("Final confirmation is pending supplier acceptance"));
check("pending supplier banner is rendered", customerBooking.includes("Pending supplier acceptance"));
check("gateway charges the selected payment amount", customerBooking.includes("amount: paymentAmount"));
check("gateway modal offers deposit and full balance", customerBooking.includes("Pay ${depositConfig.deposit_percentage}% deposit") && customerBooking.includes("Pay in full"));
check("partial payment uses the backend-configured deposit percentage", customerBooking.includes("totalAmount * (depositConfig.deposit_percentage / 100)"));
check("dashboard payment actions open checkout directly", customerBooking.includes('searchParams.get("action") === "pay"'));

const customerDashboard = read("src/app/customer/dashboard/page.tsx");
check("dashboard exposes the main traveller quick actions", ["Book a Tour", "Make a Payment", "Add Traveller", "View Invoices", "Contact Support"].every((label) => customerDashboard.includes(label)));
check("dashboard links pending balances to checkout", customerDashboard.includes("?action=pay"));
check("dashboard referral action uses native share with clipboard fallback", customerDashboard.includes("navigator.share") && customerDashboard.includes("navigator.clipboard.writeText"));

const customerBookings = read("src/app/customer/bookings/page.tsx");
check("dashboard request links apply the bookings tab filter", customerBookings.includes('new URLSearchParams(window.location.search).get("tab")'));

const publicHeader = read("src/components/public/PublicHeader.tsx");
const customerHeader = read("src/components/customer/CustomerPortalHeader.tsx");
const customerLayout = read("src/app/customer/layout.tsx");
const wishlist = read("src/app/customer/wishlist/page.tsx");
const wishlistStore = read("src/providers/TravelStoreProvider.tsx");
const legacyWishlist = read("src/app/(public)/wishlist/page.tsx");
const retiredCart = read("src/app/(public)/cart/page.tsx");
check("public and customer headers no longer expose cart", !publicHeader.includes('href="/cart"') && !customerHeader.includes('href="/cart"'));
check("customer footer receives public settings context", customerLayout.includes("<PublicSettingsProvider>") && customerLayout.includes("<PublicFooter />"));
check("wishlist books tours directly", wishlist.includes("href: w.href || `/booking/${w.id}`") && !wishlist.includes("addToCart"));
// The public nav links to the public /wishlist page (works for guests too);
// the customer-portal header/sidebar link to /customer/wishlist for signed-in
// customers browsing inside their portal - both render the same store.
check("public header links to the public wishlist page", publicHeader.includes('href="/wishlist"'));
check("customer portal header links to the portal wishlist page", customerHeader.includes('href="/customer/wishlist"'));
check("wishlist is loaded from the authenticated user API when logged in", wishlistStore.includes('api.get<WishlistResponse>("/wishlist")'));
check("wishlist mutations persist to the user API when logged in", wishlistStore.includes('api.post(`/wishlist/${item.id}`)') && wishlistStore.includes('api.delete(`/wishlist/${item.id}`)'));
// Guests (not logged in, or not a customer) get a local-only wishlist instead
// of being blocked - it's merged into the account on login.
check("wishlist falls back to local storage for guests", wishlistStore.includes("WISHLIST_STORAGE_KEY") && wishlistStore.includes("readLocalWishlist") && wishlistStore.includes("writeLocalWishlist"));
check("compare list still uses local storage (by design, unlike wishlist for logged-in users)", wishlistStore.includes("COMPARE_STORAGE_KEY") && wishlistStore.includes("window.localStorage"));
check("public wishlist page renders the store directly instead of redirecting", legacyWishlist.includes("useTravelStore") && !legacyWishlist.includes("redirect("));
check("retired cart route permanently redirects to tours", retiredCart.includes('permanentRedirect("/tours")'));

const login = read("src/app/(public)/login/page.tsx");
const register = read("src/app/(public)/register/page.tsx");
check(
  "login honors safe shared booking redirects",
  login.includes("isSharedBooking") && login.includes("redirectForRole(roleSlug, safeRedirect)"),
);
check("registration preserves login redirect", register.includes("encodeURIComponent(redirect)"));

console.log(`\nCustomer flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
