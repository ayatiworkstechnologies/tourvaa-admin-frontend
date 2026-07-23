/** Cross-portal and affiliate journey contract checks. No server required. */
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

console.log("\n=== Overall Frontend Flow ===\n");

const validators = read("src/lib/utils/validators.ts");
check("shared password validator matches backend special-character rule", validators.includes("/[^A-Za-z0-9]/.test(value)"));
check("shared password guidance describes the full backend rule", validators.includes("a special character"));

const login = read("src/app/(public)/login/page.tsx");
check("login preserves customer portal redirects", login.includes('customer: "/customer/"'));
check("login preserves supplier portal redirects", login.includes('supplier: "/supplier/"'));
check("login preserves agent portal redirects", login.includes('"agent-reseller": "/agent/"'));
check("login preserves affiliate portal redirects", login.includes('affiliate: "/affiliate/"'));
check("login rejects redirects outside the authenticated role portal", login.includes("requested.startsWith(prefix)"));

const chat = read("src/components/public/ChatWidget.tsx");
check("chat booking uses the customer portal endpoint", chat.includes('api.post("/customer/bookings"'));
check("chat no longer calls the nonexistent customers-me booking route", !chat.includes("/customers/me/bookings"));
check("chat login guidance points to the frontend login page", chat.includes("Open /login"));

const tracker = read("src/components/public/AffiliateReferralTracker.tsx");
check("public pages capture affiliate referral codes", tracker.includes('get("ref")'));
check("affiliate clicks use the backend public tracking endpoint", tracker.includes("/api/affiliates/track/${encodeURIComponent(refCode)}"));
check("duplicate referral clicks are suppressed per browser session", tracker.includes("sessionStorage"));

for (const route of ["forgot-password", "reset-password"]) {
  const layout = read(`src/app/${route}/layout.tsx`);
  check(`${route} uses the shared public header layout`, layout.includes("<PublicLayout>"));
  check(`${route} clears the fixed public header`, layout.includes('className="pt-20"'));
}

const referralLinks = read("src/app/affiliate/referral-links/page.tsx");
check("affiliate links use their configured destination", referralLinks.includes("new URL(link.destination_url"));
check("affiliate links retain their referral code", referralLinks.includes('url.searchParams.set("ref", link.ref_code)'));
check("unsupported referral update endpoint is not called", !referralLinks.includes("api.patch"));
check("unsupported referral delete endpoint is not called", !referralLinks.includes("api.delete"));

const affiliateDashboard = read("src/app/affiliate/dashboard/page.tsx");
check("affiliate dashboard uses commission summary API", affiliateDashboard.includes("/commissions`"));
check("affiliate dashboard uses serialized click totals", affiliateDashboard.includes("link.total_clicks"));
check("affiliate dashboard uses converted_at timestamp", affiliateDashboard.includes("c.converted_at"));

for (const page of ["dashboard", "referral-links", "clicks", "conversions", "commissions", "payouts", "profile"]) {
  const source = read(`src/app/affiliate/${page}/page.tsx`);
  check(`${page} requires the provisioned affiliate id`, source.includes("dashboard?.user?.affiliate_id ?? null"));
  check(`${page} does not fall back to the unrelated user id`, !source.includes("dashboard?.user?.id"));
}

const profile = read("src/app/affiliate/profile/page.tsx");
check("affiliate profile update uses backend PUT contract", profile.includes("api.put(`/affiliates/${affiliateId}`"));
check("affiliate profile sends supported website_url field", profile.includes("website_url"));
check("affiliate self-edit is disabled when backend permission is unavailable", profile.includes('hasPermission("affiliates.approve")'));

const affiliateJoin = read("src/app/join/affiliate/page.tsx");
check("affiliate application no longer reports a fake API submission", affiliateJoin.includes("mailto:hello@tourvaa.com"));
check("affiliate application clearly requires the user to send the email", affiliateJoin.includes("Complete and send the email"));

const imageFormats = read("src/lib/uploads/imageFormats.ts");
const adminAssetUpload = read("src/components/operations/AdminAssetUpload.tsx");
const profileImageUpload = read("src/components/ui/ProfileImageUpload.tsx");
const supplierDocuments = read("src/components/supplier/profile/DocumentsTab.tsx");
const supplierVehicles = read("src/components/supplier/profile/VehiclesTab.tsx");
const agentDocuments = read("src/components/agent/profile/VerificationDocumentsTab.tsx");
check("shared image uploads accept AVIF", imageFormats.includes("image/avif") && imageFormats.includes(".avif"));
check("admin asset uploads preview and explain AVIF", adminAssetUpload.includes("avif") && adminAssetUpload.includes("IMAGE_AND_PDF_FORMAT_LABEL"));
check("profile image uploads use shared AVIF formats", profileImageUpload.includes("IMAGE_ACCEPT") && profileImageUpload.includes("IMAGE_FORMAT_LABEL"));
check("supplier and agent uploads share AVIF acceptance", [supplierDocuments, supplierVehicles, agentDocuments].every((source) => source.includes("imageFormats")));

const notificationInbox = read("src/components/ui/NotificationInbox.tsx");
const notificationAdmin = read("src/app/admin/notifications/page.tsx");
const notificationWorker = read("public/sw.js");
check("header notifications load once without polling or duplicate requests", !notificationInbox.includes("setInterval") && notificationInbox.includes("inboxCache") && notificationInbox.includes("inboxRequests"));
check("admin notifications no longer poll on a timer", !notificationAdmin.includes("setInterval") && !notificationAdmin.includes("POLL_INTERVAL_MS"));
check("notification refresh is driven by explicit app and push events", [notificationInbox, notificationAdmin].every((source) => source.includes("NOTIFICATION_REFRESH_EVENT") && source.includes("isNotificationPushMessage")));
check("push worker tells open pages when a notification arrives", notificationWorker.includes("client.postMessage") && notificationWorker.includes("tourvaa:notification-received"));

console.log(`\nOverall flow: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
