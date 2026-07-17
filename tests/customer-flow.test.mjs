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

const listing = read("src/app/(public)/tours/page.tsx");
check("tour links preserve booking query", listing.includes("bookingQuery"));

const detail = read("src/app/(public)/tours/[id]/page.tsx");
check("booking uses customer-scoped endpoint", detail.includes('api.post("/customer/bookings"'));
check("booking continues to payment", detail.includes("?new=1&pay=1"));
check("success copy explains supplier acceptance", detail.includes("This is not final confirmation"));
check("login return path preserves booking context", detail.includes("encodeURIComponent(returnPath)"));
check("booking offers partial and full payment", detail.includes('"partial" as const') && detail.includes('"full" as const'));
check("booking sends selected payment type", detail.includes("payment_type: values.paymentType"));
check("partial payment is a 30% deposit", detail.includes("pricing.total * 0.3"));
check("traveller fields follow selected counts", detail.includes("length: adults") && detail.includes("length: children"));
check("every traveller submits name and age", detail.includes("full_name: traveller.full_name.trim()") && detail.includes("age: Number(traveller.age)"));
check("adult and child ages are validated", detail.includes("age >= 12") && detail.includes("age >= 2 && age <= 11"));
check("booking uses React Hook Form end to end", detail.includes("useForm<BookingFormValues>") && detail.includes("onSubmit={handleBook}"));
check("dynamic travellers use a field array", detail.includes("useFieldArray") && detail.includes('name: "travellers"'));
check("custom booking inputs use controllers", detail.includes("<Controller") && detail.includes('name="travelDate"') && detail.includes('name="phone"'));
check("tour CTA opens dedicated public booking flow", detail.includes('`/booking/${tour.id}'));

const publicBooking = read("src/app/(public)/booking/[id]/page.tsx");
check("public booking has six visible stages", publicBooking.includes("Confirmation") && publicBooking.includes("Secure checkout"));
check("public booking uses React Hook Form", publicBooking.includes("useForm<FormValues>") && publicBooking.includes("useFieldArray"));
check("public booking creates a customer booking", publicBooking.includes('api.post("/customer/bookings"'));
check("public booking connects Stripe and PayPal", publicBooking.includes('"/payments/stripe/create-session"') && publicBooking.includes('"/payments/paypal/create-order"'));
check("public booking handles gateway returns", publicBooking.includes('"/payments/stripe/confirm-return"') && publicBooking.includes('"/payments/paypal/capture"'));

const customerBooking = read("src/app/customer/bookings/[id]/page.tsx");
check("new booking opens payment UI", customerBooking.includes('searchParams.get("pay") === "1"'));
check("payment copy remains pending supplier acceptance", customerBooking.includes("Final confirmation is pending supplier acceptance"));
check("pending supplier banner is rendered", customerBooking.includes("Pending supplier acceptance"));
check("gateway charges the selected payment amount", customerBooking.includes("amount: paymentAmount"));
check("gateway modal offers deposit and full balance", customerBooking.includes("Pay 30% deposit") && customerBooking.includes("Pay in full"));

const login = read("src/app/(public)/login/page.tsx");
const register = read("src/app/(public)/register/page.tsx");
check(
  "login honors safe customer redirect",
  login.includes('customer: "/customer/"') && login.includes("redirectForRole(roleSlug, safeRedirect)"),
);
check("registration preserves login redirect", register.includes("encodeURIComponent(redirect)"));

console.log(`\nCustomer flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
