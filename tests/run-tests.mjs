import sourceTests from "./source.test.mjs";
import serviceTests from "./services.test.mjs";

const suites = [
  ["source", sourceTests],
  ["services", serviceTests],
];

let failed = 0;

for (const [suiteName, tests] of suites) {
  console.log(`\n== ${suiteName} ==`);
  for (const item of tests) {
    try {
      await item.run();
      console.log(`PASS ${item.name}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${item.name}`);
      console.error(error?.stack || error);
    }
  }
}

if (failed > 0) {
  console.error(`\n${failed} frontend test(s) failed.`);
  process.exit(1);
}

console.log("\nAll frontend tests passed.");
