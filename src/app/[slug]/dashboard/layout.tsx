import type { Metadata } from "next";
import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata: Metadata = metadataFor("/[slug]/dashboard");

export default function DynamicRoleDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
