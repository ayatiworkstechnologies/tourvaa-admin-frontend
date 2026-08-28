import { LuBuilding2 as Building } from "react-icons/lu";
import PortalAuthPage, { type PortalAuthConfig } from "@/components/public/portal/PortalAuthPage";

const config: PortalAuthConfig = {
  theme: "emerald",
  roleSlug: "supplier",
  accountType: "SUPPLIER",
  portalPath: "/supplier-portal",
  redirectPrefix: "/supplier/",
  heroImage: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
  heroBadge: "Supplier Portal",
  heroTitle: "List. Connect. Earn.",
  heroSubtitle: "Manage your tours, track bookings and receive payouts — all from one powerful dashboard.",
  heroBullets: [
    "List unlimited tours and experiences",
    "Real-time booking & availability control",
    "Automated payouts to your account",
    "Dedicated supplier support",
  ],
  heroStats: [
    { value: "800+", label: "Active suppliers" },
    { value: "50K+", label: "Bookings processed" },
  ],
  signInCta: "Sign in as Supplier",
  wrongRoleMessage: "This login is for supplier accounts. Use the correct portal for other account types.",
  registerNamePlaceholder: "Business contact name",
};

export default function SupplierPortalLoginPage() {
  return <PortalAuthPage config={config} heroIcon={<Building size={13} />} />;
}
