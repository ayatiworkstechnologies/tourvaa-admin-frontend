import "server-only";

import type { CountryDestinationInfo } from "../types/countryDestination";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/+$/, "");

function countrySlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

type PublicCountryResponse = {
  items?: Array<{ country_name?: string }>;
};

// These destination URLs were published by the public site before every
// country had a CMS guide. Keep them resolvable while content is being
// migrated; arbitrary paths must not be treated as destinations.
const LEGACY_DESTINATION_GUIDE_SLUGS = new Set([
  "australia", "canada", "china", "croatia", "egypt", "france", "greece",
  "iceland", "india", "indonesia", "ireland", "italy", "japan", "morocco",
  "new-zealand", "norway", "portugal", "qatar", "singapore", "spain",
  "sri-lanka", "switzerland", "thailand", "turkey", "united-arab-emirates",
  "united-kingdom", "united-states", "vietnam",
]);

export function isLegacyDestinationGuideSlug(slugOrName: string): boolean {
  return LEGACY_DESTINATION_GUIDE_SLUGS.has(countrySlug(slugOrName));
}

/**
 * Destination guides are optional CMS content. A country can be active and
 * bookable before its long-form guide has been authored, so callers need a
 * server-safe way to distinguish that state from an unknown URL.
 */
export async function isPublicDestinationCountryForServer(slugOrName: string): Promise<boolean> {
  const normalizedSlug = countrySlug(slugOrName);
  if (!normalizedSlug) return false;

  try {
    const response = await fetch(`${API_BASE}/api/public/countries`, { cache: "no-store" });
    if (!response.ok) return false;

    const payload = await response.json() as PublicCountryResponse;
    return Array.isArray(payload.items) && payload.items.some(
      (country) => countrySlug(country.country_name || "") === normalizedSlug,
    );
  } catch {
    return false;
  }
}

/**
 * Published tours can outlive an accidentally disabled country record. The
 * public catalogue still exposes those tours, so their generated "Travel
 * Guide" link must resolve to the country catalogue instead of a soft 404.
 */
export async function hasPublicToursForDestinationForServer(slugOrName: string): Promise<boolean> {
  const normalizedSlug = countrySlug(slugOrName);
  if (!normalizedSlug) return false;

  try {
    const url = new URL(`${API_BASE}/api/public/tours`);
    url.searchParams.set("country", normalizedSlug);
    url.searchParams.set("page", "1");
    url.searchParams.set("limit", "1");
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return false;

    const payload = await response.json() as { total?: number; items?: unknown[] };
    return Number(payload.total || 0) > 0 || Boolean(payload.items?.length);
  } catch {
    return false;
  }
}

/**
 * Read a destination guide directly from the backend during server rendering.
 * Browser-relative `/api` calls only work after hydration; using the proxy
 * target here makes a newly saved country CMS update visible on the first
 * public render as well.
 */
export async function fetchCountryDestinationInfoForServer(slugOrName: string): Promise<CountryDestinationInfo | null> {
  const normalizedSlug = countrySlug(slugOrName);

  try {
    const response = await fetch(
      `${API_BASE}/api/public/destination-guides/${encodeURIComponent(normalizedSlug)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;

    const payload = await response.json();
    const data = payload?.data?.data as Partial<CountryDestinationInfo> | undefined;
    if (!data || !data.country_name || Object.keys(data).length === 0) return null;

    return data as CountryDestinationInfo;
  } catch {
    return null;
  }
}
