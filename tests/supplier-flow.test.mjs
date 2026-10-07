/** Supplier journey contract checks. No server required. */
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

console.log("\n=== Supplier Portal Flow ===\n");

// The former /join/supplier landing page was removed (project status T19):
// supplier signup now lives in the supplier portal's own auth page, which shows
// the inline RegisterPanel instead of navigating to a separate marketing page.
const register = read("src/app/(public)/register/page.tsx");
check(
  "public registration is traveller-only and points partners at their own portals",
  register.includes("Traveller (customer) accounts only") &&
    register.includes("/agent-portal/login") &&
    register.includes("/supplier-portal/login"),
);

const supplierPortal = read("src/app/supplier-portal/login/page.tsx");
const supplierLayout = read("src/app/supplier/layout.tsx");
const supplierLanding = read("src/app/supplier-portal/page.tsx");
check(
  "supplier portal keeps its own inline registration tab (no registerHref override)",
  supplierPortal.includes("registerNamePlaceholder") && !supplierPortal.includes("registerHref"),
);

const bookingList = read("src/app/supplier/bookings/page.tsx");
check("booking filter uses backend booking-status, supplier-decision, and cancellation contracts", bookingList.includes("params.booking_status = selected.booking_status") && bookingList.includes("params.supplier_acceptance_status = selected.supplier_acceptance_status") && bookingList.includes("params.cancellation_source = selected.cancellation_source"));
check("supplier booking filters and columns use supplier terminology", ["Awaiting My Decision", "Cancelled by Supplier", "Cancelled by Tourvaa", "Supplier Payment Status"].every((label) => bookingList.includes(label)));
check("supplier list remains scoped through authenticated bookings API", bookingList.includes('api.get("/bookings"'));
check("supplier decision status is filterable", bookingList.includes("pending_supplier_acceptance"));
check("booking summary cards use server-wide status counts", bookingList.includes("status_counts") && bookingList.includes("statusCounts.ongoing"));
check("dashboard booking links apply their status filter", bookingList.includes('new URLSearchParams(window.location.search).get("status")'));

const dashboard = read("src/app/supplier/dashboard/page.tsx");
check("dashboard exposes recoverable partial-load errors", dashboard.includes("Promise.allSettled") && dashboard.includes("setError(") && dashboard.includes("Retry"));
check("dashboard excludes reserved ledger rows from available payout", dashboard.includes('=== "reserved"') && dashboard.includes('["pending", "partial"]'));
check("dashboard loads supplier-scoped tour totals instead of missing summary fields", dashboard.includes('api.get("/tours", { params: { limit: 1 } })') && dashboard.includes('status: "published"'));
check("dashboard shows the monthly payout schedule without a request action", dashboard.includes("Next payout date") && dashboard.includes("end of every month") && !dashboard.includes("Request Payout"));
check("dashboard highlights bookings awaiting supplier decisions", dashboard.includes("Booking decisions are waiting") && dashboard.includes("/supplier/bookings?status=pending_supplier_acceptance"));
check("dashboard retains date and status filtering", dashboard.includes("<DatePicker") && dashboard.includes("bookingParams.booking_status = filters.status"));
check("dashboard provides loading and filtered empty states", dashboard.includes("BookingSkeleton") && dashboard.includes("No bookings match these filters"));

const bookingDetail = read("src/app/supplier/bookings/[id]/page.tsx");
check("supplier can accept pending supplier requests without agent settlement details", bookingDetail.includes('v === "pending_supplier_acceptance"') && bookingDetail.includes("Accept Booking") && bookingDetail.includes("Decline") && !bookingDetail.includes("paymentReady"));
check("decline includes a required reason", bookingDetail.includes('{ reason: declineReason }'));
check("supplier cancellation confirms the applicable liability", ["supplier_cancellation_terms", "Confirm booking cancellation", "no cancellation charge", "liability_percentage", "Yes, continue"].every((text) => bookingDetail.includes(text)));
check("supplier withdrawal stays internal to Tourvaa", bookingDetail.includes("awaiting internal supplier reassignment") && !bookingDetail.includes("Booking cancelled. Customer has been notified."));
check("submitted supplier withdrawal returns to the supplier booking queue", bookingDetail.includes('router.replace("/supplier/bookings")'));
check("supplier acceptance status is displayed", bookingDetail.includes("Supplier Decision"));
check("supplier booking messages use the backend-supported update type", bookingDetail.includes('message_type: "supplier_update"') && !bookingDetail.includes('message_type: "supplier_message"'));
check("supplier booking message errors show the API detail", bookingDetail.includes("response?.data?.detail") && bookingDetail.includes("toast.error(message || \"Could not send message.\")"));
check("accept endpoint is connected", bookingDetail.includes("/accept"));
check("decline endpoint is connected", bookingDetail.includes("/decline"));
check("supplier can move confirmed tours to ongoing", bookingDetail.includes("/ongoing") && bookingDetail.includes("Start Tour"));
check("only ongoing tours show the completion action", bookingDetail.includes("isOngoing") && bookingDetail.includes("Mark Completed"));
check(
  "supplier cannot postpone or resume a tour",
  !bookingDetail.includes('"/postpone"') &&
    !bookingDetail.includes("Resume Tour") &&
    bookingDetail.includes("contact Tourvaa support for the next steps"),
);
const portalAuth = read("src/components/public/portal/PortalAuthPage.tsx");
check(
  "supplier registration accepts every phone-country even when it is absent from the admin geo catalogue",
  portalAuth.includes("country_id: selectedCountry?.id") &&
    !portalAuth.includes('return setError("Select a valid country.")') &&
    !portalAuth.includes('return setError("Countries are still loading. Please try again.")'),
);
check(
  "supplier verification checklist matches the supplier document requirements and contact desk opens the form",
  ["Business Registration Certificate", "Relevant Operating Licence", "Public Liability Insurance Certificate", "Tourism Accreditation", "Industry Certification", "Safety Certification", "Other Licences", "Additional Supporting Documents"].every((label) => supplierLanding.includes(label)) &&
    supplierLanding.includes('href="/contact?context=supplier#contact-form-section"'),
);
const contactPage = read("src/app/(public)/contact/page.tsx");
check(
  "supplier desk opens supplier-specific onboarding questions instead of booking questions",
  contactPage.includes('get("context") === "supplier"') &&
    contactPage.includes("Do you already have a supplier account?") &&
    contactPage.includes("Supplier Verification Documents") &&
    contactPage.includes("Send Message to Supplier Desk"),
);
const supplierDocuments = read("src/components/supplier/profile/DocumentsTab.tsx");
check(
  "supplier document uploads preserve optional document status",
  supplierDocuments.includes("required: false") &&
    supplierDocuments.includes("docTypes.filter((type) => type.required)") &&
    supplierDocuments.includes("(Optional)"),
);
check("supplier portal mounts the shared language translator", supplierLayout.includes("ElfsightTranslator") && supplierLayout.includes("<ElfsightTranslator />"));
check(
  "supplier sees only supplier settlement details",
  ["Supplier Payment", "Commission to Tourvaa", "Supplier Net Payable", "Supplier Payment Status"].every((label) => bookingDetail.includes(label)),
);

const tours = read("src/app/supplier/tours/page.tsx");
const tourCreate = read("src/app/supplier/tours/create/page.tsx");
const tourEdit = read("src/app/supplier/tours/[id]/edit/page.tsx");
const preview = read("src/app/supplier/tours/[id]/preview/page.tsx");
// Admin and supplier tour create/edit are now thin wrappers around the
// shared TourWizard component (<TourWizard role="supplier" .../>), so the
// step/tab/header assertions below target TourWizard.tsx, not the wrappers.
const tourWizard = read("src/components/tours/TourWizard.tsx");
check("tour cards use private supplier preview", tours.includes("/supplier/tours/${tour.id}/preview"));
check("tour list supports search and every publishing state", tours.includes("pending_approval") && tours.includes("rejected") && tours.includes("params.search = debouncedSearch"));
check("tour list surfaces submission errors", tours.includes("setActionError") && tours.includes("could not be submitted"));
check("tour cards display their cover media", tours.includes("banner_image") && tours.includes("mediaUrl(tour.banner_image)"));
check("supplier create/edit pages use the shared TourWizard", tourCreate.includes("<TourWizard") && tourEdit.includes("<TourWizard"));
check("tour creation has guided progress and review", tourWizard.includes("WizardSideStepper") && read("src/components/tours/wizard/steps.ts").includes("Review & Submit"));
check("tour edit retains all structured editing tabs", ["Overview", "Highlights", "Itinerary", "Inclusions", "Gallery", "Pricing", "Calendar"].every((tab) => tourWizard.includes(tab)));
check("tour edit links to private preview", tourWizard.includes("/preview") && tourWizard.includes("Preview"));
check(
  "admin and supplier tour builders use the same shared design system",
  tourWizard.includes("TourWorkspaceHeader") &&
    tourWizard.includes("TourWorkspaceContent") &&
    tourWizard.includes("WizardSideStepper"),
);
check(
  "supplier tour sections support explicit step completion",
  tourWizard.includes("visitedSteps") &&
    tourWizard.includes("selectStep") &&
    tourWizard.includes("useStepCompletion") &&
    tourWizard.includes('basePath = isSupplier ? "/supplier/tours"'),
);
const sharedTourForm = read("src/components/cms/TourFormPage.tsx");
check(
  "supplier edit uses the complete shared tour details form",
  tourEdit.includes('role="supplier"') &&
    tourWizard.includes("TourFormPage") &&
    ["Currency", "Media", "Subcategories", "SEO"].every((section) => sharedTourForm.includes(section)),
);
check(
  "supplier assignment and publishing status stay protected",
  sharedTourForm.includes("disabled={isSupplier}") &&
    sharedTourForm.includes("tour remains assigned to your supplier account") &&
    sharedTourForm.includes("current publishing status is preserved"),
);
check(
  "supplier tour form uses permitted category lookups",
  sharedTourForm.includes('api.get("/tours/categories"') &&
    sharedTourForm.includes('api.get("/public/subcategories")') &&
    sharedTourForm.includes("if (isSupplier)"),
);
check(
  "supplier edit reuses its loaded tour record in the shared form",
  tourWizard.includes("initialData={tour ?? undefined}") &&
    sharedTourForm.includes("if (!tourId || initialData) return"),
);
check("preview uses backend tour field names", preview.includes("price_start_per_person") && preview.includes("banner_image"));
check("preview loads structured tour sections", preview.includes("/highlights") && preview.includes("/inclusions") && preview.includes("/exclusions"));
const tourItems = read("src/components/tours/TourItemsTab.tsx");
check("supplier inclusion and exclusion editor does not expose an icon URL field", !tourItems.includes('name="icon"'));

const messages = read("src/app/supplier/messages/page.tsx");
const portalMessageThread = read("src/components/messaging/PortalMessageThread.tsx");
const messagingService = read("src/lib/api/services/messagingService.ts");
check("supplier message history is connected", messages.includes('PortalMessageThread portal="supplier"') && portalMessageThread.includes("getOwnConversation(portal)") && messagingService.includes('supplier: "/supplier/messages"'));
check("supplier support compose is connected", portalMessageThread.includes("sendOwnMessage(portal") && messagingService.includes("api.post(OWN_MESSAGES_PATH[portal]"));

const payouts = read("src/app/supplier/payouts/page.tsx");
check("payout payload omits unsupported bank fields", !payouts.includes("bank_name:") && !payouts.includes("account_number:"));
check("supplier payout history is read-only and shows the month-end schedule", payouts.includes("Next payout date") && payouts.includes("end of every month") && !payouts.includes("Request Payout") && !payouts.includes('api.post("/supplier-payouts"'));
const homeExtraSections = read("src/components/public/home/HomeExtraSections.tsx");
check("published Adventure Tours appear in an automatic homepage carousel", homeExtraSections.includes("AUTOMATIC_ADVENTURE_SECTION_ID") && homeExtraSections.includes("Adventure Tours") && homeExtraSections.includes("fetchPublicCategories"));

const documents = read("src/components/supplier/profile/DocumentsTab.tsx");
check("supplier documents expose retryable loading failures", documents.includes("Documents could not be loaded") && documents.includes("Retry"));

const supplierProfile = read("src/components/supplier/profile/CompanyInfoTab.tsx");
const supplierBilling = read("src/components/supplier/profile/BankAndInvoicingTab.tsx");
const adminSupplierDetail = read("src/app/admin/suppliers/[id]/page.tsx");
const tourPricing = read("src/components/tours/TourPricingTab.tsx");
check(
  "supplier business years are persisted in business information",
  supplierProfile.includes("years_in_business: parseInt(form.years_in_operation) || 0"),
);
check(
  "supplier profile collects locked bank, accounts, and billing details",
  supplierBilling.includes("Bank Details") &&
    supplierBilling.includes("Invoicing & Accounts Details") &&
    supplierBilling.includes("Business Billing Address") &&
    supplierBilling.includes("bank_details_locked") &&
    supplierBilling.includes("Use Primary Contact"),
);
check(
  "supplier tour editor cannot view or submit checkout tax and service fees",
  sharedTourForm.includes("const canManageCheckoutCharges = !isSupplier") &&
    sharedTourForm.includes("{canManageCheckoutCharges && (") &&
    sharedTourForm.includes("if (canManageCheckoutCharges) {\n        payload.tax_percentage"),
);
check(
  "supplier tour editor excludes the SEO step and preserves SEO metadata on other saves",
  tourWizard.includes('WIZARD_STEPS.filter((step) => step.id !== "seo")') &&
    tourWizard.includes("steps={wizardSteps}") &&
    sharedTourForm.includes("const metadataFields = isSupplier") &&
    sharedTourForm.includes("if (!isSupplier) {\n        payload.open_graph_image"),
);
check(
  "admin supplier detail exposes registration contact and business address",
  adminSupplierDetail.includes("Supplier information") &&
    adminSupplierDetail.includes("Business address") &&
    adminSupplierDetail.includes("Person in charge") &&
    adminSupplierDetail.includes("Years in business"),
);
check(
  "supplier pricing distinguishes the offer price from the post-commission payout",
  tourPricing.includes("Your offer price to TourVaa - adult") &&
  tourPricing.includes("Your offer price to TourVaa - child") &&
  tourPricing.includes("You will receive (adult)") &&
  tourPricing.includes("You will receive (child)"),
);
check(
  "supplier pricing displays and edits USD-normalized slabs in the operating currency",
  tourPricing.includes("useCurrency") && tourPricing.includes("convert(slab.adult_price, slab.currency)") && tourPricing.includes("outputCode(slab.currency || \"USD\")"),
);
check("TourVaa storefront discounts reduce the admin profit preview", tourPricing.includes("markupFinancials") && tourPricing.includes("netProfit") && tourPricing.includes("deducted from TourVaa profit"));

const commissionTab = read("src/components/supplier/profile/CommissionTab.tsx");
check(
  "supplier profile shows the agreed commission without an editable basic tier",
  commissionTab.includes("Agreed commission rate") &&
    commissionTab.includes("no separate basic commission") &&
    commissionTab.includes("supplier-editable commission tier"),
);
check(
  "supplier profile shows the marketplace pricing agreement",
  commissionTab.includes("Supplier Terms &amp; Conditions") && commissionTab.includes("Tourvaa may apply storefront markup"),
);

const supplierInnerPages = [
  bookingList,
  bookingDetail,
  tours,
  tourCreate,
  tourEdit,
  preview,
  read("src/app/supplier/earnings/page.tsx"),
  payouts,
  messages,
  read("src/app/supplier/profile/page.tsx"),
];
check("supplier inner pages share the upgraded page shell", supplierInnerPages.every((page) => page.includes("SupplierPageShell")));
check(
  "supplier inner pages share consistent page headers",
  supplierInnerPages.every((page) => page.includes("SupplierPageHeader") || page.includes("TourWorkspaceHeader") || page.includes("<TourWizard")),
);

console.log(`\nSupplier flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
