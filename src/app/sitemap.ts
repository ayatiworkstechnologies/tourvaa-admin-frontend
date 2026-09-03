import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/pageMetadata";
import { slugifyTourSegment } from "@/lib/utils/tourUrl";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/+$/, "");

const staticPages: Array<{
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
}> = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/tours", changeFrequency: "weekly", priority: 0.9 },
  { path: "/destinations", changeFrequency: "weekly", priority: 0.8 },
  { path: "/blogs", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/travel-advice", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/join/agent", changeFrequency: "monthly", priority: 0.6 },
  { path: "/join/supplier", changeFrequency: "monthly", priority: 0.6 },
  { path: "/join/affiliate", changeFrequency: "monthly", priority: 0.6 },
  { path: "/cancellation-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookie-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/accessibility", changeFrequency: "yearly", priority: 0.3 },
];

async function safeJson(path: string): Promise<Record<string, unknown> | null> {
  try {
    // cache: "no-store" - see the comment on fetchTourForSeo in
    // src/lib/seo/tourMetadata.ts for why this isn't { next: { revalidate } }.
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function tourEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const limit = 100;
  let page = 1;
  let totalPages = 1;
  do {
    const json = await safeJson(`/api/public/tours?page=${page}&limit=${limit}`) as {
      total_pages?: number;
      items?: { country_slug?: string; country_name?: string; slug: string }[];
    } | null;
    if (!json) break;
    totalPages = json.total_pages || 1;
    for (const tour of json.items || []) {
      const countrySlug = tour.country_slug || slugifyTourSegment(tour.country_name || "worldwide");
      entries.push({
        url: `${SITE_URL}/tours/${countrySlug}/${tour.slug}`,
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }
    page += 1;
  } while (page <= totalPages);
  return entries;
}

async function countryEntries(): Promise<MetadataRoute.Sitemap> {
  const json = await safeJson("/api/public/countries") as { items?: { tour_count?: number; country_name: string }[] } | null;
  if (!json) return [];
  return (json.items || [])
    .filter((c: { tour_count?: number }) => (c.tour_count ?? 0) > 0)
    .map((c: { country_name: string }) => ({
      url: `${SITE_URL}/tours/${slugifyTourSegment(c.country_name)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
}

async function blogEntries(): Promise<MetadataRoute.Sitemap> {
  const json = await safeJson("/api/cms/blogs?active_only=true&limit=200") as {
    items?: { slug: string; updated_at?: string }[];
    data?: { slug: string; updated_at?: string }[];
  } | null;
  if (!json) return [];
  return (json.items || json.data || []).map((blog: { slug: string; updated_at?: string }) => ({
    url: `${SITE_URL}/blogs/${blog.slug}`,
    lastModified: blog.updated_at,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tours, countries, blogs] = await Promise.all([tourEntries(), countryEntries(), blogEntries()]);
  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
  return [...staticEntries, ...countries, ...tours, ...blogs];
}
