import type { Metadata } from "next";
import PublicLayout from "@/components/public/PublicLayout";
import { cmsMetadataFor } from "@/lib/seo/cmsSeo";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadataFor("/affiliate-portal");
}

export default function AffiliatePortalLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
