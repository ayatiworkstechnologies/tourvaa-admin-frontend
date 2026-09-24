import type { Metadata } from "next";
import { PAGE_METADATA, SITE_NAME, TITLE_TEMPLATE, brandTitle, metadataFor } from "./pageMetadata";
import { PAGE_SEO_BLOCK_KEY, cleanMetaText, type PageSeoMap } from "./seoPages";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/+$/, "");

/** Server-side read of the admin SEO overrides. No Next data cache (its
 * writes crash the render worker on Windows) - a missing/slow backend just
 * means the built-in titles are used. */
async function fetchPageSeo(): Promise<PageSeoMap> {
  try {
    const res = await fetch(`${API_BASE}/api/cms/content-blocks/${PAGE_SEO_BLOCK_KEY}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return {};
    const json = await res.json();
    const data = json?.data?.data;
    return data && typeof data === "object" && !Array.isArray(data) ? (data as PageSeoMap) : {};
  } catch {
    return {};
  }
}

function stripSiteSuffix(title: string) {
  return title.replace(new RegExp(`\\s*[|\\-–]\\s*${SITE_NAME}\\s*$`, "i"), "").trim();
}

/** metadataFor() plus the admin's CMS overrides for this page. */
export async function cmsMetadataFor(path: string, resolvedPath?: string): Promise<Metadata> {
  const base = metadataFor(path, resolvedPath);
  const override = (await fetchPageSeo())[path] || {};
  const title = stripSiteSuffix(cleanMetaText(override.title));
  const description = cleanMetaText(override.description);
  if (!title && !description) return base;

  const next: Metadata = { ...base };
  const socialTitle = brandTitle(title || PAGE_METADATA[path].title);
  if (title) next.title = { absolute: socialTitle, template: TITLE_TEMPLATE };
  if (description) next.description = description;
  const socialDescription = description || String(base.description || "");
  if (base.openGraph) next.openGraph = { ...base.openGraph, title: socialTitle, description: socialDescription };
  if (base.twitter) next.twitter = { ...base.twitter, title: socialTitle, description: socialDescription };
  return next;
}
