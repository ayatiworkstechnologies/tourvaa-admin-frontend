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

const create = read("src/app/agent/bookings/create/page.tsx");
check("booking picker preloads published tours without requiring search", create.includes("search: debouncedTourSearch || undefined") && create.includes("limit: 20"));
check("booking picker handles the public tour response shape", create.includes("res.data?.items") && create.includes("res.data?.data?.items"));
check("booking picker shows tour images with a local fallback", create.includes("banner_image") && create.includes("tour-card-fallback.jpg"));
check("booking picker shows destination, category, description, duration, and price", ["city_name", "country_name", "category_name", "short_description", "number_of_days", "price_start_per_person"].every((field) => create.includes(field)));
check("booking picker displays loading, empty, and failure states", create.includes("Loading published tours") && create.includes("No published tours match") && create.includes("Tours could not be loaded"));
check("booking includes authenticated agent id", create.includes("agent_id: agentId"));
check("booking uses backend traveller counts", create.includes("no_of_adults: adults") && create.includes("no_of_children: children"));
check("booking is explicitly agent sourced", create.includes('booking_source: "agent"'));
check("customer preselection is loaded", create.includes("prefillCustomerId") && create.includes("/customers/${prefillCustomerId}"));
check("tour preselection uses published detail", create.includes("/public/tours/${prefillTourId}"));

const customers = read("src/app/agent/customers/page.tsx");
check("agent customer create supplies full_name", customers.includes("full_name: fullName"));
check("agent customer phone is normalized", customers.includes("combinePhone"));
check("new customer continues to first booking", customers.includes("/agent/bookings/create?customer_id="));

const bookings = read("src/app/agent/bookings/page.tsx");
check("booking filter uses booking_status", bookings.includes("params.booking_status = statusFilter"));
check("new pending supplier statuses are represented", bookings.includes("pending_supplier_acceptance"));

const detail = read("src/app/agent/bookings/[id]/page.tsx");
check("detail uses serialized traveller counts", detail.includes("booking.no_of_adults") && detail.includes("booking.no_of_children"));
check("detail exposes supplier decision", detail.includes("Supplier Acceptance"));

const invoices = read("src/app/agent/invoices/page.tsx");
check("invoices use backend amount and date fields", invoices.includes("inv.total_amount") && invoices.includes("inv.created_at"));
check("invoice booking links use booking_id", invoices.includes("/agent/bookings/${inv.booking_id}"));

const messages = read("src/app/agent/messages/page.tsx");
check("agent message history is connected", messages.includes('api.get("/agent/messages"'));
check("agent support compose is connected", messages.includes('api.post("/agent/messages"'));

console.log(`\nAgent flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
