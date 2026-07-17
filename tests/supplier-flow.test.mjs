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

const bookingDetail = read("src/app/supplier/bookings/[id]/page.tsx");
check("acceptance waits for payment readiness", bookingDetail.includes("paymentReady") && bookingDetail.includes("isAwaitingPayment"));
check("decline includes a required reason", bookingDetail.includes('{ reason: declineReason }'));
check("supplier acceptance status is displayed", bookingDetail.includes("Supplier Decision"));
check("accept endpoint is connected", bookingDetail.includes("/accept"));
check("decline endpoint is connected", bookingDetail.includes("/decline"));

const tours = read("src/app/supplier/tours/page.tsx");
const preview = read("src/app/supplier/tours/[id]/preview/page.tsx");
check("tour cards use private supplier preview", tours.includes("/supplier/tours/${tour.id}/preview"));
check("preview uses backend tour field names", preview.includes("price_start_per_person") && preview.includes("banner_image"));
check("preview loads structured tour sections", preview.includes("/highlights") && preview.includes("/inclusions") && preview.includes("/exclusions"));

const messages = read("src/app/supplier/messages/page.tsx");
check("supplier message history is connected", messages.includes('api.get("/supplier/messages"'));
check("supplier support compose is connected", messages.includes('api.post("/supplier/messages"'));

const payouts = read("src/app/supplier/payouts/page.tsx");
check("payout payload omits unsupported bank fields", !payouts.includes("bank_name:") && !payouts.includes("account_number:"));

console.log(`\nSupplier flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
