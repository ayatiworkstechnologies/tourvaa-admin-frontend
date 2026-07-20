/** Metadata coverage checks. No server required. */
import { existsSync, readFileSync, readdirSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = resolve(root, "src/app");
const metadataSource = readFileSync(resolve(root, "src/lib/seo/pageMetadata.ts"), "utf8");
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

function findPages(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? findPages(path) : entry.name === "page.tsx" ? [path] : [];
  });
}

function routeFor(page) {
  const route = relative(appRoot, dirname(page))
    .replaceAll("\\", "/")
    .split("/")
    .filter((segment) => !/^\(.+\)$/.test(segment))
    .join("/");
  return route ? `/${route}` : "/";
}

console.log("\n=== Page Metadata Coverage ===\n");

const pages = findPages(appRoot);
const missingLayouts = pages.filter((page) => !existsSync(join(dirname(page), "layout.tsx")));
const missingDefinitions = pages
  .map(routeFor)
  .filter((route) => !metadataSource.includes(`"${route}":`));

check(`all ${pages.length} pages have a metadata layout`, missingLayouts.length === 0);
check("every page route has a title and description definition", missingDefinitions.length === 0);
check("public metadata includes canonical URLs", metadataSource.includes("alternates:") && metadataSource.includes("canonicalPath"));
check("public metadata includes Open Graph tags", metadataSource.includes("openGraph:") && metadataSource.includes("siteName: SITE_NAME"));
check("public metadata includes Twitter cards", metadataSource.includes("twitter:") && metadataSource.includes('card: "summary_large_image"'));
check("private pages are noindex and nofollow", metadataSource.includes("index: false, follow: false"));
check("robots excludes authenticated portals", ["/admin/", "/agent/", "/supplier/", "/customer/", "/affiliate/"].every((route) => readFileSync(resolve(appRoot, "robots.ts"), "utf8").includes(route)));
check("sitemap includes public discovery pages", ["/tours", "/destinations", "/blogs", "/about"].every((route) => readFileSync(resolve(appRoot, "sitemap.ts"), "utf8").includes(route)));

if (missingLayouts.length) console.error("  Missing layouts:", missingLayouts.map((path) => relative(root, path)));
if (missingDefinitions.length) console.error("  Missing definitions:", missingDefinitions);

console.log(`\nMetadata flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
