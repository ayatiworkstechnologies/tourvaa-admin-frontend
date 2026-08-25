import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, DEFAULT_SOCIAL_IMAGE, SITE_NAME, metadataFor } from "./pageMetadata";

export type ServerBlog = {
  title: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  published_at: string | null;
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

export async function blogMetadataFor(canonicalPath: string, slug: string): Promise<Metadata> {
  const fallback = metadataFor("/blogs/[slug]", canonicalPath);
  const blog = await fetchBlogForServer(slug);
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
