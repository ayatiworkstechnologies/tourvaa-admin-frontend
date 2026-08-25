import type { Metadata } from "next";
import PublicLayout from "@/components/public/PublicLayout";
import AffiliateReferralTracker from "@/components/public/AffiliateReferralTracker";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, metadataFor } from "@/lib/seo/pageMetadata";

export const metadata: Metadata = metadataFor("/");

// Organization + WebSite structured data, scoped to the public site only
// (not admin/agent/supplier/customer portals) - this is what search engines'
// Knowledge Panel and AI answer-engine crawlers (ChatGPT, Perplexity, Google
// AI Overviews) read to identify the business behind the pages, independent
// of whatever per-page title/description is set.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/tours?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <AffiliateReferralTracker />
      {children}
    </PublicLayout>
  );
}
