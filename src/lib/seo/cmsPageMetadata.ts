import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, metadataFor } from "./pageMetadata";

export type ServerCmsPage = {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/+$/, "");

/** Server-side lookup of an admin-created CMS page by slug, for use in
 * generateMetadata and the [slug] page itself - mirrors fetchBlogForServer
 * in blogMetadata.ts. Only ever returns a published page: the backend 404s
 * for drafts/unknown slugs, which this treats the same as "not found". */
export async function fetchCmsPageForServer(slug: string): Promise<ServerCmsPage | null> {
  try {
    const res = await fetch(`${API_BASE}/api/cms/pages/by-slug/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? null) as ServerCmsPage | null;
  } catch {
    return null;
  }
}

export function cmsPageMetadataFrom(canonicalPath: string, page: ServerCmsPage | null): Metadata {
  const fallback = metadataFor("/[slug]", canonicalPath);
  if (!page) return fallback;

  const title = page.seo_title?.trim() || page.title;
  const description = page.seo_description?.trim() || DEFAULT_DESCRIPTION;
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
      card: "summary",
      title: absoluteTitle,
      description,
    },
  };
}

/** schema.org WebPage structured data - a generic admin page isn't an
 * Article (see blogJsonLdFor for that), so this uses the plainer WebPage type. */
export function cmsPageJsonLdFor(canonicalPath: string, page: ServerCmsPage | null) {
  if (!page) return null;
  const url = `${SITE_URL}${canonicalPath}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.seo_description || undefined,
    url,
    dateModified: page.updated_at || page.created_at,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };
}
