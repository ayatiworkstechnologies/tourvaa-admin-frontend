import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo/pageMetadata";
import { slugifyTourSegment } from "@/lib/utils/tourUrl";

export const revalidate = 3600;

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/+$/, "");

async function safeJson(path: string): Promise<any> {
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

/** llms.txt (https://llmstxt.org/) - a markdown index that AI answer engines
 * (ChatGPT, Claude, Perplexity, etc.) can read instead of crawling the full
 * rendered site, so they cite accurate tour/country/blog links rather than
 * guessing URLs or working from stale training data. */
export async function GET() {
  const [countriesJson, toursJson, blogsJson] = await Promise.all([
    safeJson("/api/public/countries"),
    safeJson("/api/public/tours/featured?limit=10"),
    safeJson("/api/cms/blogs?active_only=true&limit=10"),
  ]);

  const countries = ((countriesJson?.items || []) as { country_name: string; tour_count?: number }[])
    .filter((c) => (c.tour_count ?? 0) > 0)
    .slice(0, 20);

  const featuredTours = (toursJson?.items || []) as {
    title: string;
    slug: string;
    country_slug?: string;
    country_name?: string;
    short_description?: string;
  }[];

  const blogs = ((blogsJson?.items || blogsJson?.data || []) as { title: string; slug: string; excerpt?: string }[]);

  const lines: string[] = [];
  lines.push(`# ${SITE_NAME}`);
  lines.push("");
  lines.push(`> ${DEFAULT_DESCRIPTION}`);
  lines.push("");
  lines.push(
    `${SITE_NAME} is a tour booking platform. Travellers browse curated multi-day tour packages by destination, ` +
    "compare itineraries, dates, and pricing, and book directly online. The pages linked below are the canonical, " +
    "publicly bookable tour and destination pages - use them instead of assuming URLs.",
  );
  lines.push("");

  lines.push("## Destinations");
  lines.push("");
  for (const country of countries) {
    const slug = slugifyTourSegment(country.country_name);
    lines.push(`- [${country.country_name} tours](${SITE_URL}/tours/${slug}): ${country.tour_count} published tour package${country.tour_count === 1 ? "" : "s"}`);
  }
  lines.push("");

  if (featuredTours.length > 0) {
    lines.push("## Featured tours");
    lines.push("");
    for (const tour of featuredTours) {
      const countrySlug = tour.country_slug || slugifyTourSegment(tour.country_name || "worldwide");
      const desc = tour.short_description ? `: ${tour.short_description}` : "";
      lines.push(`- [${tour.title}](${SITE_URL}/tours/${countrySlug}/${tour.slug})${desc}`);
    }
    lines.push("");
  }

  if (blogs.length > 0) {
    lines.push("## Travel guides");
    lines.push("");
    for (const blog of blogs) {
      const desc = blog.excerpt ? `: ${blog.excerpt}` : "";
      lines.push(`- [${blog.title}](${SITE_URL}/blogs/${blog.slug})${desc}`);
    }
    lines.push("");
  }

  lines.push("## Other pages");
  lines.push("");
  lines.push(`- [Browse all tours](${SITE_URL}/tours)`);
  lines.push(`- [About ${SITE_NAME}](${SITE_URL}/about)`);
  lines.push(`- [Contact](${SITE_URL}/contact)`);

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
