/**
 * Frontend test runner — executes all module test files sequentially.
 * Usage: node frontend/tests/run-tests.mjs
 */
import { spawnSync } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TEST_FILES = [
  "module-routes.test.mjs",
  "module-services.test.mjs",
  "module-permissions.test.mjs",
  "module-components.test.mjs",
  "customer-flow.test.mjs",
  "supplier-flow.test.mjs",
  "agent-flow.test.mjs",
  "admin-flow.test.mjs",
  "overall-flow.test.mjs",
];

let totalPassed = 0;
let totalFailed = 0;
const suiteResults = [];

for (const file of TEST_FILES) {
  const filePath = resolve(__dirname, file);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running: ${file}`);
  console.log("=".repeat(60));

  const result = spawnSync(process.execPath, [filePath], { stdio: "inherit" });

  const success = result.status === 0;
  suiteResults.push({ file, success });
  if (success) totalPassed++;
  else totalFailed++;
}

console.log(`\n${"=".repeat(60)}`);
console.log("FRONTEND TEST SUMMARY");
console.log("=".repeat(60));
for (const { file, success } of suiteResults) {
  console.log(`  ${success ? "✓" : "✗"} ${file}`);
}
console.log(`\nSuites: ${totalPassed} passed, ${totalFailed} failed`);
if (totalFailed > 0) process.exit(1);
