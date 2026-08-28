import type { Metadata } from "next";
import { SITE_NAME, metadataFor } from "./pageMetadata";
import { slugifyTourSegment } from "@/lib/utils/tourUrl";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/+$/, "");

type PublicCountry = { country_name: string; tour_count?: number };

async function findCountryBySlug(slug: string): Promise<PublicCountry | null> {
  try {
    // cache: "no-store" - see the comment on fetchTourForSeo in
    // tourMetadata.ts for why this isn't { next: { revalidate } }.
    const res = await fetch(`${API_BASE}/api/public/countries`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const items = (json?.items || []) as PublicCountry[];
    return items.find((item) => slugifyTourSegment(item.country_name) === slug) ?? null;
  } catch {
    return null;
  }
}

/** `/tours/[id]` doubles as a country-listing page when `id` isn't a numeric
 * tour id (e.g. /tours/india) - it has no per-record SEO fields to draw on
 * (Country carries no seo_title/seo_description columns), so the title and
 * description are generated from the country name and live tour count
 * instead of falling back to the generic "Tour Details" definition. */
export async function countryMetadataFor(canonicalPath: string, slug: string): Promise<Metadata> {
  const fallback = metadataFor("/tours", canonicalPath);
  const country = await findCountryBySlug(slug);
  if (!country) return fallback;

  const title = `${country.country_name} Tour Packages`;
  const count = country.tour_count ?? 0;
  const description = count > 0
    ? `Browse ${count} curated ${country.country_name} tour package${count === 1 ? "" : "s"} - compare itineraries, dates, and prices, then book securely with Tourvaa.`
    : `Explore upcoming ${country.country_name} tour packages and book securely with Tourvaa.`;
  const absoluteTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title: absoluteTitle,
      description,
      url: canonicalPath,
    },
    twitter: {
      card: "summary_large_image",
      title: absoluteTitle,
      description,
    },
  };
}
