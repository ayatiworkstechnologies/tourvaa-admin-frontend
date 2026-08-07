import type { Metadata } from "next";
import { LuBriefcaseBusiness as Briefcase } from "react-icons/lu";
import PortalPublicHeader from "@/components/public/portal/PortalPublicHeader";
import PortalPublicFooter from "@/components/public/portal/PortalPublicFooter";
import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata: Metadata = metadataFor("/agent-portal");

export default function AgentPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PortalPublicHeader portalPath="/agent-portal" roleLabel="for Agents" icon={<Briefcase size={16} />} theme="indigo" />
      <div className="flex-1">{children}</div>
      <PortalPublicFooter />
    </div>
  );
}
