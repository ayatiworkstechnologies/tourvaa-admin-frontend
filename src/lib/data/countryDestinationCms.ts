import "server-only";

import { getCountryDestinationDefault } from "./countryDestinationDefaults";
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
export async function fetchCountryDestinationInfoForServer(slugOrName: string): Promise<CountryDestinationInfo> {
  const normalizedSlug = countrySlug(slugOrName);
  const defaults = getCountryDestinationDefault(normalizedSlug);

  try {
    const response = await fetch(
      `${API_BASE}/api/cms/content-blocks/country_info_${encodeURIComponent(normalizedSlug)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return defaults;

    const payload = await response.json();
    const data = payload?.data?.data as Partial<CountryDestinationInfo> | undefined;
    if (!data || Object.keys(data).length === 0) return defaults;

    return {
      ...defaults,
      ...data,
      quick_facts: { ...defaults.quick_facts, ...(data.quick_facts || {}) },
      why_visit: {
        ...defaults.why_visit,
        ...(data.why_visit || {}),
        reasons: data.why_visit?.reasons?.length ? data.why_visit.reasons : defaults.why_visit.reasons,
      },
      best_time_to_visit: { ...defaults.best_time_to_visit, ...(data.best_time_to_visit || {}) },
      monsoon_info: {
        ...defaults.monsoon_info,
        ...(data.monsoon_info || {}),
        regional_variations: data.monsoon_info?.regional_variations?.length
          ? data.monsoon_info.regional_variations
          : defaults.monsoon_info.regional_variations,
      },
      temperature_info: {
        ...defaults.temperature_info,
        ...(data.temperature_info || {}),
        monthly_weather: data.temperature_info?.monthly_weather?.length
          ? data.temperature_info.monthly_weather
          : defaults.temperature_info.monthly_weather,
      },
      best_places_to_visit: {
        ...defaults.best_places_to_visit,
        ...(data.best_places_to_visit || {}),
        places: data.best_places_to_visit?.places?.length
          ? data.best_places_to_visit.places
          : defaults.best_places_to_visit.places,
      },
      travel_info: { ...defaults.travel_info, ...(data.travel_info || {}) },
    };
  } catch {
    return defaults;
  }
}
