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
const homepageHero = read("src/components/public/home/HeroSection.tsx");
check("homepage destination filter uses the active country API list", homepageHero.includes("fetchPublicCountries()") && homepageHero.includes("setSearchCountries(data)") && homepageHero.includes("countries={searchCountries}") && search.includes("return countries.filter((c) => c.country_name.toLowerCase().includes(q))") && search.includes("filtered.map((country, index)"));
check("homepage destination filter lists every country, ones with tours first", search.includes("[...countries].sort((a, b) => (b.tour_count ?? 0) - (a.tour_count ?? 0)") && search.includes("More countries"));
check("search preserves travel date", search.includes('params.set("travel_date"'));
check("search preserves adult count", search.includes('params.set("adults"'));
check("search preserves child count", search.includes('params.set("children"'));

const detail = read("src/app/(public)/tours/[id]/page.tsx");
check("tour links preserve booking query", detail.includes("bookingQuery"));
check("login return path preserves booking context", detail.includes("encodeURIComponent(returnPath)"));
check("tour CTA opens dedicated public booking flow", detail.includes('`/booking/${tour.id}'));
check(
  "open public tours refresh approved availability without a manual reload",
  detail.includes("PUBLIC_TOUR_REFRESH_INTERVAL_MS") &&
    detail.includes('document.addEventListener("visibilitychange", refreshTour)') &&
    detail.includes("window.setInterval(refreshTour, PUBLIC_TOUR_REFRESH_INTERVAL_MS)"),
);
const detailExperience = read("src/components/public/TourDetailExperience.tsx");
check(
  "public itinerary opens in overview mode by default",
  detailExperience.includes('useState<"detailed" | "overview">(') && detailExperience.includes('"overview",'),
);
check("tour detail booking CTA has no cart actions", !detailExperience.includes("addToCart") && !detailExperience.includes("ShoppingCart"));
check(
  "tour detail keeps a sticky booking summary with live name price and actions",
  detailExperience.includes('aria-label="Tour booking summary"') &&
    detailExperience.includes("fixed inset-x-0 bottom-0") &&
    detailExperience.includes("{title}") &&
    detailExperience.includes("format(totalAmount, pricingCurrency)") &&
    detailExperience.includes("hasBookingDate") &&
    detailExperience.includes('handleBookNow("full")') &&
    detailExperience.includes('"Book now"') &&
    detailExperience.includes('"Check dates"'),
);
check(
  "tour detail limits each booking by both remaining seats and maximum group size",
  detailExperience.includes("Math.min(") &&
    detailExperience.includes("selectedDeparture?.slotsRemaining ?? MAX_TRAVELLERS_CEILING") &&
    detailExperience.includes("tour.max_group_size || MAX_TRAVELLERS_CEILING"),
);
check(
  "tour detail never presents sold-out or unavailable departures as bookable",
  detailExperience.includes("const isBookableStatus") &&
    detailExperience.includes("(slots == null || slots > 0)") &&
    detailExperience.includes("function seatsLeftLabel") &&
    detailExperience.includes('slots === 1 ? "seat" : "seats"') &&
    detailExperience.includes('} left`') &&
    detailExperience.includes(': "Sold out"'),
);
check(
  "tour style keeps vehicle capacity separate from live seats remaining",
  detailExperience.includes("tour.overview?.vehicle_style?.trim()") &&
    detailExperience.includes("Maximum ${tour.max_group_size} guests per booking") &&
    detailExperience.includes("Max {tour.max_group_size} guests per booking") &&
    !detailExperience.includes("Max {maxTravellers} guests") &&
    !detailExperience.includes("capacity <= 6"),
);
check(
  "tour detail hides unreachable price tiers and caps the final visible tier at the group limit",
  detailExperience.includes(".filter((row) => !maxGroupSize || row.persons_from <= maxGroupSize)") &&
    detailExperience.includes("return { ...row, persons_to: maxGroupSize };"),
);
const pricingEditor = read("src/components/tours/TourPricingTab.tsx");
check(
  "tour pricing editor previews public Group Rate Highlights from active slabs",
  pricingEditor.includes("Group Rate Highlights Preview") &&
    pricingEditor.includes('slab.status === "active"') &&
    pricingEditor.includes("slab.passenger_from <= maxGroupSize") &&
    pricingEditor.includes("maxGroupSize ? Math.min(slab.passenger_to, maxGroupSize)"),
);
const portalAuthPage = read("src/components/public/portal/PortalAuthPage.tsx");
check(
  "portal login commits cookies before a clean dashboard navigation",
  portalAuthPage.includes("window.location.assign(redirectTarget())") &&
    !portalAuthPage.includes("await loginWithToken();") &&
    portalAuthPage.includes('await api.post("/auth/logout").catch(() => {})'),
);
const pricingTab = read("src/components/tours/TourPricingTab.tsx");
check(
  "markup screen shows the final net profit without a repeated breakdown",
  pricingTab.includes("function markupFinancials") &&
    pricingTab.includes("Net profit = final customer price minus supplier price") &&
    pricingTab.includes("Tourvaa Profit") &&
    !pricingTab.includes("% margin") &&
    !pricingTab.includes("Less offer"),
);
const customerBookingDetail = read("src/app/customer/bookings/[id]/page.tsx");
check(
  "unpaid customer bookings show payment required and can be removed",
  customerBookingDetail.includes("Payment Required: Your booking has not yet been confirmed") &&
    customerBookingDetail.includes("Remove from Bookings") &&
    customerBookingDetail.includes("/remove-unpaid") &&
    customerBookingDetail.includes("amountPaid > 0"),
);
check(
  "cancelled gateway checkout releases its pending amount for a retry",
  customerBookingDetail.includes('"/payments/abandon-pending"') &&
    customerBookingDetail.includes("stripe_pid_${bookingId}") &&
    customerBookingDetail.includes("<StripeBadge"),
);
check(
  "customer payment dialog exposes only real payment gateways",
  !customerBookingDetail.includes("/payments/test/simulate") &&
    !customerBookingDetail.includes("Test mode active - no real money will be charged."),
);
check(
  "tour detail uses one combined special-offer badge and an authoritative quote summary",
  detailExperience.includes("Offers Applied – {todaysSpecialOfferLabel}") &&
    detailExperience.includes("const advertisedOfferPercent = supplierDiscountPercent + tourvaaDiscountPercent;") &&
    detailExperience.includes("supplier_offer_discount_amount") &&
    detailExperience.includes("Customer price after discounts") &&
    detailExperience.includes("You save") &&
    !detailExperience.includes("Group discount"),
);
check(
  "date and month navigation does not change the selected departure",
  !detailExperience.includes("if (firstDate) setSelectedDateId(firstDate.id);") &&
    detailExperience.includes("const allDates = monthGroups.flatMap") &&
    detailExperience.includes("appliedInitialTravelDateRef.current === targetIso"),
);

// The booking form was moved off the tour detail page into a dedicated
// checkout-session flow at /booking/[id] (see HeroFilterBar/customer-flow
// architecture notes) - these checks target that page, not the tour detail
// page. The flow is a plain-state 4-step wizard (Passengers & Accommodation
// -> Passenger Details -> Payment -> Confirmation) backed by a real
// server-side CheckoutSession, not a client-only react-hook-form wizard.
const publicBooking = read("src/app/(public)/booking/[id]/page.tsx");
check(
  "checkout limits travellers by both the selected departure and maximum group size",
  publicBooking.includes("Math.min(selectedCalendar?.slots ?? 10, tour.max_group_size ?? 10)"),
);
check(
  "checkout excludes departures inside the tour minimum booking window",
  publicBooking.includes("tour?.min_advance_booking_days") &&
    publicBooking.includes("normalizeDateStringToIso(calendar.date) >= earliestDate"),
);
check("public booking has four visible stages", publicBooking.includes("Passengers &amp; Accommodation") && publicBooking.includes("Passenger Details") && publicBooking.includes(">Payment<") && publicBooking.includes("Booking Received"));
check("public booking is backed by a real checkout session", publicBooking.includes('.post("/checkout/start"') && publicBooking.includes("sessionKey"));
check("public booking confirms through the checkout-session endpoint", publicBooking.includes("/checkout/session/${sessionKey}/confirm"));
check("public booking requires a logged-in customer", publicBooking.includes('roleSlug === "customer"') && publicBooking.includes("router.replace(`/login?redirect="));
check("public booking uses live server-calculated pricing", publicBooking.includes('"/bookings/calculate-price"') && publicBooking.includes("priceEstimate"));
check("customer deposit rounds cents upward consistently with gateway validation", publicBooking.includes("Number.EPSILON") && publicBooking.includes("const cents = Math.round"));
check("selected deposit never falls back to the full outstanding balance", publicBooking.includes("selected_payment_amount") && publicBooking.includes('customerPaymentMethod === "deposit" && !selectedPaymentAmount'));
check("booking continues to the payment step", publicBooking.includes("setStep(3)"));
check("checkout terms open separately without losing entered passenger details", publicBooking.includes('href="/terms" target="_blank" rel="noopener noreferrer"'));
check("success copy explains pending payment confirmation", publicBooking.includes("pending payment confirmation"));
check("traveller fields follow selected adult and child counts", publicBooking.includes("adultCount + childCount") && publicBooking.includes('i < adultCount ? "adult" : "child"'));
// Traveller ages are collected directly as a numeric field, validated, then
// submitted as a Number. The earlier birthDay/birthMonth/birthYear + calcAge()
// derivation has been replaced by the direct age input.
check(
  "every traveller submits a numeric age",
  publicBooking.includes("age: Number(p.age)"),
);
check("adult and child ages are validated", publicBooking.includes("age < 12 || age > 120") && publicBooking.includes("age < 3 || age > 11"));
check("optional activities selection feeds price and checkout data", publicBooking.includes("optionalActivitiesPayload") && publicBooking.includes("optional_activities: optionalActivitiesPayload"));

const customerBooking = read("src/app/customer/bookings/[id]/page.tsx");
check("new booking opens payment UI", customerBooking.includes('searchParams.get("pay") === "1"'));
check(
  "customer request states use customer-safe booking language",
  customerBooking.includes("isBookingRequestReceived") &&
    customerBooking.includes("Booking Request Received") &&
    !customerBooking.includes("Pending supplier acceptance"),
);
check(
  "customer status lifecycle is explicit",
  customerBooking.includes('return "Booking Request Received"') &&
    ["Booking Confirmed", "Ongoing", "Completed", "Cancellation Requested", "Cancelled"].every((status) => customerBooking.includes(status)),
);
check(
  "cancellation requires free-period eligibility and explicit confirmation",
  ["is_free_cancellation_eligible", "Confirm cancellation request", "Yes, continue", "free cancellation period has finished"].every((text) => customerBooking.includes(text)),
);
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
const portalPublicFooter = read("src/components/public/portal/PortalPublicFooter.tsx");
const wishlist = read("src/app/customer/wishlist/page.tsx");
const wishlistStore = read("src/providers/TravelStoreProvider.tsx");
const legacyWishlist = read("src/app/(public)/wishlist/page.tsx");
const retiredCart = read("src/app/(public)/cart/page.tsx");
check("public and customer headers no longer expose cart", !publicHeader.includes('href="/cart"') && !customerHeader.includes('href="/cart"'));
// The customer portal renders its own sidebar + header chrome, so it deliberately
// does NOT include the marketing <PublicFooter />. It must still be wrapped in
// PublicSettingsProvider so support/settings-driven UI keeps working.
check(
  "customer portal gets public settings context without the marketing footer",
  customerLayout.includes("<PublicSettingsProvider>") &&
    !customerLayout.includes("<PublicFooter />") &&
    portalPublicFooter.includes("<PublicFooter />"),
);
check("wishlist books tours directly", wishlist.includes("href: w.href || `/booking/${w.id}`") && !wishlist.includes("addToCart"));
// The public nav links to the public /wishlist page (works for guests too);
// the customer-portal header/sidebar link to /customer/wishlist for signed-in
// customers browsing inside their portal - both render the same store.
check("public header links to the public wishlist page", publicHeader.includes('href="/wishlist"'));
check("customer portal header links to the portal wishlist page", customerHeader.includes('"/customer/wishlist"'));
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
