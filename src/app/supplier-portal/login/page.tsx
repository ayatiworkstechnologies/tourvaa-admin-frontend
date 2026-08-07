import { LuBuilding2 as Building } from "react-icons/lu";
import PortalAuthPage, { type PortalAuthConfig } from "@/components/public/portal/PortalAuthPage";

const config: PortalAuthConfig = {
  theme: "emerald",
  roleSlug: "supplier",
  accountType: "SUPPLIER",
  portalPath: "/supplier-portal",
  redirectPrefix: "/supplier/",
  heroImage: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=88",
  heroBadge: "Supplier Portal",
  heroTitle: "One account for your whole supplier business.",
  heroSubtitle: "Tours, bookings, and payouts - login or register in the same place.",
  signInCta: "Sign in as Supplier",
  wrongRoleMessage: "This login is for supplier accounts. Use the correct portal for other account types.",
  registerNamePlaceholder: "Business contact name",
};

export default function SupplierPortalLoginPage() {
  return <PortalAuthPage config={config} heroIcon={<Building size={13} />} />;
}
