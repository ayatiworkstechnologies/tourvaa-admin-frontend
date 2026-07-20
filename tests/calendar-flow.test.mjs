/** Shared calendar UI contract checks. No server required. */
import { readFileSync, readdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(root, "src");
const read = (path) => readFileSync(resolve(root, path), "utf8");
let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) { console.log(`  ok ${label}`); passed++; }
  else { console.error(`  FAIL ${label}`); failed++; }
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.(tsx|ts)$/.test(entry.name) ? [path] : [];
  });
}

console.log("\n=== Calendar UI Flow ===\n");

const datePicker = read("src/components/ui/DatePicker.tsx");
const allSource = sourceFiles(sourceRoot).map((file) => readFileSync(file, "utf8")).join("\n");
const tourCalendar = read("src/components/tours/TourCalendarTab.tsx");
const discounts = `${read("src/components/tours/TourDiscountsTab.tsx")}\n${read("src/app/admin/discounts/page.tsx")}`;
const agentBooking = read("src/app/agent/bookings/create/page.tsx");

check("no native browser date inputs remain", !/type=["']date["']/.test(allSource));
check("calendar renders in a portal above clipped containers", datePicker.includes("createPortal") && datePicker.includes('className="fixed z-[200]'));
check("calendar supports minimum and maximum dates", datePicker.includes("minDate?: string") && datePicker.includes("maxDate?: string"));
check("calendar exposes disabled and availability states", datePicker.includes("disabledDates") && datePicker.includes("availableDates") && datePicker.includes("restrictToAvailableDates"));
check("calendar closes with Escape and outside click", datePicker.includes('event.key === "Escape"') && datePicker.includes("closeOutside"));
check("tour availability editor uses shared calendars", tourCalendar.includes("<DatePicker") && !tourCalendar.includes('type="date"'));
check("discount date ranges constrain start and end", discounts.includes("maxDate={editing.end_date") && discounts.includes("minDate={editing.start_date"));
check("agent booking restricts selection to live departures", agentBooking.includes("restrictToAvailableDates") && agentBooking.includes("availableDates.map"));

console.log(`\nCalendar flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
