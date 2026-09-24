import type { Metadata } from "next";
import { LuMegaphone as Megaphone } from "react-icons/lu";
import PortalPublicHeader from "@/components/public/portal/PortalPublicHeader";
import PortalPublicFooter from "@/components/public/portal/PortalPublicFooter";
import { cmsMetadataFor } from "@/lib/seo/cmsSeo";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadataFor("/affiliate-portal");
}

export default function AffiliatePortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PortalPublicHeader portalPath="/affiliate-portal" roleLabel="for Affiliates" icon={<Megaphone size={16} />} theme="purple" />
      <div className="flex-1">{children}</div>
      <PortalPublicFooter />
    </div>
  );
}
