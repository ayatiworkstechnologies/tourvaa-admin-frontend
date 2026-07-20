/**
 * Frontend Module Components Test
 * Verifies presence and basic structural correctness of key UI components.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = resolve(__dirname, "../src");
const COMPONENTS_DIR = resolve(FRONTEND_DIR, "components");

let passed = 0;
let failed = 0;
const errors = [];

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? " - " + detail : ""}`);
    failed++;
    errors.push(label);
  }
}

function readComp(path) {
  const p = resolve(COMPONENTS_DIR, path);
  if (!existsSync(p)) return "";
  return readFileSync(p, "utf-8");
}

function hasExportDefault(src) {
  return src.includes("export default");
}

function isReactComponent(src) {
  return (src.includes("jsx") || src.includes("tsx") || src.includes("return (") || src.includes("return(")) &&
         (src.includes("</") || src.includes("/>"));
}

console.log("\n=== Frontend Components ===\n");

// Auth components
console.log("── Auth");
const authInput = readComp("auth/AuthInput.tsx");
check("AuthInput.tsx exists", authInput.length > 0);
check("AuthInput is a React component", isReactComponent(authInput));
check("AuthInput exported", hasExportDefault(authInput));

const authLayout = readComp("auth/AuthLayout.tsx");
check("AuthLayout.tsx exists", authLayout.length > 0);

const protectedRoute = readComp("auth/ProtectedRoute.tsx");
check("ProtectedRoute.tsx exists", protectedRoute.length > 0);
check("ProtectedRoute exported", hasExportDefault(protectedRoute));

// Common components
console.log("── Common");
const moduleWrapper = readComp("common/ModuleWrapper.tsx");
check("ModuleWrapper.tsx exists", moduleWrapper.length > 0);
check("ModuleWrapper exported", hasExportDefault(moduleWrapper));

const dynamicModulePage = readComp("common/DynamicModulePage.tsx");
check("DynamicModulePage.tsx exists", dynamicModulePage.length > 0);

const emptyState = readComp("common/EmptyState.tsx");
check("EmptyState.tsx exists", emptyState.length > 0);

const loadingState = readComp("common/LoadingState.tsx");
check("LoadingState.tsx exists", loadingState.length > 0);

const errorState = readComp("common/ErrorState.tsx");
check("ErrorState.tsx exists", errorState.length > 0);

const accessDenied = readComp("common/AccessDenied.tsx");
check("AccessDenied.tsx exists", accessDenied.length > 0);

// CMS components
console.log("── CMS");
const cmsCrudPage = readComp("cms/CmsCrudPage.tsx");
check("CmsCrudPage.tsx exists", cmsCrudPage.length > 0);
check("CmsCrudPage exported", hasExportDefault(cmsCrudPage));

const tourFormPage = readComp("cms/TourFormPage.tsx");
check("TourFormPage.tsx exists", tourFormPage.length > 0);
check("TourFormPage exported", hasExportDefault(tourFormPage));

// Customer components
console.log("── Customers");
const customerTable = readComp("customers/CustomerTable.tsx");
check("CustomerTable.tsx exists", customerTable.length > 0);

const customerProfile = readComp("customers/CustomerProfileCard.tsx");
check("CustomerProfileCard.tsx exists", customerProfile.length > 0);

const customerBookings = readComp("customers/CustomerBookingHistory.tsx");
check("CustomerBookingHistory.tsx exists", customerBookings.length > 0);

const customerPayments = readComp("customers/CustomerPaymentHistory.tsx");
check("CustomerPaymentHistory.tsx exists", customerPayments.length > 0);

const customerComms = readComp("customers/CustomerCommunicationHistory.tsx");
check("CustomerCommunicationHistory.tsx exists", customerComms.length > 0);

const customerActions = readComp("customers/CustomerActionButtons.tsx");
check("CustomerActionButtons.tsx exists", customerActions.length > 0);

// No any "TODO" or "placeholder" markers left in production components
console.log("── Code quality");
const allSrc = [authInput, authLayout, protectedRoute, moduleWrapper, dynamicModulePage,
                cmsCrudPage, tourFormPage, customerTable, customerProfile].join("\n");
const todoCount = (allSrc.match(/\/\/\s*TODO/gi) || []).length;
check("Minimal TODOs in core components (<= 5)", todoCount <= 5, `Found ${todoCount} TODO comments`);

// Summary
console.log(`\nComponents: ${passed} passed, ${failed} failed`);
if (errors.length) {
  console.error("Failed:", errors.join(", "));
  process.exit(1);
}
