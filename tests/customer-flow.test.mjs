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
check("search preserves travel date", search.includes('params.set("travel_date"'));
check("search preserves adult count", search.includes('params.set("adults"'));
check("search preserves child count", search.includes('params.set("children"'));

const detail = read("src/app/(public)/tours/[id]/page.tsx");
check("tour links preserve booking query", detail.includes("bookingQuery"));
check("login return path preserves booking context", detail.includes("encodeURIComponent(returnPath)"));
check("tour CTA opens dedicated public booking flow", detail.includes('`/booking/${tour.id}'));
const detailExperience = read("src/components/public/TourDetailExperience.tsx");
check("tour detail uses Book Now without cart actions", detailExperience.includes("Book Now") && !detailExperience.includes("addToCart") && !detailExperience.includes("ShoppingCart"));

// The booking form was moved off the tour detail page into a dedicated
// wizard at /booking/[id] (see HeroFilterBar/customer-flow architecture
// notes) - these checks target that page, not the tour detail page.
const publicBooking = read("src/app/(public)/booking/[id]/page.tsx");
check("public booking has six visible stages", publicBooking.includes("Confirmation") && publicBooking.includes("Secure checkout"));
check("public booking uses React Hook Form", publicBooking.includes("useForm<FormValues>") && publicBooking.includes("useFieldArray"));
check("public booking retains the customer-scoped booking endpoint", publicBooking.includes('isAgent ? "/bookings" : "/customer/bookings"'));
check("public booking allows customer and agent login", publicBooking.includes("Customer login") && publicBooking.includes("Agent login"));
check("public booking connects Stripe and PayPal", publicBooking.includes('"/payments/stripe/create-session"') && publicBooking.includes('"/payments/paypal/create-order"'));
check("public booking handles gateway returns", publicBooking.includes('"/payments/stripe/confirm-return"') && publicBooking.includes('"/payments/paypal/capture"'));
check("booking continues to the in-wizard payment step", publicBooking.includes("setStep(5)"));
check("success copy explains supplier acceptance", publicBooking.includes("subject to supplier acceptance"));
check("booking offers partial and full payment", publicBooking.includes('value="partial"') && publicBooking.includes('value="full"'));
check("booking sends selected payment type", publicBooking.includes("payment_type: form.paymentType"));
check("traveller fields follow selected counts", publicBooking.includes("length: adults") && publicBooking.includes("length: children"));
check("every traveller submits normalized age", publicBooking.includes("age: Number(row.age)"));
check("adult and child ages are validated", publicBooking.includes("age >= 12 && age <= 120") && publicBooking.includes("age >= 3 && age <= 11"));
check("dynamic travellers use a field array", publicBooking.includes("useFieldArray") && publicBooking.includes('name: "travellers"'));
check("custom booking inputs use controllers", publicBooking.includes("<Controller") && publicBooking.includes('name="travelDate"') && publicBooking.includes('name="phone"'));

const customerBooking = read("src/app/customer/bookings/[id]/page.tsx");
check("new booking opens payment UI", customerBooking.includes('searchParams.get("pay") === "1"'));
check("payment copy remains pending supplier acceptance", customerBooking.includes("Final confirmation is pending supplier acceptance"));
check("pending supplier banner is rendered", customerBooking.includes("Pending supplier acceptance"));
check("gateway charges the selected payment amount", customerBooking.includes("amount: paymentAmount"));
check("gateway modal offers deposit and full balance", customerBooking.includes("Pay 30% deposit") && customerBooking.includes("Pay in full"));
check("partial payment is a 30% deposit", customerBooking.includes("totalAmount * 0.3"));
check("dashboard payment actions open checkout directly", customerBooking.includes('searchParams.get("action") === "pay"'));

const customerDashboard = read("src/app/customer/dashboard/page.tsx");
check("dashboard exposes the main traveller quick actions", ["Book a Tour", "Make a Payment", "Add Traveller", "View Invoices", "Contact Support"].every((label) => customerDashboard.includes(label)));
check("dashboard links pending balances to checkout", customerDashboard.includes("?action=pay"));
check("dashboard referral action uses native share with clipboard fallback", customerDashboard.includes("navigator.share") && customerDashboard.includes("navigator.clipboard.writeText"));

const customerBookings = read("src/app/customer/bookings/page.tsx");
check("dashboard request links apply the bookings tab filter", customerBookings.includes('new URLSearchParams(window.location.search).get("tab")'));

const publicHeader = read("src/components/public/PublicHeader.tsx");
const customerHeader = read("src/components/customer/CustomerPortalHeader.tsx");
const wishlist = read("src/app/customer/wishlist/page.tsx");
const wishlistStore = read("src/providers/TravelStoreProvider.tsx");
const legacyWishlist = read("src/app/(public)/wishlist/page.tsx");
const retiredCart = read("src/app/(public)/cart/page.tsx");
check("public and customer headers no longer expose cart", !publicHeader.includes('href="/cart"') && !customerHeader.includes('href="/cart"'));
check("wishlist books tours directly", wishlist.includes('href={`/booking/${item.id}`}') && !wishlist.includes("addToCart"));
check("wishlist lives inside the customer portal", publicHeader.includes('href="/customer/wishlist"') && customerHeader.includes('href="/customer/wishlist"'));
check("wishlist is loaded from the authenticated customer API", wishlistStore.includes('api.get<WishlistResponse>("/customer/wishlist")'));
check("wishlist mutations persist to the customer API", wishlistStore.includes('api.post(`/customer/wishlist/${item.id}`)') && wishlistStore.includes('api.delete(`/customer/wishlist/${item.id}`)'));
// The compare list (a separate feature from wishlist) intentionally still
// uses localStorage - only the wishlist itself must be API-backed.
check("wishlist mutation functions don't fall back to local storage", !wishlistStore.slice(wishlistStore.indexOf("const toggleWishlist")).includes("localStorage"));
check("compare list still uses local storage (by design, unlike wishlist)", wishlistStore.includes("COMPARE_STORAGE_KEY") && wishlistStore.includes("window.localStorage"));
check("legacy wishlist redirects into the customer portal", legacyWishlist.includes('redirect("/customer/wishlist")'));
check("retired cart route redirects to tours", retiredCart.includes('redirect("/tours")'));

const login = read("src/app/(public)/login/page.tsx");
const register = read("src/app/(public)/register/page.tsx");
check(
  "login honors safe shared booking redirects",
  login.includes("isSharedBooking") && login.includes("redirectForRole(roleSlug, safeRedirect)"),
);
check("registration preserves login redirect", register.includes("encodeURIComponent(redirect)"));

console.log(`\nCustomer flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
