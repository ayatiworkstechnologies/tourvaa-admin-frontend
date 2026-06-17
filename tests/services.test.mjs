import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function operationsServiceExposesReviewWorkflows() {
  const content = read("lib/services/operationsService.ts");
  for (const symbol of [
    "listReviewRecords",
    "getReviewRecord",
    "approveReviewRecord",
    "rejectReviewRecord",
    "partialApproveReviewRecord",
    "updateCommercialValue",
    "updateAffiliateApiLink",
  ]) {
    assert.match(content, new RegExp(`export .*${symbol}|export async function ${symbol}`));
  }
}

function cmsServiceExposesCrudWorkflows() {
  const content = read("lib/services/cmsService.ts");
  for (const symbol of ["listCms", "getCms", "createCms", "updateCms", "updateCmsStatus"]) {
    assert.match(content, new RegExp(`export .*${symbol}|export async function ${symbol}`));
  }
}

function reviewPagesUsePermissionAwareModuleWrapper() {
  const listPage = read("components/operations/ReviewListPage.tsx");
  const detailPage = read("components/operations/ReviewDetailPage.tsx");
  assert.match(listPage, /ModuleWrapper/);
  assert.match(listPage, /requiredPermission/);
  assert.match(detailPage, /ModuleWrapper/);
  assert.match(detailPage, /requiredPermission/);
}

function customerServiceExposesCustomerWorkflows() {
  const content = read("lib/services/customerService.ts");
  for (const symbol of [
    "getCustomers",
    "getCustomerDetail",
    "updateCustomerStatus",
    "blockCustomer",
    "unblockCustomer",
    "resetCustomerPassword",
    "getCustomerBookings",
    "getCustomerPayments",
    "getCustomerCommunications",
    "sendCustomerMessage",
  ]) {
    assert.match(content, new RegExp(`export .*${symbol}|export async function ${symbol}`));
  }
}

function noApiV1ReferenceRemains() {
  const files = [
    "lib/api.ts",
    "lib/services/customerService.ts",
    "lib/services/operationsService.ts",
    "lib/services/cmsService.ts",
  ];
  for (const file of files) {
    assert.doesNotMatch(read(file), /\/api\/v1/);
  }
}

export default [
  { name: "operations service exposes review workflows", run: operationsServiceExposesReviewWorkflows },
  { name: "cms service exposes CRUD workflows", run: cmsServiceExposesCrudWorkflows },
  { name: "review pages use permission-aware module wrapper", run: reviewPagesUsePermissionAwareModuleWrapper },
  { name: "customer service exposes customer workflows", run: customerServiceExposesCustomerWorkflows },
  { name: "no /api/v1 reference remains in services", run: noApiV1ReferenceRemains },
];
