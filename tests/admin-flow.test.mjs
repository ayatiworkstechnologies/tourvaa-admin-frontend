/** Admin console journey contract checks. No server required. */
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

console.log("\n=== Admin Console Flow ===\n");

const guard = read("src/components/admin/AdminRouteGuard.tsx");
check(
  "admin routes accept admin, super-admin, and sub-admin dashboard types",
  guard.includes('["admin", "super_admin", "sub_admin"]') &&
    guard.includes("ADMIN_DASHBOARD_TYPES.has(dashboard.dashboard_type)"),
);
check("portal users return to their own dashboard", guard.includes("getDashboardPath"));
check("unauthenticated admin routes use dedicated admin login", guard.includes('router.replace("/admin/login")'));
const adminIndex = read("src/app/admin/page.tsx");
check("admin root opens the dedicated admin login", adminIndex.includes('redirect("/admin/login")'));
const adminLogin = read("src/app/admin/login/page.tsx");
check("admin login accepts administration dashboard types only", adminLogin.includes("requiredDashboardTypes") && adminLogin.includes('"super_admin"') && adminLogin.includes('"sub_admin"'));

const auth = read("src/providers/AuthProvider.tsx");
check("global auth separates admin and portal login routes", auth.includes('pathname.startsWith("/admin") ? "/admin/login" : "/login"'));

const users = read("src/app/admin/users/page.tsx");
check("admin-created users retain normalized phone", users.includes("createUser({ ...form, phone })"));
check("admin user password validation matches backend strength", users.includes("(?=.*[^A-Za-z0-9])"));

const documentService = read("src/lib/api/services/privateDocumentService.ts");
check("private documents are fetched with authenticated API client", documentService.includes("/private-documents/${ownerType}/${documentId}"));
check("private documents are opened from authenticated blobs", documentService.includes('responseType: "blob"') && documentService.includes("createObjectURL"));

const suppliers = read("src/app/admin/suppliers/[id]/page.tsx");
const agents = read("src/app/admin/agents/[id]/page.tsx");
check("supplier document review uses private document service", suppliers.includes('openPrivateDocument("supplier"'));
check("agent document review uses private document service", agents.includes('openPrivateDocument("agent"'));
check("admin can approve and reject individual agent documents", agents.includes("reviewAgentDocument") && agents.includes("Reject agent document"));

const bookingService = read("src/lib/api/services/bookingService.ts");
check("admin booking create contract uses backend traveller counts", bookingService.includes("no_of_adults: number") && bookingService.includes("no_of_children?: number"));
check("booking filters use backend booking_status", bookingService.includes("booking_status?: string"));

const bookingDetail = read("src/app/admin/bookings/[id]/page.tsx");
check("admin booking detail renders serialized add-on snapshots", bookingDetail.includes("activity_name_snapshot") && bookingDetail.includes("accommodation_name_snapshot") && bookingDetail.includes("extension_name_snapshot"));
check("admin booking detail exposes all note channels", bookingDetail.includes("booking.customer_notes") && bookingDetail.includes("booking.admin_notes"));

const payments = read("src/lib/api/services/paymentService.ts");
check("payment operations use capture, void, refund, and status contracts", ["/capture", "/void", "/refund", "/status"].every((path) => payments.includes(path)));

const invoices = read("src/lib/api/services/invoiceService.ts");
check("invoice downloads carry authorization through blob requests", invoices.includes('responseType: "blob"'));

const dashboard = read("src/app/admin/dashboard/page.tsx");
check("dashboard approval actions match supplier and agent endpoints", dashboard.includes("/suppliers/${id}/approve") && dashboard.includes("/agents/${id}/approve"));

const tourApproval = read("src/app/admin/tour-approval/page.tsx");
check("tour review uses version approval endpoints", tourApproval.includes("/tours/pending-approval") && tourApproval.includes("/versions/${v.id}/approve"));
check("tour review guard matches backend publish permission", tourApproval.includes('requiredPermission="tours.publish"'));

const refunds = read("src/app/admin/refunds/page.tsx");
check("refund screen uses a permission accepted by cancellation APIs", refunds.includes('requiredPermission="bookings.view"'));

const navigation = read("src/lib/constants/navigation.ts");
check("admin navigation exposes tour approvals", navigation.includes('href: "/admin/tour-approval"'));
check("admin navigation exposes cancellations and refunds", navigation.includes('href: "/admin/refunds"'));

const tourWorkspace = read("src/components/tours/TourWorkspace.tsx");
const tourCreateForm = read("src/components/cms/TourFormPage.tsx");
const tourEditor = read("src/components/tours/TourEditPage.tsx");
check(
  "admin tour create and edit share the upgraded workspace header",
  tourCreateForm.includes("TourWorkspaceHeader") &&
    tourEditor.includes("TourWorkspaceHeader") &&
    tourWorkspace.includes("Admin Tour Workspace"),
);
check(
  "admin tour creation shows guided completion stages",
  tourCreateForm.includes("Location & Owner") &&
    tourCreateForm.includes("Content & Media") &&
    tourCreateForm.includes("SEO & Publish"),
);
check(
  "admin tour editor uses the common tab and content-card workflow",
  tourEditor.includes("TourWorkspaceTabs") &&
    tourEditor.includes("TourWorkspaceContent") &&
    tourEditor.includes("TourWorkspaceStepFooter") &&
    ["Itinerary", "Gallery", "Pricing", "Calendar", "Discounts"].every((label) =>
      tourEditor.includes(`label: "${label}"`)
    ),
);
check(
  "admin tour sections support explicit step completion",
  tourEditor.includes("completedSteps") &&
    tourEditor.includes("completeAndNext") &&
    tourEditor.includes('router.push("/admin/tours")'),
);
check("embedded edit form avoids a duplicate workspace header", tourEditor.includes("tourId={tourId} embedded"));

console.log(`\nAdmin flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
