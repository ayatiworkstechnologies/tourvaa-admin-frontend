import type { Metadata } from "next";
import { cmsMetadataFor } from "@/lib/seo/cmsSeo";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadataFor("/join/affiliate");
}

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

