import type { Metadata } from "next";
import { LuBuilding2 as Building } from "react-icons/lu";
import PortalPublicHeader from "@/components/public/portal/PortalPublicHeader";
import PortalPublicFooter from "@/components/public/portal/PortalPublicFooter";
import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata: Metadata = metadataFor("/supplier-portal");

export default function SupplierPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PortalPublicHeader portalPath="/supplier-portal" roleLabel="for Suppliers" icon={<Building size={16} />} theme="emerald" />
      <div className="flex-1">{children}</div>
      <PortalPublicFooter />
    </div>
  );
}
