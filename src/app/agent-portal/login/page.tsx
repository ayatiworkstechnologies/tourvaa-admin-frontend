import { LuBriefcaseBusiness as Briefcase } from "react-icons/lu";
import PortalAuthPage, { type PortalAuthConfig } from "@/components/public/portal/PortalAuthPage";

const config: PortalAuthConfig = {
  theme: "indigo",
  roleSlug: "agent-reseller",
  accountType: "AGENT",
  portalPath: "/agent-portal",
  redirectPrefix: "/agent/",
  // Agents share the customer checkout flow at /booking/{id} (e.g. booking on
  // behalf of a customer) - a redirect back there must still be honored.
  extraRedirectPrefixes: ["/booking/"],
  heroImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=88",
  heroBadge: "Agent Portal",
  heroTitle: "One account for every client you book.",
  heroSubtitle: "Customers, bookings, and commissions - login or register in the same place.",
  signInCta: "Sign in as Agent",
  wrongRoleMessage: "This login is for agent accounts. Use the correct portal for other account types.",
  registerNamePlaceholder: "Full name",
};

export default function AgentPortalLoginPage() {
  return <PortalAuthPage config={config} heroIcon={<Briefcase size={13} />} />;
}
