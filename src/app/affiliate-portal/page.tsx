import type { Metadata } from "next";
import { metadataFor } from "@/lib/seo/pageMetadata";
import AffiliatePortalContent from "./AffiliatePortalContent";

export const metadata: Metadata = metadataFor("/affiliate-portal");

export default function AffiliatePortalLandingPage() {
  return <AffiliatePortalContent />;
}
