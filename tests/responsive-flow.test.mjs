/** Responsive layout contracts shared by public pages and every portal. */
import { existsSync, readFileSync } from "fs";
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
check("public header preserves a shrinkable flex row", publicHeader.includes("max-w-[1440px] min-w-0"));
check("desktop header exposes account and trip tools navigation", publicHeader.includes('aria-label="Account and trip tools"'));

const supplierPortal = read("src/app/supplier-portal/page.tsx");
const agentPortal = read("src/app/agent-portal/page.tsx");
const partnerMotion = read("src/components/public/PartnerPortalLanding.module.css");
check("partner landing pages use optimized local hero images", [supplierPortal, agentPortal].every((source) => source.includes('from "next/image"') && source.includes("<Image") && source.includes("fill") && source.includes("priority")) && existsSync(resolve(root, "public/images/supplier-portal-hero.png")) && existsSync(resolve(root, "public/images/agent-portal-hero.png")));
check("partner landing heroes adapt across mobile and desktop", [supplierPortal, agentPortal].every((source) => source.includes("sm:pt-16") && source.includes("lg:grid-cols") && source.includes("lg:pt-20")));
check("partner landing motion respects reduced-motion preferences", partnerMotion.includes("@media (prefers-reduced-motion: reduce)") && partnerMotion.includes("animation: none"));

const portalHeader = read("src/components/layout/Header.tsx");
// The Elfsight language widget is fixed in the top-right and can appear on
// partner pages. Reserve a lane so it cannot cover the profile trigger.
check("portal header reserves a language widget lane", portalHeader.includes("pr-[132px]") && portalHeader.includes("sm:pr-[140px]"));

const customerHeader = read("src/components/customer/CustomerPortalHeader.tsx");
check("customer header has compact mobile height", customerHeader.includes("h-20") && customerHeader.includes("sm:h-[84px]"));
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
// The bookings list is a <table> (not a card grid) - like DataTable.tsx
// elsewhere in this file, it reflows on narrow screens via horizontal
// scroll rather than a stacking grid.
// The customer dashboard "My Bookings" list is no longer a <table>: it was
// rebuilt as a card list that stacks vertically on narrow screens and becomes a
// row on sm+, with min-w-0 guards so long tour names truncate instead of forcing
// horizontal overflow. A table-scroll assertion no longer applies.
check(
  "customer bookings list stacks on narrow screens without horizontal overflow",
  customerDashboard.includes('className="flex flex-col gap-4 p-3 sm:flex-row') &&
    customerDashboard.includes("min-w-0") &&
    !customerDashboard.includes("<table"),
);

console.log(`\nResponsive flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
