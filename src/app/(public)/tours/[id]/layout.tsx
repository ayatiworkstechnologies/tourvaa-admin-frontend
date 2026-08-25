import type { Metadata } from "next";
import { tourMetadataFor } from "@/lib/seo/tourMetadata";
import { countryMetadataFor } from "@/lib/seo/countryMetadata";

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  const canonicalPath = `/tours/${params.id}`;
  // Non-numeric ids are country slugs (e.g. /tours/india) routed to the
  // country listing view, not an actual tour - see the isCountryListing
  // check in page.tsx.
  if (!/^\d+$/.test(params.id)) {
    return countryMetadataFor(canonicalPath, params.id);
  }
  return tourMetadataFor("/tours/[id]", canonicalPath, `/tours/${encodeURIComponent(params.id)}`);
}

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

