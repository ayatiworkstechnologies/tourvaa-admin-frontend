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
  heroImage: "https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=900&q=80",
  heroBadge: "Agent Portal",
  heroTitle: "Grow your travel business.",
  heroSubtitle: "Book for your clients, earn commissions and manage all your bookings from one place.",
  heroBullets: [
    "Book tours for any of your clients",
    "Earn competitive commissions per booking",
    "Access exclusive agent-only rates",
    "Full booking history & reports",
  ],
  heroStats: [
    { value: "2,500+", label: "Active agents" },
    { value: "18%", label: "Avg. commission" },
  ],
  signInCta: "Sign in as Agent",
  wrongRoleMessage: "This login is for agent accounts. Use the correct portal for other account types.",
  registerNamePlaceholder: "Full name",
};

export default function AgentPortalLoginPage() {
  return <PortalAuthPage config={config} heroIcon={<Briefcase size={13} />} />;
}
