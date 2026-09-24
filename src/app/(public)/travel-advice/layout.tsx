import type { Metadata } from "next";
import { cmsMetadataFor } from "@/lib/seo/cmsSeo";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadataFor("/travel-advice");
}

export default function TravelAdviceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

