import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredRoutes = [
  "app/login/page.tsx",
  "app/dashboard/page.tsx",
  "app/users/page.tsx",
  "app/customers/page.tsx",
  "app/customers/[id]/page.tsx",
  "app/suppliers/page.tsx",
  "app/suppliers/[id]/page.tsx",
  "app/agents/page.tsx",
  "app/agents/[id]/page.tsx",
  "app/affiliates/page.tsx",
  "app/affiliates/[id]/page.tsx",
  "app/settings/countries/page.tsx",
  "app/settings/cities/page.tsx",
  "app/settings/payment/page.tsx",
  "app/settings/api/page.tsx",
  "app/tours/page.tsx",
  "app/tours/create/page.tsx",
  "app/tours/[id]/edit/page.tsx",
  "app/tours/categories/page.tsx",
  "app/tours/subcategories/page.tsx",
];

const sharedFiles = [
  "components/operations/ActionModal.tsx",
  "components/operations/AdminAssetUpload.tsx",
  "components/operations/ReviewDetailPage.tsx",
  "components/operations/ReviewListPage.tsx",
  "components/operations/StatusBadge.tsx",
  "components/cms/CmsCrudPage.tsx",
  "components/cms/TourFormPage.tsx",
  "components/customers/CustomerTable.tsx",
  "components/customers/CustomerFilters.tsx",
  "components/customers/CustomerProfileCard.tsx",
  "components/customers/CustomerBookingHistory.tsx",
  "components/customers/CustomerPaymentHistory.tsx",
  "components/customers/CustomerCommunicationHistory.tsx",
  "components/customers/CustomerActionButtons.tsx",
  "components/customers/SendCustomerMessageModal.tsx",
  "lib/services/operationsService.ts",
  "lib/services/cmsService.ts",
  "lib/services/customerService.ts",
  "config/page-permissions.ts",
];

const permissionRoutes = [
  "/suppliers",
  "/customers",
  "/customers/[id]",
  "/agents",
  "/affiliates",
  "/settings/countries",
  "/settings/cities",
  "/settings/payment",
  "/settings/api",
  "/tours",
  "/tours/categories",
  "/tours/subcategories",
  "/tours/create",
  "/tours/[id]/edit",
];

function fileExists(relativePath) {
  return statSync(join(root, relativePath)).isFile();
}

function requiredAppRoutesExist() {
  for (const route of requiredRoutes) {
    assert.equal(fileExists(route), true, `${route} should exist`);
  }
}

function sharedModuleFilesExist() {
  for (const file of sharedFiles) {
    assert.equal(fileExists(file), true, `${file} should exist`);
  }
}

function newAdminPagePermissionsAreRegistered() {
  const content = readFileSync(join(root, "config/page-permissions.ts"), "utf8");
  for (const route of permissionRoutes) {
    assert.match(content, new RegExp(`["']${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`));
  }
}

function unitTestDependenciesAreNotReintroduced() {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  for (const name of ["vitest", "jsdom", "@testing-library/react", "@testing-library/jest-dom"]) {
    assert.equal(deps[name], undefined, `${name} should not be installed`);
  }
}

export default [
  { name: "required app routes exist", run: requiredAppRoutesExist },
  { name: "shared module files exist", run: sharedModuleFilesExist },
  { name: "new admin page permissions are registered", run: newAdminPagePermissionsAreRegistered },
  { name: "unit-test dependencies are not reintroduced", run: unitTestDependenciesAreNotReintroduced },
];
