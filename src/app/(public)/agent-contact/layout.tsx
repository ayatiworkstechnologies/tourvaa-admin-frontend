import type { Metadata } from "next";
import { cmsMetadataFor } from "@/lib/seo/cmsSeo";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadataFor("/agent-contact");
}

export default function AgentContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
