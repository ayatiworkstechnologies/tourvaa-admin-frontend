import axios from "axios";

// Day Tours & Experiences - external affiliate inventory (Viator today).
// Everything goes through Tourvaa's backend (/api/public/external-tours);
// the browser never talks to Viator's API and never sees the API key.
const externalApi = axios.create({ baseURL: "/api/public/external-tours", timeout: 30_000 });

/** Signed-in visitors carry the `tourvaa_csrf` cookie, and the backend's CSRF
 * middleware rejects any POST (403) that doesn't echo it back - same
 * double-submit header the main API client (lib/api/client.ts) sends. */
export function csrfHeader(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const token = document.cookie.match(/(?:^|; )tourvaa_csrf=([^;]*)/)?.[1];
  return token ? { "X-CSRF-Token": decodeURIComponent(token) } : {};
}

externalApi.interceptors.request.use((config) => {
  if (config.method && config.method.toLowerCase() !== "get") {
    Object.entries(csrfHeader()).forEach(([key, value]) => config.headers.set(key, value));
  }
  return config;
});

export type ExternalSource = "VIATOR";
export type ExternalBookingType = "AFFILIATE_REDIRECT";
export type ExternalCampaignSource = "home" | "day-tours" | "destination" | "tour-detail" | "free-day" | "agent" | "mobile";

export type ExternalExperience = {
  id: string;
  source: ExternalSource;
  booking_type: ExternalBookingType;
  provider: string;
  title: string;
  short_description: string | null;
  destination: { provider_destination_id: string; name: string | null } | null;
  image: string | null;
  images: string[];
  duration: string | null;
  rating: number | null;
  review_count: number | null;
  currency: string | null;
  from_price: number | null;
  free_cancellation: boolean | null;
  product_code: string;
  external_url: string;
  category: string;
};

export type ExternalDestination = {
  slug: string;
  name: string;
  type: string | null;
  provider: string;
  provider_destination_id: string;
  parent_name: string | null;
  tourvaa_country_id: number | null;
  tourvaa_country_name: string | null;
  tourvaa_city_id: number | null;
  tourvaa_city_name: string | null;
};

export type ExternalToursConfig = {
  enabled: boolean;
  provider: string;
  provider_name: string;
  public_category: string;
  attribution: string;
  show_on_homepage: boolean;
  show_on_destination_pages: boolean;
  show_on_itinerary: boolean;
  show_in_search: boolean;
};

export type ExternalSort = "recommended" | "rating" | "price_asc" | "price_desc" | "duration" | "newest";

export type ExternalSearchParams = {
  destination?: string;
  location?: string;
  country?: string;
  start_date?: string;
  end_date?: string;
  category?: number;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  free_cancellation?: boolean;
  sort?: ExternalSort;
  page?: number;
  page_size?: number;
  currency?: string;
  source?: ExternalCampaignSource;
};

export type ExternalSearchResult = {
  items: ExternalExperience[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  currency: string;
  destination: ExternalDestination;
  provider: { code: string; name: string; attribution: string };
  category: string;
};

// Currencies Viator can price in; anything else is requested in USD.
export const VIATOR_CURRENCIES = new Set(["USD", "EUR", "GBP", "AUD", "CAD", "NZD", "INR", "SGD", "HKD", "JPY", "CHF", "DKK", "NOK", "SEK", "ZAR", "BRL", "TWD"]);
export const viatorCurrency = (code?: string) => (code && VIATOR_CURRENCIES.has(code.toUpperCase()) ? code.toUpperCase() : "USD");

let configPromise: Promise<ExternalToursConfig | null> | null = null;
/** Cached per page load; resolves to null if the backend is unreachable. */
export function fetchExternalToursConfig(): Promise<ExternalToursConfig | null> {
  configPromise ??= externalApi
    .get("/config")
    .then((res) => res.data.data as ExternalToursConfig)
    .catch(() => {
      configPromise = null;
      return null;
    });
  return configPromise;
}

export async function searchExternalExperiences(params: ExternalSearchParams) {
  const res = await externalApi.post("/search", { provider: "VIATOR", ...params });
  const { status: _status, ...rest } = res.data;
  void _status;
  return rest as ExternalSearchResult;
}

/** Viator's own affiliate link for a destination (the backend records the
 * outbound click). Falls back to the affiliate-tagged Viator homepage. */
export async function fetchViatorDestinationUrl(params: { country?: string; destination?: string; source?: ExternalCampaignSource }) {
  let sessionId: string | undefined;
  try {
    sessionId = sessionStorage.getItem("tourvaa_ext_session") ?? undefined;
  } catch {
    sessionId = undefined;
  }
  const res = await externalApi.post("/redirect", {
    source: "home",
    ...params,
    session_id: sessionId,
    page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
  });
  return res.data.data.url as string;
}
