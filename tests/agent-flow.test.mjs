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
const publicBooking = read("src/app/(public)/booking/[id]/page.tsx");
check("retired agent booking wizard redirects to the booking list", create.includes('redirect("/agent/bookings")'));
check("agent booking list is the only booking workspace", !read("src/app/agent/layout.tsx").includes('href: "/agent/bookings/create"'));
check("agent tour cards open the shared public tour booking flow", read("src/app/agent/tours/page.tsx").includes("publicTourUrl(tour)"));
check("agents can book from the shared public booking page", publicBooking.includes('["agent", "agent-reseller"]') && publicBooking.includes('isAgent ? "/bookings" : "/customer/bookings"'));
check("shared booking page keeps agent-only customer and commercial controls gated", publicBooking.includes("AgentCustomerSelector") && publicBooking.includes("isAgent && <div") && publicBooking.includes("<AgentCommercialFields"));
check("public agent booking uses the selected customer as primary traveller", publicBooking.includes('setValue("travellers.0.full_name", name') && publicBooking.includes("selectedCustomerName"));
check("public agent booking never prefills the agent as the traveller", publicBooking.includes('const selfBookingName = isCustomer ? user?.name || "" : ""'));
check("agent booking submits commercial controls only through the agent payload branch", publicBooking.includes("...(isAgent ? {") && publicBooking.includes("agent_markup:") && publicBooking.includes("agent_reference:") && publicBooking.includes("agent_payment_method:"));
check("existing customer email can be linked to the agent", publicBooking.includes('api.post("/customers/link"'));

const customers = read("src/app/agent/customers/page.tsx");
check("agent customer create supplies full_name", customers.includes("full_name: fullName"));
check("agent customer phone is normalized", customers.includes("combinePhone"));
check("agent customer create captures address and location", ["country", "state", "city", "address_line_1", "address_line_2", "postal_code"].every((field) => customers.includes(field)));
check("new customer remains in customer management", !customers.includes("/agent/bookings/create?customer_id="));
check("customer list exposes retryable API failures", customers.includes("Customers could not be loaded") && customers.includes("Retry"));
check("shared booking customer create uses the POST customer route", publicBooking.includes('api.post("/customers/"'));

const bookings = read("src/app/agent/bookings/page.tsx");
check("booking filter uses booking_status", bookings.includes("params.booking_status = statusFilter"));
check("new pending supplier statuses are represented", bookings.includes("pending_supplier_acceptance"));
check("booking summary cards use server-wide status counts", bookings.includes("status_counts") && bookings.includes("statusCounts.confirmed"));
check("booking list failures can be retried", bookings.includes("setRetryKey") && bookings.includes("Retry"));

const dashboard = read("src/app/agent/dashboard/page.tsx");
check("dashboard sends all visible filters to the summary API", dashboard.includes("booking_status: filters.status") && dashboard.includes("start_date: filters.start_date"));
check("dashboard exposes recoverable partial-load errors", dashboard.includes("Some dashboard data could not be loaded") && dashboard.includes("Retry"));
check("commission requests are managed from the agent dashboard", dashboard.includes('api.post("/agents/me/commission-request"') && dashboard.includes("Commission Setup"));

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
const agentPage = read("src/components/agent/AgentPage.tsx");
const agentInnerPages = [dashboard, tours, bookings, detail, customers, invoices, messages, profile];
check("agent inner pages share the upgraded page shell", agentInnerPages.every((page) => page.includes("AgentPageShell")));
check("agent inner pages share consistent workspace headers", agentInnerPages.every((page) => page.includes("AgentPageHeader")));
check("agent page system retains the calm blue visual identity", agentPage.includes("#2563EB") && agentPage.includes("#F5F8FD"));
check("agent dashboard prioritizes list and catalogue actions", ["Browse Tours", "My Customers", "Invoices"].every((label) => dashboard.includes(label)) && !dashboard.includes('href: "/agent/bookings/create"'));
check("agent catalogue books directly from polished tour cards", tours.includes("AgentSection") && tours.includes("Book This"));
check("agent booking creation uses the shared public booking workflow", publicBooking.includes("PublicBookingPage") && publicBooking.includes("AgentCustomerSelector"));
const agentUi = [...agentInnerPages, layout, agentPage].join("\n");
check("agent portal uses the calm blue theme", portalTheme.includes('"--color-dash-brand": "#2563EB"') && layout.includes('theme="navy"'));
check("agent primary UI no longer uses saturated orange", !agentUi.includes("from-orange-500") && !agentUi.includes("bg-orange-600") && !agentUi.includes("text-orange-700"));

console.log(`\nAgent flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
