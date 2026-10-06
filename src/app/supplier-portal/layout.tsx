import type { Metadata } from "next";
import PublicLayout from "@/components/public/PublicLayout";
import { cmsMetadataFor } from "@/lib/seo/cmsSeo";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadataFor("/supplier-portal");
}

export default function SupplierPortalLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout showFooter={false}>{children}</PublicLayout>;
}
