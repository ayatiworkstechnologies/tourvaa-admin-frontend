import { LuMegaphone as Megaphone } from "react-icons/lu";
import PortalAuthPage, { type PortalAuthConfig } from "@/components/public/portal/PortalAuthPage";

const config: PortalAuthConfig = {
  theme: "purple",
  roleSlug: "affiliate",
  accountType: "AFFILIATE",
  portalPath: "/affiliate-portal",
  redirectPrefix: "/affiliate/",
  heroImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=88",
  heroBadge: "Affiliate Portal",
  heroTitle: "Earn commission promoting Tourvaa tours.",
  heroSubtitle: "Generate referral links, track clicks and conversions, and get paid - login or register in the same place.",
  signInCta: "Sign in as Affiliate",
  wrongRoleMessage: "This login is for affiliate accounts. Use the correct portal for other account types.",
  registerNamePlaceholder: "Full name",
};

export default function AffiliatePortalLoginPage() {
  return <PortalAuthPage config={config} heroIcon={<Megaphone size={13} />} />;
}
