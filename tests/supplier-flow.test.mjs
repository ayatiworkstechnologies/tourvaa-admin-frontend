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

const join = read("src/app/join/supplier/page.tsx");
check("onboarding continues to supplier profile", join.includes("%2Fsupplier%2Fprofile"));

const bookingList = read("src/app/supplier/bookings/page.tsx");
check("booking filter uses backend booking_status contract", bookingList.includes("params.booking_status = statusFilter"));
check("supplier list remains scoped through authenticated bookings API", bookingList.includes('api.get("/bookings"'));
check("supplier decision status is filterable", bookingList.includes("pending_supplier_acceptance"));
check("booking summary cards use server-wide status counts", bookingList.includes("status_counts") && bookingList.includes("statusCounts.ongoing"));
check("dashboard booking links apply their status filter", bookingList.includes('new URLSearchParams(window.location.search).get("status")'));

const dashboard = read("src/app/supplier/dashboard/page.tsx");
check("dashboard exposes recoverable partial-load errors", dashboard.includes("Some dashboard data could not be loaded") && dashboard.includes("Retry"));
check("dashboard excludes reserved ledger rows from available payout", dashboard.includes('=== "reserved"') && dashboard.includes('["pending", "partial"]'));
check("dashboard loads supplier-scoped tour totals instead of missing summary fields", dashboard.includes('api.get("/tours", { params: { limit: 1 } })') && dashboard.includes('status: "published"'));
check("dashboard prioritizes supplier actions", ["Create New Tour", "Review Bookings", "View Earnings", "Request Payout"].every((label) => dashboard.includes(label)));
check("dashboard highlights bookings awaiting supplier decisions", dashboard.includes("Booking decisions are waiting") && dashboard.includes("/supplier/bookings?status=pending_supplier_acceptance"));
check("dashboard retains date and status filtering", dashboard.includes("<DatePicker") && dashboard.includes("bookingParams.booking_status = filters.status"));
check("dashboard provides loading and filtered empty states", dashboard.includes("BookingSkeleton") && dashboard.includes("No bookings match these filters"));

const bookingDetail = read("src/app/supplier/bookings/[id]/page.tsx");
check("acceptance waits for payment readiness", bookingDetail.includes("paymentReady") && bookingDetail.includes("isAwaitingPayment"));
check("decline includes a required reason", bookingDetail.includes('{ reason: declineReason }'));
check("supplier acceptance status is displayed", bookingDetail.includes("Supplier Decision"));
check("accept endpoint is connected", bookingDetail.includes("/accept"));
check("decline endpoint is connected", bookingDetail.includes("/decline"));
check("supplier can move confirmed tours to ongoing", bookingDetail.includes("/ongoing") && bookingDetail.includes("Start Tour"));
check("only ongoing tours show the completion action", bookingDetail.includes("isOngoing") && bookingDetail.includes("Mark Completed"));

const tours = read("src/app/supplier/tours/page.tsx");
const tourCreate = read("src/app/supplier/tours/create/page.tsx");
const tourEdit = read("src/app/supplier/tours/[id]/edit/page.tsx");
const preview = read("src/app/supplier/tours/[id]/preview/page.tsx");
check("tour cards use private supplier preview", tours.includes("/supplier/tours/${tour.id}/preview"));
check("tour list supports search and every publishing state", tours.includes("pending_approval") && tours.includes("rejected") && tours.includes("params.search = debouncedSearch"));
check("tour list surfaces submission errors", tours.includes("setActionError") && tours.includes("could not be submitted"));
check("tour cards display their cover media", tours.includes("banner_image") && tours.includes("mediaUrl(tour.banner_image)"));
check("tour creation has guided progress and review", tourCreate.includes("TourWorkspaceProgress") && tourCreate.includes("Review & Submit"));
check("tour edit retains all structured editing tabs", ["Overview", "Highlights", "Itinerary", "Inclusions", "Gallery", "Pricing", "Calendar"].every((tab) => tourEdit.includes(`"${tab}"`)));
check("tour edit links to private preview", tourEdit.includes("/preview") && tourEdit.includes("Preview"));
check(
  "admin and supplier tour builders use the same shared design system",
  tourCreate.includes("TourWorkspaceHeader") &&
    tourEdit.includes("TourWorkspaceHeader") &&
    tourEdit.includes("TourWorkspaceTabs") &&
    tourEdit.includes("TourWorkspaceContent") &&
    tourEdit.includes("TourWorkspaceStepFooter"),
);
check(
  "supplier tour sections support explicit step completion",
  tourEdit.includes("completedSteps") &&
    tourEdit.includes("completeAndNext") &&
    tourEdit.includes('router.push("/supplier/tours")'),
);
check(
  "supplier edit uses the complete shared tour details form",
  tourEdit.includes('role="supplier"') &&
    tourEdit.includes("TourFormPage") &&
    ["Currency", "Media", "Subcategories", "SEO"].every((section) => tourCreate.includes(section) || read("src/components/cms/TourFormPage.tsx").includes(section)),
);
const sharedTourForm = read("src/components/cms/TourFormPage.tsx");
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
  tourEdit.includes("initialData={tour ?? undefined}") &&
    sharedTourForm.includes("if (!tourId || initialData) return"),
);
check("preview uses backend tour field names", preview.includes("price_start_per_person") && preview.includes("banner_image"));
check("preview loads structured tour sections", preview.includes("/highlights") && preview.includes("/inclusions") && preview.includes("/exclusions"));

const messages = read("src/app/supplier/messages/page.tsx");
check("supplier message history is connected", messages.includes('api.get("/supplier/messages"'));
check("supplier support compose is connected", messages.includes('api.post("/supplier/messages"'));

const payouts = read("src/app/supplier/payouts/page.tsx");
check("payout payload omits unsupported bank fields", !payouts.includes("bank_name:") && !payouts.includes("account_number:"));
check("payout requests validate the available ledger balance", payouts.includes("availableBalance") && payouts.includes("cannot exceed the available balance"));

const documents = read("src/components/supplier/profile/DocumentsTab.tsx");
check("supplier documents expose retryable loading failures", documents.includes("Documents could not be loaded") && documents.includes("Retry"));

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
  supplierInnerPages.every((page) => page.includes("SupplierPageHeader") || page.includes("TourWorkspaceHeader")),
);

console.log(`\nSupplier flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
