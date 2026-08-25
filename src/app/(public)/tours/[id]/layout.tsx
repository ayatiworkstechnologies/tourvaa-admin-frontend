import type { Metadata } from "next";
import { fetchTourForSeo, tourJsonLdFor, tourMetadataFrom } from "@/lib/seo/tourMetadata";
import { countryMetadataFor } from "@/lib/seo/countryMetadata";

// Non-numeric ids are country slugs (e.g. /tours/india) routed to the
// country listing view, not an actual tour - see the isCountryListing
// check in page.tsx.
const isCountrySlug = (id: string) => !/^\d+$/.test(id);

export default async function Layout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ id: string }> }>) {
  const resolved = await params;
  if (isCountrySlug(resolved.id)) return children;

  const canonicalPath = `/tours/${resolved.id}`;
  const tour = await fetchTourForSeo(`/tours/${encodeURIComponent(resolved.id)}`);
  const jsonLd = tourJsonLdFor(canonicalPath, tour);

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {children}
    </>
  );
}

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  const canonicalPath = `/tours/${params.id}`;
  if (isCountrySlug(params.id)) {
    return countryMetadataFor(canonicalPath, params.id);
  }
  const tour = await fetchTourForSeo(`/tours/${encodeURIComponent(params.id)}`);
  return tourMetadataFrom("/tours/[id]", canonicalPath, tour);
}
