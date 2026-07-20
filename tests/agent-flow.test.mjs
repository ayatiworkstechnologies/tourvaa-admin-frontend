/** Agent journey contract checks. No server required. */
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

console.log("\n=== Agent Portal Flow ===\n");

const join = read("src/app/join/agent/page.tsx");
check("onboarding continues to agent profile", join.includes("%2Fagent%2Fprofile"));

const tours = read("src/app/agent/tours/page.tsx");
check("catalogue uses published tour API", tours.includes('api.get("/public/tours"'));
check("catalogue does not fall back to private inventory", !tours.includes('api.get("/tours"'));
check("catalogue uses backend price and image fields", tours.includes("price_start_per_person") && tours.includes("banner_image"));
check("catalogue exposes retryable API failures", tours.includes("Tours could not be loaded") && tours.includes("Retry"));

const create = read("src/app/agent/bookings/create/page.tsx");
check("booking picker preloads published tours without requiring search", create.includes("search: debouncedTourSearch || undefined") && create.includes("limit: 20"));
check("booking picker handles the public tour response shape", create.includes("res.data?.items") && create.includes("res.data?.data?.items"));
check("booking picker shows tour images with a local fallback", create.includes("banner_image") && create.includes("tour-card-fallback.jpg"));
check("booking picker shows destination, category, description, duration, and price", ["city_name", "country_name", "category_name", "short_description", "number_of_days", "price_start_per_person"].every((field) => create.includes(field)));
check("booking picker displays loading, empty, and failure states", create.includes("Loading published tours") && create.includes("No published tours match") && create.includes("Tours could not be loaded"));
check("booking includes authenticated agent id", create.includes("agent_id: agentId"));
check("booking uses backend traveller counts", create.includes("no_of_adults: adults") && create.includes("no_of_children: children"));
check("booking is explicitly agent sourced", create.includes('booking_source: "agent"'));
check("booking loads live departure availability", create.includes("calendar") && create.includes("slots >= totalPax"));
check("booking sends the selected calendar and validates live pricing", create.includes("tour_calendar_id: selectedCalendar?.id") && create.includes('api.post("/bookings/calculate-price"'));
check("booking captures every adult and child traveller", create.includes("Traveller Manifest") && create.includes("travellers.map((traveller, index)"));
check("booking validates traveller names and ages", create.includes("adults 12–120, children 2–11") && create.includes("age: Number(traveller.age)"));
check("booking offers deposit and full payment plans", create.includes('setPaymentType') && create.includes('payment_type: paymentType') && create.includes("30% deposit"));
check("booking shows execution readiness stages", create.includes("1. Customer") && create.includes("4. Review") && create.includes("5. Payment"));
check("new booking continues directly to payment", create.includes("?new=1&pay=1") && create.includes("Create & Continue to Payment"));
check("customer preselection is loaded", create.includes("prefillCustomerId") && create.includes("/customers/${prefillCustomerId}"));
check("tour preselection uses published detail", create.includes("/public/tours/${prefillTourId}"));

const customers = read("src/app/agent/customers/page.tsx");
check("agent customer create supplies full_name", customers.includes("full_name: fullName"));
check("agent customer phone is normalized", customers.includes("combinePhone"));
check("agent customer create captures address and location", ["country", "state", "city", "address_line_1", "address_line_2", "postal_code"].every((field) => customers.includes(field)));
check("new customer continues to first booking", customers.includes("/agent/bookings/create?customer_id="));
check("customer list exposes retryable API failures", customers.includes("Customers could not be loaded") && customers.includes("Retry"));
check("inline booking customer create uses the POST customer route", create.includes('api.post("/customers/"'));
check("inline booking customer create captures address and location", ["country", "state", "city", "address_line_1", "address_line_2", "postal_code"].every((field) => create.includes(field)));

const bookings = read("src/app/agent/bookings/page.tsx");
check("booking filter uses booking_status", bookings.includes("params.booking_status = statusFilter"));
check("new pending supplier statuses are represented", bookings.includes("pending_supplier_acceptance"));
check("booking summary cards use server-wide status counts", bookings.includes("status_counts") && bookings.includes("statusCounts.confirmed"));
check("booking list failures can be retried", bookings.includes("setRetryKey") && bookings.includes("Retry"));

const dashboard = read("src/app/agent/dashboard/page.tsx");
check("dashboard sends all visible filters to the summary API", dashboard.includes("booking_status: filters.status") && dashboard.includes("start_date: filters.start_date"));
check("dashboard exposes recoverable partial-load errors", dashboard.includes("Some dashboard data could not be loaded") && dashboard.includes("Retry"));

const detail = read("src/app/agent/bookings/[id]/page.tsx");
check("detail uses serialized traveller counts", detail.includes("booking.no_of_adults") && detail.includes("booking.no_of_children"));
check("detail exposes supplier decision", detail.includes("Supplier Acceptance"));
check("detail explains payment to confirmation execution", detail.includes("Booking Execution Flow") && detail.includes("Supplier decision") && detail.includes("Confirmed"));
check("detail renders price breakdown and status timeline", detail.includes("Price Breakdown") && detail.includes("Status Timeline"));
check("agent can reopen payment for an unpaid booking", detail.includes("BookingPaymentModal") && detail.includes("Pay Now"));
check("agent booking handles Stripe and PayPal returns", detail.includes('/payments/stripe/confirm-return') && detail.includes('/payments/paypal/capture'));
check("booking detail failures can be retried", detail.includes("setRefreshKey") && detail.includes("Retry"));

const invoices = read("src/app/agent/invoices/page.tsx");
check("invoices use backend amount and date fields", invoices.includes("inv.total_amount") && invoices.includes("inv.created_at"));
check("invoice booking links use booking_id", invoices.includes("/agent/bookings/${inv.booking_id}"));
check("invoices render readable backend references", invoices.includes("customer_name") && invoices.includes("booking_code"));
check("invoice failures are visible and retryable", invoices.includes("Invoices could not be loaded") && invoices.includes("Retry"));

const messages = read("src/app/agent/messages/page.tsx");
check("agent message history is connected", messages.includes('api.get("/agent/messages"'));
check("agent support compose is connected", messages.includes('api.post("/agent/messages"'));

const profile = read("src/app/agent/profile/page.tsx");
const verificationDocuments = read("src/components/agent/profile/VerificationDocumentsTab.tsx");
check("agent profile exposes verification documents", profile.includes("VerificationDocumentsTab") && profile.includes("Verification Documents"));
check("agent verification lists four required document categories", ["company_registration", "tax_certificate", "identity_proof", "bank_details"].every((type) => verificationDocuments.includes(type)));
check("agent verification waits for all required non-rejected uploads", verificationDocuments.includes("allRequiredReady") && verificationDocuments.includes('document.status !== "rejected"') && verificationDocuments.includes("Submit for verification"));
check("rejected agent documents show re-upload instructions", verificationDocuments.includes("Re-upload required") && verificationDocuments.includes("rejection_reason"));

const layout = read("src/app/agent/layout.tsx");
const portalTheme = read("src/lib/constants/portalThemes.ts");
const agentUi = [tours, create, customers, bookings, dashboard, detail, invoices, messages, layout].join("\n");
check("agent portal uses the calm blue theme", portalTheme.includes('"--color-dash-brand": "#2563EB"') && layout.includes('theme="navy"'));
check("agent primary UI no longer uses saturated orange", !agentUi.includes("from-orange-500") && !agentUi.includes("bg-orange-600") && !agentUi.includes("text-orange-700"));

console.log(`\nAgent flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
