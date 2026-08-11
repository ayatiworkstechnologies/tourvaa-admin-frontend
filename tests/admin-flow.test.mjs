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
const userDetail = read("src/app/admin/users/[id]/page.tsx");
check("admin user reactivation uses its dedicated endpoint", userDetail.includes("`/users/${id}/reactivate`"));
check("admin user activation errors remain visible", userDetail.includes("getApiErrorMessage(error)"));
check("reactivation control is not silently disabled by stale verification data", !userDetail.includes("disabled={saving || !user.password_created || !user.email_verified}"));

const documentService = read("src/lib/api/services/privateDocumentService.ts");
check("private documents are fetched with authenticated API client", documentService.includes("/private-documents/${ownerType}/${documentId}"));
check("private documents are opened from authenticated blobs", documentService.includes('responseType: "blob"') && documentService.includes("createObjectURL"));

const suppliers = read("src/app/admin/suppliers/[id]/page.tsx");
const agents = read("src/app/admin/agents/[id]/page.tsx");
const operationsService = read("src/lib/api/services/operationsService.ts");
const nextConfig = read("next.config.ts");
const countrySettings = read("src/app/admin/settings/countries/page.tsx");
const geoHooks = read("src/hooks/useGeo.ts");
const reviewList = read("src/components/operations/ReviewListPage.tsx");
const actionModal = read("src/components/operations/ActionModal.tsx");
check(
  "admin can create suppliers, agents, and affiliates through slash-safe proxy routes",
  operationsService.includes('api.post<{ data: ReviewRecord }>(`/${module}/`, payload)') &&
    nextConfig.includes('["suppliers", "agents", "affiliates"]') &&
    nextConfig.includes('destination: `${apiProxyTarget}/api/${module}/`'),
);
check(
  "add-city loads states from the modal country and normalizes an optional state",
  countrySettings.includes("states: formStates") &&
    countrySettings.includes("setFormCountryId(Number(nextForm.country_id) || null)") &&
    countrySettings.includes("state_id: nextForm.state_id ? Number(nextForm.state_id) : null"),
);
check(
  "city controls use city permissions and newly added states invalidate geo cache",
  countrySettings.includes('hasPermission("cities.create")') &&
    countrySettings.includes('hasPermission("cities.edit")') &&
    countrySettings.includes("invalidateGeoStates(Number(form.country_id) || undefined)") &&
    geoHooks.includes("export function invalidateGeoStates"),
);
check(
  "admin supplier creation collects login details and displays a numeric id",
  reviewList.includes('{ name: "supplier_name", label: "Supplier Name", required: true }') &&
    reviewList.includes('{ name: "email", label: "Email", type: "email", required: true }') &&
    reviewList.includes('{ name: "password", label: "Password", type: "password", required: true }') &&
    reviewList.includes('render: (row) => row.id'),
);
check(
  "admin agent and affiliate creation collect login details and display numeric ids",
  reviewList.includes('{ name: "agent_name", label: "Agent Name", required: true }') &&
    reviewList.includes('{ name: "name", label: "Affiliate Name", required: true }') &&
    (reviewList.match(/\{ name: "email", label: "Email", type: "email", required: true \}/g) || []).length >= 3 &&
    (reviewList.match(/\{ name: "password", label: "Password", type: "password", required: true \}/g) || []).length >= 3 &&
    reviewList.includes('render: (row) => row.id'),
);
check(
  "admin registration passwords can be shown and hidden",
  actionModal.includes('field.type === "password"') &&
    actionModal.includes('`Show ${field.label}`') &&
    actionModal.includes('`Hide ${field.label}`') &&
    actionModal.includes("visiblePasswords"),
);
check("supplier commission banner omits the misleading approve request action", !suppliers.includes("Approve request"));
check("supplier document review uses private document service", suppliers.includes('openPrivateDocument("supplier"'));
check(
  "supplier document and vehicle filenames stay within their cards",
  suppliers.includes('className="mt-1 break-all text-sm font-semibold text-dash-text"') &&
    suppliers.includes('title={valueText(doc.document_name || doc.document_type)}') &&
    suppliers.match(/className="min-w-0 rounded-xl border border-dash-border p-4"/g)?.length === 2,
);
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
// Admin tour create/edit are thin wrappers (create/page.tsx, TourEditPage.tsx)
// around the shared TourWizard component, which owns the workspace header,
// tabs, content, and stepper - assertions below target TourWizard.tsx.
const tourWizard = read("src/components/tours/TourWizard.tsx");
check(
  "admin tour create and edit share the upgraded workspace header",
  tourCreateForm.includes("TourWorkspaceHeader") &&
    tourWizard.includes("TourWorkspaceHeader") &&
    tourWorkspace.includes("Admin Tour Workspace"),
);
check(
  "admin tour creation shows guided completion stages",
  tourWizard.includes('label: "Basic Details"') &&
    tourWizard.includes('label: "Location & Category"') &&
    tourWizard.includes('label: "Review & Submit"'),
);
check(
  "admin tour editor uses the common tab and content-card workflow",
  tourWizard.includes("TourWorkspaceTabs") &&
    tourWizard.includes("TourWorkspaceContent") &&
    tourWizard.includes("TourWorkspaceStepper") &&
    ["Itinerary", "Pricing", "Calendar", "Discounts"].every((label) =>
      tourWizard.includes(`label: "${label}"`)
    ),
);
check(
  "admin tour sections support explicit step completion",
  tourWizard.includes("visitedSteps") &&
    tourWizard.includes("selectPrimaryStep") &&
    tourWizard.includes('basePath = isSupplier ? "/supplier/tours" : "/admin/tours"'),
);
check("embedded edit form avoids a duplicate workspace header", tourWizard.includes("tourId={tourId} embedded"));

console.log(`\nAdmin flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
