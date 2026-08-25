import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, DEFAULT_SOCIAL_IMAGE, SITE_NAME, metadataFor } from "./pageMetadata";

type TourSeoData = {
  title: string;
  short_description: string | null;
  banner_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/+$/, "");

async function fetchTourForMetadata(path: string): Promise<TourSeoData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/public${path}`, { next: { revalidate: 300 } });
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
export async function tourMetadataFor(
  fallbackPageKey: string,
  canonicalPath: string,
  fetchPath: string,
): Promise<Metadata> {
  const fallback = metadataFor(fallbackPageKey, canonicalPath);
  const tour = await fetchTourForMetadata(fetchPath);
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
