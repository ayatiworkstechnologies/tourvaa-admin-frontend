import type { Metadata } from "next";
import PublicLayout from "@/components/public/PublicLayout";
import { cmsMetadataFor } from "@/lib/seo/cmsSeo";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadataFor("/agent-portal");
}

export default function AgentPortalLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout showFooter={false}>{children}</PublicLayout>;
}
