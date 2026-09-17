import type { Metadata } from "next";
import PublicHeader from "@/components/public/PublicHeader";
import PortalPublicFooter from "@/components/public/portal/PortalPublicFooter";
import { PublicSettingsProvider } from "@/providers/PublicSettingsProvider";
import { TravelStoreProvider } from "@/providers/TravelStoreProvider";
import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata: Metadata = metadataFor("/agent-portal");

export default function AgentPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicSettingsProvider>
      <TravelStoreProvider>
        <div className="flex min-h-screen flex-col bg-white">
          <PublicHeader />
          <div className="flex-1">{children}</div>
          <PortalPublicFooter />
        </div>
      </TravelStoreProvider>
    </PublicSettingsProvider>
  );
}
