import { LuPlane as Plane } from "react-icons/lu";
import PortalAuthPage, { type PortalAuthConfig } from "@/components/public/portal/PortalAuthPage";

import { getDashboardPath } from "@/lib/utils/dashboardPath";

export function redirectForRole(roleSlug: string, requested: string | null) {
  const allowedPrefixes: Record<string, string> = {
    customer: "/customer/",
    supplier: "/supplier/",
    "agent-reseller": "/agent/",
    affiliate: "/affiliate/",
  };
  const prefix = allowedPrefixes[roleSlug.toLowerCase()];
  const normalizedRole = roleSlug.toLowerCase();
  const isSharedBooking = ["customer", "agent", "agent-reseller"].includes(normalizedRole) && requested?.startsWith("/booking/");
  return requested && ((prefix && requested.startsWith(prefix)) || isSharedBooking) ? requested : getDashboardPath(roleSlug);
}

// Contract: redirectForRole(roleSlug, safeRedirect)

// Traveller (customer) accounts. Registration keeps its own dedicated page
// (/register, which also collects address details) via registerHref, while
// sharing the same login shell/switcher as the agent/supplier/affiliate portals.
const config: PortalAuthConfig = {
  theme: "blue",
  roleSlug: "customer",
  accountType: "CUSTOMER",
  portalPath: "/",
  redirectPrefix: "/customer/",
  extraRedirectPrefixes: ["/booking/"],
  heroImage: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
  heroBadge: "Tourvaa Traveller",
  heroTitle: "Your next adventure awaits",
  heroSubtitle: "Sign in to discover, book and manage unforgettable travel experiences around the world.",
  heroBullets: [
    "10,000+ experiences worldwide",
    "Top-rated verified suppliers",
    "Wishlists & personalised picks",
    "Easy booking management",
  ],
  heroStats: [
    { value: "10,000+", label: "Tours available" },
    { value: "4.9 / 5", label: "Average rating" },
  ],
  signInCta: "Sign in as Traveller",
  wrongRoleMessage: "This login is for traveller accounts. Use the correct portal for other account types.",
  registerNamePlaceholder: "Full name",
  registerHref: "/register",
};

export default function CustomerLoginPage() {
  return <PortalAuthPage config={config} heroIcon={<Plane size={13} />} />;
}
