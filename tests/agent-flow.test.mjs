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

// The former /join/agent landing page was removed (project status T19): agent
// signup now lives in the agent portal's own auth page, which shows the inline
// RegisterPanel instead of navigating to a separate marketing page.
const register = read("src/app/(public)/register/page.tsx");
check(
  "public registration is traveller-only and points partners at their own portals",
  register.includes("Traveller (customer) accounts only") &&
    register.includes("/agent-portal/login") &&
    register.includes("/supplier-portal/login"),
);

const agentPortal = read("src/app/agent-portal/login/page.tsx");
check(
  "agent portal keeps its own inline registration tab (no registerHref override)",
  agentPortal.includes("registerNamePlaceholder") && !agentPortal.includes("registerHref"),
);

const tours = read("src/app/agent/tours/page.tsx");
check("catalogue uses published tour API", tours.includes('api.get("/public/tours"'));
check("catalogue does not fall back to private inventory", !tours.includes('api.get("/tours"'));
check("catalogue uses backend price and image fields", tours.includes("price_start_per_person") && tours.includes("banner_image"));
check("catalogue exposes retryable API failures", tours.includes("Tours could not be loaded") && tours.includes("Retry"));
check("catalogue search submits the current form value and always refreshes", tours.includes('new FormData(form).get("search")') && tours.includes("setQuery(submittedSearch)") && tours.includes("setRetryKey((value) => value + 1)"));
const wishlistStore = read("src/providers/TravelStoreProvider.tsx");
check("agents can persist favorite tours to their wishlist", wishlistStore.includes('"agent-reseller"') && wishlistStore.includes('api.post(`/wishlist/${item.id}`)') && wishlistStore.includes('api.get<WishlistResponse>("/wishlist")'));

const create = read("src/app/agent/bookings/create/page.tsx");
const publicBooking = read("src/app/(public)/booking/[id]/page.tsx");
check("retired agent booking wizard redirects to the booking list", create.includes('redirect("/agent/bookings")'));
check("agent booking list is the only booking workspace", !read("src/app/agent/layout.tsx").includes('href: "/agent/bookings/create"'));
check("agent tour cards open the shared public tour booking flow", read("src/app/agent/tours/page.tsx").includes("publicTourUrl(tour)"));
check("agent tour cards display active discounts on their images", read("src/app/agent/tours/page.tsx").includes("DiscountCardBadge") && read("src/app/agent/tours/page.tsx").includes("hasActiveDiscount(tour)"));
check("agents can book from the shared public booking page", publicBooking.includes('["agent", "agent-reseller"]') && publicBooking.includes('api.post("/bookings"'));
check("shared booking page keeps agent-only customer and commercial controls gated", publicBooking.includes("AgentCustomerSelector") && publicBooking.includes("{isAgent && (") && publicBooking.includes("<AgentCommercialFields"));
check("public agent booking uses the selected customer as primary traveller", publicBooking.includes("const leadName = isAgent ? agentCustomerName : selfBookingName") && publicBooking.includes("passenger.firstName = first"));
check("public agent booking never prefills the agent as the traveller", publicBooking.includes('const selfBookingName = isCustomer ? user?.name || "" : ""'));
check("agent booking submits commercial controls only through the agent payload branch", publicBooking.includes("...(isAgent ? {") && publicBooking.includes("agent_markup:") && publicBooking.includes("agent_reference:") && publicBooking.includes("agent_payment_method:"));
check("agent checkout excludes promo controls and promo payloads", publicBooking.includes("!isAgent && <div") && publicBooking.includes("promo_code: !isAgent && promoApplied"));
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
check("dashboard exposes recoverable partial-load errors", dashboard.includes("Promise.allSettled") && dashboard.includes("setError(") && dashboard.includes("Retry"));
check("commission requests are managed from the agent dashboard", dashboard.includes('api.post("/agents/me/commission-request"') && dashboard.includes("Commission Setup"));

const detail = read("src/app/agent/bookings/[id]/page.tsx");
check("agent booking detail does not expose the shared-customer visibility notice", !detail.includes("Shared customer booking.") && !detail.includes("visible in both the Agent and Customer portals"));
check("detail uses serialized traveller counts", detail.includes("booking.no_of_adults") && detail.includes("booking.no_of_children"));
check("agent booking header prioritizes the tour name and keeps the booking id compact", detail.includes('title={booking.tour_name || "Tour booking"}') && detail.includes('eyebrow={`Booking ${booking.booking_code}`}'));
check("detail uses the same customer-facing booking lifecycle labels", detail.includes("customerFacingBookingStatus") && ["Booking Request Received", "Booking Confirmed", "Ongoing", "Completed", "Cancelled"].every((label) => detail.includes(label)));
check("detail gives booking-request receipt wording without exposing internal execution flow", detail.includes("Your booking request has been received successfully.") && !detail.includes("Booking Execution Flow") && !detail.includes("Supplier decision"));
check("detail shows the settlement summary without a duplicate price breakdown", detail.includes("Agent Payments") && detail.includes("Approved Agent Commission") && !detail.includes("Price Breakdown") && detail.includes("Status Timeline"));
check("agent cancellation requires eligibility and confirmation", ["Request Cancellation", "is_free_cancellation_eligible", "Confirm cancellation request", "Yes, continue", "contact Tourvaa"].every((text) => detail.includes(text)));
check("agent cancellation warning is clear and does not duplicate support wording", detail.includes("Please contact Tourvaa Support for cancellation assistance or a travel-date change.") && !detail.includes("Help Desk for cancellation assistance"));
check("agent can reopen payment for an unpaid booking", detail.includes("BookingPaymentModal") && detail.includes("Pay Now"));
check("agent payment modal never offers a customer deposit option", detail.includes("allowPartialPayment={false}"));
const paymentModal = read("src/components/bookings/BookingPaymentModal.tsx");
check("agent payment has a usable non-production fallback when live gateways are absent", paymentModal.includes("Complete test payment") && paymentModal.includes("gateways?.test_mode_available && !gateways.stripe && !gateways.paypal"));
check("payment method loading failures are visible and retryable", paymentModal.includes("Payment methods could not be loaded.") && paymentModal.includes("Retry payment methods") && paymentModal.includes("loadGateways"));
check("unpaid gateway returns show payment-required copy and can be removed only from My Bookings", detail.includes("Payment Required") && detail.includes("hide-from-agent") && detail.includes("Remove from Bookings") && detail.includes("canRemoveUnpaidBooking") && detail.includes("has_abandoned_gateway_payment === true"));
const bookingService = read("../backend/app/services/bookings.py");
check(
  "provisional unpaid bookings stay agent-visible but remain hidden from operational portals",
  bookingService.includes('if role != "agent":') &&
    bookingService.includes('Booking.payment_status.notin_(("unpaid", "pending", "failed"))') &&
    bookingService.includes("Booking.agent_hidden_at.is_(None)"),
);
check(
  "remove-from-bookings eligibility requires an abandoned agent gateway checkout",
  bookingService.includes('data["has_abandoned_gateway_payment"]') &&
    bookingService.includes('Payment.payment_status == "abandoned"') &&
    bookingService.includes('Payment.gateway.in_(("stripe", "paypal"))'),
);
check("agent booking handles Stripe and PayPal returns", detail.includes('/payments/stripe/confirm-return') && detail.includes('/payments/paypal/capture') && detail.includes('"/payments/abandon-pending"'));
check("booking detail failures can be retried", detail.includes("setRefreshKey") && detail.includes("Retry"));

const invoices = read("src/app/agent/invoices/page.tsx");
check("invoices use backend amount and date fields", invoices.includes("inv.total_amount") && invoices.includes("inv.created_at"));
check("invoice booking links use booking_id", invoices.includes("/agent/bookings/${inv.booking_id}"));
check("invoices render readable backend references", invoices.includes("customer_name") && invoices.includes("booking_code"));
check("invoice failures are visible and retryable", invoices.includes("Invoices could not be loaded") && invoices.includes("Retry"));

const messages = read("src/app/agent/messages/page.tsx");
const portalMessageThread = read("src/components/messaging/PortalMessageThread.tsx");
const messagingService = read("src/lib/api/services/messagingService.ts");
check("agent message history is connected", messages.includes('PortalMessageThread portal="agent"') && portalMessageThread.includes("getOwnConversation(portal)") && messagingService.includes('agent: "/agent/messages"'));
check("agent support compose is connected", portalMessageThread.includes("sendOwnMessage(portal") && messagingService.includes("api.post(OWN_MESSAGES_PATH[portal]"));

const profile = read("src/app/agent/profile/page.tsx");
const agentBankAndInvoicing = read("src/components/agent/profile/AgentBankAndInvoicingTab.tsx");
const verificationDocuments = read("src/components/agent/profile/VerificationDocumentsTab.tsx");
check("agent profile exposes business verification documents", profile.includes("VerificationDocumentsTab") && profile.includes("Business Verification"));
check("locked agent bank identifiers remain masked after saving", agentBankAndInvoicing.includes("swift_code: saved.swift_code") && agentBankAndInvoicing.includes("values are masked after saving"));
check("agent profile uses the restructured shared portal tab and content layout without fleet controls", profile.includes("overflow-x-auto") && profile.includes("w-full rounded-2xl") && profile.includes('role="tablist"') && !profile.includes("My Vehicles"));
check("agent verification lists the required business document categories", ["company_registration", "iata_accreditation", "industry_certification", "other_licences", "supporting_documents"].every((type) => verificationDocuments.includes(type)));
check("agent verification waits for all required non-rejected uploads", verificationDocuments.includes("allRequiredReady") && verificationDocuments.includes('document.status !== "rejected"') && verificationDocuments.includes("Submit for verification"));
check("rejected agent documents show re-upload instructions", verificationDocuments.includes("Re-upload required") && verificationDocuments.includes("rejection_reason"));

const layout = read("src/app/agent/layout.tsx");
const portalTheme = read("src/lib/constants/portalThemes.ts");
const agentPage = read("src/components/agent/AgentPage.tsx");
const sidebar = read("src/components/layout/Sidebar.tsx");
const agentInnerPages = [dashboard, tours, bookings, detail, customers, invoices, messages, profile];
check("agent portal uses the same workspace shell as supplier", layout.includes('from "@/components/layout/Sidebar"') && layout.includes('from "@/components/layout/Header"') && !layout.includes("CustomerSidebar") && !layout.includes("CustomerPortalHeader"));
check("agent inner pages share the upgraded page shell", agentInnerPages.every((page) => page.includes("AgentPageShell")));
check("agent inner pages share consistent workspace headers", dashboard.includes("Agent Control Centre") && [tours, bookings, detail, customers, invoices, messages, profile].every((page) => page.includes("AgentPageHeader")));
check("agent dashboard follows the supplier control-centre composition in agent blue", ["bg-linear-to-br from-[#10213F]", "xl:grid-cols-4", "xl:grid-cols-6"].every((fragment) => dashboard.includes(fragment)));
check("agent page system retains the calm blue visual identity", agentPage.includes("#2563EB") && agentPage.includes("#F8FAFC"));
check("agent dashboard prioritizes list and catalogue actions", ["Browse Tours", "My Customers", "Invoices"].every((label) => dashboard.includes(label)) && !dashboard.includes('href: "/agent/bookings/create"'));
check("agent catalogue exposes reserve and full-payment actions", tours.includes("AgentSection") && tours.includes("Reserve Now") && tours.includes("Pay in Full Today") && tours.includes("agent_action=reserve") && tours.includes("agent_action=full"));
check("agent booking action is preserved into settlement", publicBooking.includes('searchParams.get("agent_action")') && publicBooking.includes('"pay_later"') && publicBooking.includes('payment_type: "full"'));
check("agent Reserve Now is a no-deposit invoice flow", publicBooking.includes("Reserve your booking now with no deposit") && !publicBooking.includes("agent_reserve_deposit") && !publicBooking.includes("agentReserveSplit"));
check("agent booking creation uses the shared public booking workflow", publicBooking.includes("export default function DynamicTourBookingPage") && publicBooking.includes("AgentCustomerSelector"));
const agentUi = [...agentInnerPages, layout, agentPage].join("\n");
check("agent portal uses the calm blue theme", portalTheme.includes('"--color-dash-brand": "#2563EB"') && layout.includes("portalThemeStyles.agent"));
check("agent sidebar uses a subtle divider instead of a blue edge rail", sidebar.includes('edge: "w-px bg-[#E2EAF4]"') && !sidebar.includes('edge: "w-1 bg-gradient-to-b from-[#60A5FA] via-[#2563EB] to-[#1E3A8A]"'));
check("agent primary UI no longer uses saturated orange", !agentUi.includes("from-orange-500") && !agentUi.includes("bg-orange-600") && !agentUi.includes("text-orange-700"));

console.log(`\nAgent flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
