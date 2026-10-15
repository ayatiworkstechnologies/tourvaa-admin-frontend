import type { Metadata } from "next";
import { cmsMetadataFor } from "@/lib/seo/cmsSeo";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadataFor("/supplier-contact");
}

export default function SupplierContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
