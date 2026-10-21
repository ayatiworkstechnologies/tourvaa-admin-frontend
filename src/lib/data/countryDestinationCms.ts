import "server-only";

import type { CountryDestinationInfo } from "../types/countryDestination";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/+$/, "");

function countrySlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
