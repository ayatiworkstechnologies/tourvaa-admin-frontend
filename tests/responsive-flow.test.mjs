/** Responsive layout contracts shared by public pages and every portal. */
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

console.log("\n=== Responsive Frontend Flow ===\n");

const globals = read("src/app/globals.css");
check("document clips accidental horizontal overflow", globals.includes("overflow-x: clip"));
check("mobile controls avoid automatic browser zoom", globals.includes("@media (max-width: 639px)") && globals.includes("font-size: 16px"));
check("dynamic viewport height is supported", globals.includes("min-height: 100dvh"));

const adminLayout = read("src/components/admin/AdminLayout.tsx");
check("admin content can shrink without horizontal overflow", adminLayout.includes("min-w-0") && adminLayout.includes("overflow-x-hidden"));
check("admin mobile drawer fits narrow screens", adminLayout.includes("86vw"));

const publicHeader = read("src/components/public/PublicHeader.tsx");
check("public marketing navigation waits for desktop width", publicHeader.includes("lg:flex"));
check("public header preserves a shrinkable flex row", publicHeader.includes("max-w-[1480px] min-w-0"));

const customerHeader = read("src/components/customer/CustomerPortalHeader.tsx");
check("customer header has compact mobile height", customerHeader.includes("h-20") && customerHeader.includes("sm:h-[92px]"));
check("customer profile menu is viewport bounded", customerHeader.includes("calc(100vw-1.5rem)"));

const dataTable = read("src/components/ui/DataTable.tsx");
check("tables scroll horizontally on narrow screens", dataTable.includes("overflow-x-auto") && dataTable.includes("-webkit-overflow-scrolling:touch"));
check("pagination controls use the full mobile width", dataTable.includes("w-full items-center") && dataTable.includes("sm:w-auto"));

for (const path of [
  "src/components/operations/ActionModal.tsx",
  "src/components/ui/ConfirmDialog.tsx",
  "src/components/bookings/BookingPaymentModal.tsx",
  "src/components/customers/SendCustomerMessageModal.tsx",
  "src/components/common/DynamicModulePage.tsx",
]) {
  const modal = read(path);
  check(`${path} stays inside short mobile viewports`, modal.includes("100dvh") && modal.includes("overflow-y-auto"));
}

const customerDashboard = read("src/app/customer/dashboard/page.tsx");
check("customer trip requests reflow on mobile", customerDashboard.includes("grid-cols-[64px_minmax(0,1fr)]") && customerDashboard.includes("sm:grid-cols-[76px_minmax(0,1fr)_auto]"));
check("customer payment status reflows below its summary", customerDashboard.includes("col-start-2") && customerDashboard.includes("sm:col-start-auto"));

console.log(`\nResponsive flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
