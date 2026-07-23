import axios from "axios";

const publicApi = axios.create({ baseURL: "/api/public" });
const cmsApi = axios.create({ baseURL: "/api/cms" });

export default publicApi;

export type PublicTour = {
  id: number;
  tour_code: string;
  title: string;
  slug: string;
  subtitle: string;
  price_start_per_person: number | null;
  currency: string;
  country_name: string;
  country_slug?: string;
  city_name: string;
  category_name: string;
  number_of_days: number | null;
  number_of_hours: number | null;
  short_description: string;
  banner_image: string | null;
  status: string;
  canonical_path?: string;
  departures?: { id: number; date: string; slots: number; status: string }[];
};

export type PublicTourDetail = PublicTour & {
  long_description: string;
  start_location: string;
  finish_location: string;
  map_image: string | null;
  overview: {
    duration_text: string;
    start_location: string;
    end_location: string;
    group_size: string;
    tour_type: string;
    physical_rating: string;
  } | null;
  itineraries: { day: number; title: string; description: string; accommodation: string; meals: string }[];
  highlights: { text: string }[];
  inclusions: { text: string }[];
  exclusions: { text: string }[];
  gallery: { image_url: string; alt_text: string; is_banner: boolean }[];
  pricing: { persons_from: number; persons_to: number | null; price_per_person: number; currency: string }[];
  optional_activities: { id: number; name: string; description: string; price: number | null; currency: string }[];
  accommodations: { id: number; name: string; description: string; price: number | null }[];
  extensions: { id: number; title: string; description: string; duration_days: number | null; price: number | null }[];
  discounts: { label: string; discount_type: string; value: number; valid_from: string | null; valid_to: string | null }[];
  calendar: { id: number; date: string; slots: number; status: string }[];
  similar_tours: PublicTour[];
};

export type PublicCategory = { id: number; category_name: string; slug: string; description: string; image: string | null };
export type PublicSubcategory = { id: number; subcategory_name: string; slug: string; category_name: string };
export type PublicCountry = { id: number; country_name: string; country_code: string };
export type PublicCity = { id: number; city_name: string; country_id: number };
export type CmsBanner = { id: number; title: string; subtitle: string | null; image: string; cta_text: string | null; cta_url: string | null; sort_order: number; is_active: boolean };
export type CmsDestination = { id: number; title: string; image: string | null; description: string | null; sort_order: number; is_active: boolean };
export type CmsReview = { id: number; reviewer_name: string; reviewer_image: string | null; rating: number; review_text: string; tour_name: string | null; country: string | null; sort_order: number; is_active: boolean };
export type CmsExternalLink = { id: number; label: string; url: string; open_in_new_tab: boolean; location: string; sort_order: number; is_active: boolean };

export async function fetchPublicTours(params: Record<string, string | number>) {
  const res = await publicApi.get("/tours", { params });
  return res.data as { total: number; page: number; total_pages: number; items: PublicTour[] };
}

export async function fetchFeaturedTours(limit = 6) {
  const res = await publicApi.get("/tours/featured", { params: { limit } });
  return res.data.items as PublicTour[];
}

export async function fetchPublicTourDetail(idOrSlug: number | string, countrySlug?: string) {
  const path = countrySlug
    ? `/tours/${encodeURIComponent(countrySlug)}/${encodeURIComponent(String(idOrSlug))}`
    : `/tours/${encodeURIComponent(String(idOrSlug))}`;
  const res = await publicApi.get(path);
  return res.data.data as PublicTourDetail;
}

export async function fetchPublicCategories() {
  const res = await publicApi.get("/categories");
  return res.data.items as PublicCategory[];
}

export async function fetchPublicSubcategories(category?: string) {
  const res = await publicApi.get("/subcategories", { params: category ? { category } : {} });
  return res.data.items as PublicSubcategory[];
}

export async function fetchPublicCountries() {
  const res = await publicApi.get("/countries");
  return res.data.items as PublicCountry[];
}

export async function fetchHomepageBanners() {
  const res = await cmsApi.get("/homepage-banners", { params: { active_only: true, limit: 20 } });
  return (res.data.items || res.data.data || []) as CmsBanner[];
}

export async function fetchPopularDestinations() {
  const res = await cmsApi.get("/popular-destinations", { params: { active_only: true, limit: 20 } });
  return (res.data.items || res.data.data || []) as CmsDestination[];
}

export async function fetchCustomerReviews() {
  const res = await cmsApi.get("/customer-reviews", { params: { active_only: true, limit: 12 } });
  return (res.data.items || res.data.data || []) as CmsReview[];
}

export async function fetchFooterLinks() {
  const res = await cmsApi.get("/external-links", { params: { location: "footer", limit: 100 } });
  return ((res.data.items || res.data.data || []) as CmsExternalLink[]).filter((item) => item.is_active);
}

export async function fetchPublicSettings() {
  const res = await axios.get("/api/settings/public");
  return (res.data.data || {}) as Record<string, string>;
}
