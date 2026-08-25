import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, DEFAULT_SOCIAL_IMAGE, SITE_NAME, SITE_URL, metadataFor } from "./pageMetadata";

export type ServerBlog = {
  title: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  author: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
};

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/+$/, "");

/** Server-side blog lookup for use in generateMetadata and server components -
 * the browser-side fetchPublicBlogBySlug in publicClient.ts relies on a
 * relative "/api/cms" baseURL that only resolves through Next's rewrite
 * proxy at request time, not from server code. */
export async function fetchBlogForServer(slug: string): Promise<ServerBlog | null> {
  try {
    const res = await fetch(`${API_BASE}/api/cms/blogs?active_only=true&slug=${encodeURIComponent(slug)}&limit=1`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const items = (json?.items || json?.data || []) as ServerBlog[];
    return items[0] ?? null;
  } catch {
    return null;
  }
}

export function blogMetadataFrom(canonicalPath: string, blog: ServerBlog | null): Metadata {
  const fallback = metadataFor("/blogs/[slug]", canonicalPath);
  if (!blog) return fallback;

  const title = blog.seo_title?.trim() || blog.title;
  const description = blog.seo_description?.trim() || blog.excerpt?.trim() || DEFAULT_DESCRIPTION;
  const image = blog.featured_image || DEFAULT_SOCIAL_IMAGE;
  const absoluteTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
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

/** schema.org Article structured data - the same signal Google rich results
 * and AI answer-engine crawlers read to attribute authorship/dates instead
 * of relying on scraped page text. */
export function blogJsonLdFor(canonicalPath: string, blog: ServerBlog | null) {
  if (!blog) return null;
  const url = `${SITE_URL}${canonicalPath}`;
  const image = blog.featured_image
    ? (blog.featured_image.startsWith("http") ? blog.featured_image : `${SITE_URL}${blog.featured_image}`)
    : `${SITE_URL}${DEFAULT_SOCIAL_IMAGE}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.excerpt || blog.seo_description || undefined,
    image,
    url,
    datePublished: blog.published_at || blog.created_at,
    dateModified: blog.updated_at || blog.published_at || blog.created_at,
    author: blog.author ? { "@type": "Person", name: blog.author } : { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}
