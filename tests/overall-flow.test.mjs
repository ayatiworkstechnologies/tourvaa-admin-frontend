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

const publicHomepage = read("src/app/(public)/page.tsx");
check("homepage does not ship fictional tour or destination fallbacks", !publicHomepage.includes("DEMO_TRENDING_TOURS") && !publicHomepage.includes("DEMO_HANDPICKED_TOURS") && !publicHomepage.includes("DEMO_PLACES"));
check("homepage tour cards do not invent ratings or discounts", !publicHomepage.includes('"2,050 reviews"') && !publicHomepage.includes('"Save 25%"') && !publicHomepage.includes('?? 4.8'));
check("homepage has truthful empty collection states", publicHomepage.includes("No featured tours are available yet.") && publicHomepage.includes("No destinations are available yet."));
check("homepage fallbacks use bundled images", publicHomepage.includes('"/images/hero-1.jpg"') && !publicHomepage.includes("images.unsplash.com"));

const publicLayout = read("src/components/public/PublicLayout.tsx");
const publicSettings = read("src/providers/PublicSettingsProvider.tsx");
const publicFooter = read("src/components/public/PublicFooter.tsx");
const destinationsMegaPanel = read("src/components/public/DestinationsMegaPanel.tsx");
const portalPublicFooter = read("src/components/public/portal/PortalPublicFooter.tsx");
const publicContactSources = [
  "src/app/(public)/contact/page.tsx",
  "src/app/(public)/account-status/page.tsx",
  "src/app/(public)/cancellation-policy/page.tsx",
  "src/app/(public)/privacy-policy/page.tsx",
  "src/app/(public)/terms/page.tsx",
  "src/app/join/affiliate/page.tsx",
].map(read).join("\n");
check("public layout loads settings once for all public contact surfaces", publicLayout.includes("<PublicSettingsProvider>") && publicSettings.includes("fetchPublicSettings()"));
check("public contact surfaces use configured support details", publicContactSources.includes("usePublicSettings") || publicContactSources.includes("ConfiguredSupportEmail"));
check("public contact surfaces contain no hardcoded Tourvaa contact links", !publicContactSources.includes("mailto:hello@tourvaa.com") && !publicContactSources.includes("mailto:support@tourvaa.com") && !publicContactSources.includes("tel:+919876543210"));
check("legacy seeded contact placeholders are suppressed", publicSettings.includes("PLACEHOLDER_EMAILS") && publicSettings.includes("PLACEHOLDER_PHONES") && publicSettings.includes("PLACEHOLDER_ADDRESSES"));
check("all public pages use one canonical footer link set", ["supportLinks", "companyLinks", "loginLinks"].every((links) => publicFooter.includes(`links={${links}}`)) && !publicFooter.includes("aboutSupportLinks") && !publicFooter.includes("aboutCompanyLinks") && !publicFooter.includes("aboutLoginLinks"));
check("destination panel appears on the homepage only", publicFooter.includes('pathname === "/" && <DestinationsMegaPanel />'));
check("destination panel never renders empty loading cards", destinationsMegaPanel.includes("if (loading) return null") && destinationsMegaPanel.includes("if (!availableTabs.length) return null") && !destinationsMegaPanel.includes("animate-pulse"));
check("partner landing pages reuse the canonical public footer", portalPublicFooter.includes("<PublicFooter />") && portalPublicFooter.includes("<PublicSettingsProvider>") && portalPublicFooter.includes("<TravelStoreProvider>"));

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
// Referral links moved from a client-side "?ref=code" query param appended to
// the destination URL to server-tracked short links (GET /r/{code}, see
// app/routers/affiliate_redirect.py) that record a click + attribution
// server-side before redirecting - the short link embeds the ref_code/alias
// directly in its path instead of as a query param.
check("affiliate links use the server-tracked short link format", referralLinks.includes("/r/${link.custom_alias || link.ref_code}"));
check("affiliate links retain their referral code", referralLinks.includes("link.custom_alias || link.ref_code"));
check("unsupported referral update endpoint is not called", !referralLinks.includes("api.patch"));
check("unsupported referral delete endpoint is not called", !referralLinks.includes("api.delete"));

const affiliateDashboard = read("src/app/affiliate/dashboard/page.tsx");
check("affiliate dashboard uses commission summary API", affiliateDashboard.includes("/commissions`"));
check("affiliate dashboard uses serialized click totals", affiliateDashboard.includes("link.total_clicks"));
check("affiliate dashboard uses converted_at timestamp", affiliateDashboard.includes("c.converted_at"));

for (const page of ["dashboard", "referral-links", "clicks", "conversions", "commissions", "profile"]) {
  const source = read(`src/app/affiliate/${page}/page.tsx`);
  check(`${page} requires the provisioned affiliate id`, source.includes("dashboard?.user?.affiliate_id ?? null"));
  check(`${page} does not fall back to the unrelated user id`, !source.includes("dashboard?.user?.id"));
}

// Payouts (and payout-methods/wallet) moved to session-scoped self-service
// endpoints (GET/POST /affiliate/payouts, /affiliate/payout-methods,
// /affiliate/wallet - see app/routers/affiliate_payouts.py) where the
// backend resolves the caller's own affiliate row from the auth token via
// get_actor_affiliate, rather than the frontend passing a client-held
// affiliate_id - a stronger guarantee than the old pattern since a client
// can no longer influence which affiliate's data it reads by any id it holds.
const payoutsSource = read("src/app/affiliate/payouts/page.tsx");
check("payouts uses session-scoped self-service endpoints", payoutsSource.includes("getAffiliatePayouts") && payoutsSource.includes("getPayoutMethods") && payoutsSource.includes("getWalletSummary"));
check("payouts does not fall back to the unrelated user id", !payoutsSource.includes("dashboard?.user?.id"));

const profile = read("src/app/affiliate/profile/page.tsx");
check("affiliate profile update uses backend PUT contract", profile.includes("api.put(`/affiliates/${affiliateId}`"));
check("affiliate profile sends supported website_url field", profile.includes("website_url"));
check("affiliate self-edit is disabled when backend permission is unavailable", profile.includes('hasPermission("affiliates.approve")'));

const affiliateJoin = read("src/app/join/affiliate/page.tsx");
// The affiliate application form used to fabricate a mailto: link and claim
// success without actually delivering anything (a "fake API submission").
// It now really submits through the same /contact endpoint the public
// contact page uses, and surfaces a real error state if that call fails -
// these checks guard against silently regressing back to the mailto stub.
check("affiliate application submits through the real /contact endpoint, not a mailto stub", affiliateJoin.includes('publicApi.post("/contact"') && !affiliateJoin.includes("mailto:hello@tourvaa.com"));
check("affiliate application surfaces a real failure state if the API call fails", affiliateJoin.includes("catch") && affiliateJoin.includes("setError"));

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
