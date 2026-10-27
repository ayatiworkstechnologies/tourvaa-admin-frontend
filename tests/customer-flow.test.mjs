/** Customer journey contract checks. No server required. */
import { existsSync, readFileSync } from "fs";
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
const portalAuth = read("src/components/public/portal/PortalAuthPage.tsx");
const customerRegister = read("src/app/(public)/register/page.tsx");
const customerProfile = read("src/app/customer/profile/page.tsx");
check("customer profile uses a balanced Country and Gender row instead of an editable nationality field", customerProfile.includes("{/* Country & gender */}") && customerProfile.includes("Select country") && !customerProfile.includes("Select nationality") && !customerProfile.includes("setNationality"));
check("customer profile keeps country and airline as visibly unselected placeholders until chosen", customerProfile.includes('country ? "text-slate-800" : "text-slate-400"') && customerProfile.includes('<option value="" disabled>Select preferred airline</option>') && customerProfile.includes('preferredAirline ? "text-slate-800" : "text-slate-400"'));
const cookieConsent = read("src/components/public/CookieConsentBanner.tsx");
check(
  "supplier, agent, affiliate, and customer registration policy links open safely in a new tab",
  (portalAuth.match(/target="_blank" rel="noopener noreferrer"/g) ?? []).length >= 2 &&
    (customerRegister.match(/target="_blank" rel="noopener noreferrer"/g) ?? []).length >= 2,
);
check(
  "cookie policy links open safely in a new tab and visitors can choose each optional category",
  (cookieConsent.match(/target="_blank"/g) ?? []).length >= 2 &&
    cookieConsent.includes('aria-checked={prefs.analytics}') &&
    cookieConsent.includes('aria-checked={prefs.preferences}') &&
    cookieConsent.includes('aria-checked={prefs.marketing}') &&
    cookieConsent.includes("Save Choices"),
);
check(
  "public tour details do not add stock gallery media or repeat guide and pace in Travel Essentials",
  detailExperience.includes("const mosaicItems = galleryItems") &&
    !detailExperience.includes("fallbackPool") &&
    !detailExperience.includes("(tour.tour_language || tour.overview?.tour_type) && (") &&
    !detailExperience.includes("{tour.overview?.tour_pace && ("),
);
check(
  "tour overview starts compact and can reveal its full content",
  detailExperience.includes("overviewCanCollapse") &&
    detailExperience.includes("[-webkit-line-clamp:4]") &&
    detailExperience.includes('"Read full overview"') &&
    detailExperience.includes("aria-expanded={overviewExpanded}"),
);
check(
  "opening an itinerary day scrolls its header below fixed navigation",
  detailExperience.includes("itineraryDayRefs") &&
    detailExperience.includes("scrollIntoView({") &&
    detailExperience.includes('behavior: "smooth"') &&
    detailExperience.includes("scroll-mt-44"),
);
check("itinerary behaves as a single-open accordion", detailExperience.includes("prev[dayKey] ? {} : { [dayKey]: true }") && !detailExperience.includes('"Expand All"'));
check(
  "public itinerary has one overview presentation without a detailed-view switch",
  !detailExperience.includes("setItineraryMode") &&
    !detailExperience.includes("Full Day Details") &&
    detailExperience.includes("const overviewText = day.summary || day.detail"),
);
check(
  "public itinerary renders every supplier-entered day detail inside the existing accordion",
  detailExperience.includes("hasDistinctDetail") &&
    detailExperience.includes("Meals included") &&
    detailExperience.includes("Accommodation") &&
    detailExperience.includes("Optional activities") &&
    detailExperience.includes("Important notes") &&
    detailExperience.includes("day.travelTime"),
);
check(
  "public tour itinerary previews supplier-authored itinerary days without a download action",
  detailExperience.includes("/brochure?inline=1") &&
    detailExperience.includes("/itinerary") &&
    detailExperience.includes("Open itinerary") &&
    detailExperience.includes("ItineraryPdfPreview") &&
    detailExperience.includes('title="Itinerary PDF preview"') &&
    detailExperience.includes("fallbackUrl") &&
    detailExperience.includes("Loading itinerary PDF") &&
    !detailExperience.includes("Download PDF") &&
    !detailExperience.includes("download the trip notes"),
);
check(
  "itinerary image clicks open only that day's carousel images",
  detailExperience.includes("const [lightboxPhotos, setLightboxPhotos]") &&
    detailExperience.includes("photos: { url: string; title?: string; caption?: string }[] = mosaicItems") &&
    detailExperience.includes("day.photos.map((url)") &&
    detailExperience.includes("photos={lightboxPhotos}"),
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
  "sticky booking summary presents the selected date, traveller count, and total with an elevated action card",
  detailExperience.includes("Date selected") &&
    detailExperience.includes("shadow-[0_14px_45px") &&
    detailExperience.includes("from-pub-accent to-[#ef6a28]"),
);
check(
  "tour detail limits each booking by remaining departure seats",
  detailExperience.includes("selectedDeparture?.slotsRemaining ?? MAX_TRAVELLERS_CEILING") &&
    !detailExperience.includes("tour.max_group_size || MAX_TRAVELLERS_CEILING"),
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
    detailExperience.includes("Min ${minimumTravellers} – up to ${tour.max_group_size} per vehicle") &&
    detailExperience.includes("seats available") &&
    !detailExperience.includes("Max {maxTravellers} guests") &&
    !detailExperience.includes("capacity <= 6"),
);
check(
  "tour detail never requests a quote below the configured minimum party size",
  detailExperience.includes("const minimumTravellers = Math.max(") &&
    detailExperience.includes("Number(tour.min_booking_size || 1)") &&
    detailExperience.includes("Number(pricingRows[0]?.persons_from || 1)") &&
    detailExperience.includes("adults + children < minimumTravellers") &&
    detailExperience.includes("const meetsMinimumParty = travellerCount >= minimumTravellers"),
);
check(
  "tour detail keeps price tiers available above the vehicle group size",
  !detailExperience.includes(".filter((row) => !maxGroupSize || row.persons_from <= maxGroupSize)") &&
    !detailExperience.includes("return { ...row, persons_to: maxGroupSize };"),
);
const pricingEditor = read("src/components/tours/TourPricingTab.tsx");
check(
  "tour pricing editor keeps public Group Rate Highlights out of admin and supplier forms",
  !pricingEditor.includes("Group Rate Highlights Preview") &&
    !pricingEditor.includes("Generated dynamically on the public booking panel") &&
    !pricingEditor.includes("maxGroupSize"),
);
const portalAuthPage = read("src/components/public/portal/PortalAuthPage.tsx");
check(
  "portal login commits cookies before a clean dashboard navigation",
  portalAuthPage.includes("window.location.assign(redirectTarget(roleSlug))") &&
    !portalAuthPage.includes("await loginWithToken();") &&
    portalAuthPage.includes('await api.post("/auth/logout").catch(() => {})'),
);
const pricingTab = read("src/components/tours/TourPricingTab.tsx");
check(
  "markup screen includes supplier commission in the staged profit calculation",
  pricingTab.includes("function markupFinancials") &&
    pricingTab.includes("supplierCommissionPercent") &&
    pricingTab.includes("supplierPriceToTourvaa") &&
    pricingTab.includes("supplierPayout") &&
    pricingTab.includes("commissionAmount") &&
    pricingTab.includes("grossProfit") &&
    pricingTab.includes("900 -> 810 -> 729") &&
    pricingTab.includes("Tourvaa Profit") &&
    pricingTab.includes("Profit includes markup and supplier commission"),
);
const customerBookingDetail = read("src/app/customer/bookings/[id]/page.tsx");
check("customer booking itinerary download is a primary full-width action", customerBookingDetail.includes('bg-dash-brand px-3 py-2.5 text-xs font-bold text-white') && customerBookingDetail.includes("Download Itinerary"));
const paymentLogos = read("src/components/common/PaymentLogos.tsx");
check(
  "checkout payment brands use local SVG assets rather than hand-drawn logos",
  ["paypal-wordmark.svg", "visa.svg", "mastercard.svg", "american-express.svg"].every((asset) =>
    existsSync(resolve(root, "public/brands/payments", asset)),
  ) &&
    paymentLogos.includes('src="/brands/stripe-wordmark-blurple.svg"') &&
    paymentLogos.includes('src="/brands/payments/paypal-wordmark.svg"') &&
    paymentLogos.includes('src="/brands/payments/visa.svg"') &&
    paymentLogos.includes('src="/brands/payments/mastercard.svg"') &&
    paymentLogos.includes('src="/brands/payments/american-express.svg"') &&
    paymentLogos.includes("export function CardNetworkBadges") &&
    !paymentLogos.includes("<svg"),
);
check(
  "Stripe checkout surfaces the local card-network badges for customer and agent payments",
  customerBookingDetail.includes("CardNetworkBadges") &&
    read("src/components/bookings/BookingPaymentModal.tsx").includes("CardNetworkBadges"),
);
check(
  "customer booking detail shows real payment and transaction references",
  customerBookingDetail.includes('label="Payment ID"') &&
    customerBookingDetail.includes('label="Transaction ID"') &&
    customerBookingDetail.includes("payment.transaction_id || payment.gateway_payment_id"),
);
check(
  "unpaid customer bookings show payment required and can be removed",
  customerBookingDetail.includes("BOOKING_PAYMENT_REQUIRED_MESSAGE") &&
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
  "customer balance payment sends its derived payment type to both gateways",
  customerBookingDetail.includes("payment_type: paymentType") &&
    customerBookingDetail.includes('"/payments/stripe/create-session"') &&
    customerBookingDetail.includes('"/payments/paypal/create-order"'),
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
  "checkout limits travellers by the selected departure seats",
  publicBooking.includes("selectedCalendar?.slots ?? tour?.max_group_size ?? 10") &&
    !publicBooking.includes("Math.min(selectedCalendar?.slots ?? 10, tour.max_group_size ?? 10)"),
);
check(
  "checkout excludes departures inside the tour minimum booking window",
  publicBooking.includes("tour?.min_advance_booking_days") &&
    publicBooking.includes("normalizeDateStringToIso(calendar.date) >= earliestDate"),
);
check("public booking has four visible stages", publicBooking.includes("Passengers &amp; Accommodation") && publicBooking.includes("Passenger Details") && publicBooking.includes(">Payment<") && publicBooking.includes("Payment Received"));
check("public booking is backed by a real checkout session", publicBooking.includes('.post("/checkout/start"') && publicBooking.includes("sessionKey"));
check("public booking confirms through the checkout-session endpoint", publicBooking.includes("/checkout/session/${sessionKey}/confirm"));
check("public booking requires a logged-in customer", publicBooking.includes('roleSlug === "customer"') && publicBooking.includes("router.replace(`/login?redirect="));
check("public booking uses live server-calculated pricing", publicBooking.includes('"/bookings/calculate-price"') && publicBooking.includes("priceEstimate"));
check("customer deposit rounds cents upward consistently with gateway validation", publicBooking.includes("Number.EPSILON") && publicBooking.includes("const cents = Math.round"));
check("selected deposit never falls back to the full outstanding balance", publicBooking.includes("selected_payment_amount") && publicBooking.includes('customerPaymentMethod === "deposit" && !selectedPaymentAmount'));
check("checkout sends the selected payment type and uses the server-authoritative first charge", publicBooking.includes('payment_type: customerPaymentMethod === "deposit" ? "partial" : "full"') && publicBooking.includes("booking?.selected_payment_amount"));
check("booking continues to the payment step", publicBooking.includes("setStep(3)"));
check("checkout terms open separately without losing entered passenger details", publicBooking.includes('href="/terms" target="_blank" rel="noopener noreferrer"'));
check("success copy uses the customer booking-request label", publicBooking.includes("Booking Request Received") && publicBooking.includes("Please wait for"));
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
check(
  "day tours never offer accommodation, including legacy one-day tours without nights",
  publicBooking.includes("const isDayTour = tour?.number_of_nights != null") &&
    publicBooking.includes("Number(tour?.number_of_days) === 1") &&
    publicBooking.includes("const accommodationBookingEnabled = SHOW_ACCOMMODATION_BOOKING && !isDayTour"),
);

const customerBooking = read("src/app/customer/bookings/[id]/page.tsx");
check("new booking opens payment UI", customerBooking.includes('searchParams.get("pay") === "1"'));
check(
  "customer request states use customer-safe booking language",
  customerBooking.includes("isBookingRequestReceived") &&
    customerBooking.includes("Booking Request Received") &&
    customerBooking.includes("BOOKING_AWAITING_CONFIRMATION_MESSAGE"),
);
check(
  "customer status lifecycle is explicit",
  customerBooking.includes("bookingStatusLabel") &&
    ["Booking Request Received", "Booking Confirmed", "Ongoing", "Completed", "Cancelled by Customer", "Cancelled by Tourvaa"].every((status) => read("src/lib/constants/bookingStatus.ts").includes(status)),
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
check("dashboard loads its profile from the customer-owned portal endpoint and cancels stale reloads", customerDashboard.includes('api.get("/customer/profile", { signal })') && customerDashboard.includes("new AbortController()") && !customerDashboard.includes('api.get("/customers/me")'));
const paymentReturn = read("src/app/customer/payments/[result]/page.tsx");
check("payment return shows success only after verified gateway completion", paymentReturn.includes('"/payments/stripe/confirm-return"') && paymentReturn.includes('paypal_status !== "COMPLETED"') && paymentReturn.includes('"/payments/abandon-pending"'));

const customerBookings = read("src/app/customer/bookings/page.tsx");
check("dashboard request links apply the bookings tab filter", customerBookings.includes('new URLSearchParams(window.location.search).get("tab")'));
check("customer dashboard has no fallback booking or wishlist tour data", !customerDashboard.includes("DEFAULT_BOOKINGS") && !customerDashboard.includes("rating: 4.8"));

const publicHeader = read("src/components/public/PublicHeader.tsx");
const customerHeader = read("src/components/customer/CustomerPortalHeader.tsx");
const customerLayout = read("src/app/customer/layout.tsx");
const portalPublicFooter = read("src/components/public/portal/PortalPublicFooter.tsx");
const wishlist = read("src/app/customer/wishlist/page.tsx");
const wishlistStore = read("src/providers/TravelStoreProvider.tsx");
const legacyWishlist = read("src/app/(public)/wishlist/page.tsx");
const comparePage = read("src/app/(public)/compare/page.tsx");
const retiredCart = read("src/app/(public)/cart/page.tsx");
const contactPage = read("src/app/(public)/contact/page.tsx");
const publicTourCard = read("src/components/public/TourCard.tsx");
const publicHomeTypes = read("src/components/public/home/homeTypes.ts");
const countryTourListing = read("src/components/public/CountryTourListing.tsx");
const countryToursSection = read("src/components/public/country/CountryToursSection.tsx");
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
check(
  "customer wishlist renders only saved dynamic tours and books them directly",
  wishlist.includes("const { hydrated, wishlist, toggleWishlist } = useTravelStore()") &&
    wishlist.includes("href={`/booking/${tour.id}`}") &&
    !wishlist.includes("DEFAULT_WISHLIST_TOURS") &&
    !wishlist.includes("addToCart"),
);
// The public nav links to the public /wishlist page (works for guests too);
// the customer-portal header/sidebar link to /customer/wishlist for signed-in
// customers browsing inside their portal - both render the same store.
check("public header links to the public wishlist page", publicHeader.includes('href="/wishlist"'));
check(
  "public header gives admin roles only a direct admin entry",
  publicHeader.includes('["admin", "super-admin", "sub-admin"]') &&
    publicHeader.includes('isAdminRole ? "/admin" : dashboardPath') &&
    publicHeader.includes("!isAdminRole && bookingsPath") &&
    publicHeader.includes("!isAdminRole && <Link"),
);
check("customer portal header links to the portal wishlist page", customerHeader.includes('"/customer/wishlist"'));
check("wishlist is loaded from the authenticated user API when logged in", wishlistStore.includes('api.get<WishlistResponse>("/wishlist")'));
check("wishlist mutations persist to the user API when logged in", wishlistStore.includes('api.post(`/wishlist/${item.id}`)') && wishlistStore.includes('api.delete(`/wishlist/${item.id}`)'));
// Guests (not logged in, or not a customer) get a local-only wishlist instead
// of being blocked - it's merged into the account on login.
check("wishlist falls back to local storage for guests", wishlistStore.includes("WISHLIST_STORAGE_KEY") && wishlistStore.includes("readLocalWishlist") && wishlistStore.includes("writeLocalWishlist"));
check("compare list still uses local storage (by design, unlike wishlist for logged-in users)", wishlistStore.includes("COMPARE_STORAGE_KEY") && wishlistStore.includes("window.localStorage"));
check("compare page remains empty until a visitor explicitly adds tours", comparePage.includes("A comparison must always be visitor-driven") && !comparePage.includes("show real tours (not hardcoded samples)") && comparePage.includes("setActiveItems([])"));
check("public wishlist page renders the store directly instead of redirecting", legacyWishlist.includes("useTravelStore") && !legacyWishlist.includes("redirect("));
check("retired cart route permanently redirects to tours", retiredCart.includes('permanentRedirect("/tours")'));
check(
  "supplier contact context uses supplier operations content and valid workspace actions",
  contactPage.includes("SUPPLIER_HERO") &&
    contactPage.includes("SUPPLIER_SUPPORT_CARDS") &&
    contactPage.includes('const bookingSupportHref = isSupplierInquiry') &&
    contactPage.includes('? "/supplier/bookings"') &&
    contactPage.includes('const messageSupportHref = isSupplierInquiry') &&
    contactPage.includes('? "/supplier/messages"') &&
    contactPage.includes("displaySupportCards[0].button_url : bookingSupportHref") &&
    contactPage.includes("href={messageSupportHref}"),
);
check("country and catalogue cards show active discount badges", countryToursSection.includes('variant="search"') && (publicTourCard.match(/\{discounted && <DiscountCardBadge percentage=\{tour\.discount_percentage!\} \/>\}/g) || []).length >= 3);
check(
  "supplier-funded offers show the pre-discount storefront price on every public card",
  publicTourCard.includes("tour.storefront_original_price_per_person ?? tour.original_price_per_person") &&
    publicHomeTypes.includes("tour.storefront_original_price_per_person ?? tour.original_price_per_person") &&
    countryTourListing.includes("t.storefront_original_price_per_person ?? t.original_price_per_person"),
);

const login = read("src/app/(public)/login/page.tsx");
const register = read("src/app/(public)/register/page.tsx");
check(
  "login honors safe shared booking redirects",
  login.includes("isSharedBooking") && login.includes("redirectForRole(roleSlug, safeRedirect)"),
);
check("registration preserves login redirect", register.includes("encodeURIComponent(redirect)"));

console.log(`\nCustomer flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
