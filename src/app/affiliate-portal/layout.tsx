import type { Metadata } from "next";
import { LuMegaphone as Megaphone } from "react-icons/lu";
import PortalPublicHeader from "@/components/public/portal/PortalPublicHeader";
import PortalPublicFooter from "@/components/public/portal/PortalPublicFooter";
import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata: Metadata = metadataFor("/affiliate-portal");

export default function AffiliatePortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PortalPublicHeader portalPath="/affiliate-portal" roleLabel="for Affiliates" icon={<Megaphone size={16} />} theme="purple" />
      <div className="flex-1">{children}</div>
      <PortalPublicFooter />
    </div>
  );
}
