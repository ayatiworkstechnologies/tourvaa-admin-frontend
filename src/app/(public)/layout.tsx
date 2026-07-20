import type { Metadata } from "next";
import PublicLayout from "@/components/public/PublicLayout";
import AffiliateReferralTracker from "@/components/public/AffiliateReferralTracker";
import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata: Metadata = metadataFor("/");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicLayout><AffiliateReferralTracker />{children}</PublicLayout>;
}
