import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, DEFAULT_SOCIAL_IMAGE, SITE_NAME, SITE_URL, metadataFor } from "./pageMetadata";

export type TourSeoData = {
  id: number;
  title: string;
  slug: string;
  short_description: string | null;
  banner_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  price_start_per_person: number | null;
  currency: string;
  number_of_days: number | null;
  country_name: string;
  city_name: string;
  rating_average: number | null;
  rating_count: number;
};

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/+$/, "");

export async function fetchTourForSeo(path: string): Promise<TourSeoData | null> {
  try {
    // cache: "no-store", not { next: { revalidate } } - on Windows, Next's
    // Data Cache write path (triggered whenever a `next.revalidate` fetch
    // gets a real, cacheable response) crashes the render worker with
    // "Jest worker encountered N child process exceptions, exceeding retry
    // limit". Confirmed by isolation: this only ever crashed on requests
    // that got real tour data back (the write path only fires on success);
    // a 404/no-match response never triggered it. Every other server-side
    // SEO fetch in this codebase (blogMetadata.ts, countryMetadata.ts,
    // sitemap.ts, llms.txt/route.ts) hit the exact same crash and got the
    // same fix - keep them consistent if you touch one.
    const res = await fetch(`${API_BASE}/api/public${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data as TourSeoData) ?? null;
  } catch {
    return null;
  }
}

/** Builds tour-detail page metadata from the tour's own SEO title/description
 * (set by admins in the CMS), falling back to the generic `/tours/[id]`
 * definition in pageMetadata.ts when the tour can't be fetched or has no
 * SEO fields configured. */
export function tourMetadataFrom(fallbackPageKey: string, canonicalPath: string, tour: TourSeoData | null): Metadata {
  const fallback = metadataFor(fallbackPageKey, canonicalPath);
  if (!tour) return fallback;

  const title = tour.seo_title?.trim() || tour.title;
  const description = tour.seo_description?.trim() || tour.short_description?.trim() || DEFAULT_DESCRIPTION;
  const image = tour.banner_image || DEFAULT_SOCIAL_IMAGE;
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
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: absoluteTitle,
      description,
      images: [image],
    },
  };
}

/** schema.org TouristTrip structured data - lets Google/Bing rich results and
 * AI answer engines (ChatGPT/Perplexity-style crawlers reading JSON-LD) pull
 * price, duration, and rating without scraping page copy. */
export function tourJsonLdFor(canonicalPath: string, tour: TourSeoData | null) {
  if (!tour) return null;
  const url = `${SITE_URL}${canonicalPath}`;
  const image = tour.banner_image ? (tour.banner_image.startsWith("http") ? tour.banner_image : `${SITE_URL}${tour.banner_image}`) : `${SITE_URL}${DEFAULT_SOCIAL_IMAGE}`;

  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.short_description || tour.seo_description || undefined,
    image,
    url,
    touristType: "Leisure",
    ...(tour.number_of_days ? { duration: `P${tour.number_of_days}D` } : {}),
    ...(tour.country_name || tour.city_name
      ? {
          touristAttraction: [tour.city_name, tour.country_name].filter(Boolean).join(", "),
        }
      : {}),
    offers: tour.price_start_per_person
      ? {
          "@type": "Offer",
          price: tour.price_start_per_person,
          priceCurrency: tour.currency || "USD",
          availability: "https://schema.org/InStock",
          url,
        }
      : undefined,
    aggregateRating: tour.rating_average && tour.rating_count > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: tour.rating_average,
          reviewCount: tour.rating_count,
        }
      : undefined,
  };
}
