import axios from "axios";

const publicApi = axios.create({ baseURL: "/api/public" });
const cmsApi = axios.create({ baseURL: "/api/cms" });

export default publicApi;

export type PublicTour = {
  id: number;
  tour_code: string;
  supplier_name: string;
  title: string;
  slug: string;
  subtitle: string;
  price_start_per_person: number | null;
  currency: string;
  discount_percentage?: number | null;
  original_price_per_person?: number | null;
  discounted_price_per_person?: number | null;
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
  rating_average?: number | null;
  rating_count?: number;
  start_location?: string | null;
  end_location?: string | null;
  group_size?: string | null;
};

export type PublicReview = {
  id: number;
  customer_name: string;
  rating: number;
  review_text: string | null;
  created_at: string;
};

export type PublicTourDetail = PublicTour & {
  long_description: string;
  start_location: string;
  finish_location: string;
  map_image: string | null;
  image_alt_text?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  booking_deposit: number | null;
  deposit_type: "fixed" | "percentage" | null;
  deposit_percentage: number | null;
  deposit_cutoff_days: number | null;
  balance_payment_deadline_days: number | null;
  tax_percentage?: number;
  service_fee?: number;
  overview: {
    duration_text: string;
    start_location: string;
    end_location: string;
    group_size: string;
    tour_type: string;
    physical_rating: string;
    why_choose_this_tour: string | null;
    ideal_for: string | null;
    best_season: string | null;
    tour_pace: string | null;
    transportation_summary: string | null;
    accommodation_summary: string | null;
    meal_summary: string | null;
  } | null;
  itineraries: {
    day: number;
    title: string;
    description: string;
    location: string;
    accommodation: string;
    meals: string;
    transport: string;
    start_time: string;
    end_time: string;
    travel_distance: string;
    travel_duration: string;
    important_notes: string;
    activities: string;
    optional_activities?: string;
    image?: string | null;
    images?: string[];
  }[];
  highlights: { text: string; title?: string; image?: string | null; description?: string }[];
  inclusions: { text: string }[];
  exclusions: { text: string }[];
  gallery: { image_url: string; alt_text: string; is_banner: boolean }[];
  tour_video_url?: string | null;
  pricing: { persons_from: number; persons_to: number | null; price_per_person: number; child_price_per_person: number; currency: string }[];
  optional_activities: { id: number; name: string; description: string; price: number | null; currency: string; category: string; image?: string | null }[];
  accommodations: { id: number; name: string; description: string; price: number | null; category: string; image?: string | null }[];
  extensions: { id: number; title: string; description: string; duration_days: number | null; price: number | null; category: string; image?: string | null }[];
  discounts: { label: string; discount_type: string; value: number; valid_from: string | null; valid_to: string | null }[];
  calendar: { id: number; date: string; slots: number; status: string }[];
  min_advance_booking_days?: number;
  agent_no_deposit_buffer_weeks?: number;
  availability_end_date?: string | null;
  similar_tours: PublicTour[];
  cancellation_policy: { days_before_min: number; days_before_max: number | null; refund_percentage: number; description: string }[];
  reviews: PublicReview[];
};

export type PublicCategory = { id: number; category_name: string; slug: string; description: string; image: string | null; tour_count?: number };
export type PublicSubcategory = { id: number; subcategory_name: string; slug: string; category_name: string };
export type PublicCountry = { id: number; country_name: string; country_code: string; tour_count?: number };
export type PublicCity = { id: number; city_name: string; country_id: number; tour_count?: number };
export type CmsBanner = { id: number; title: string; subtitle: string | null; image: string | null; video: string | null; cta_text: string | null; cta_url: string | null; sort_order: number; is_active: boolean };
export type CmsDestination = { id: number; title: string; image: string | null; description: string | null; sort_order: number; is_active: boolean };
export type CmsReview = { id: number; reviewer_name: string; reviewer_image: string | null; rating: number; review_text: string; tour_name: string | null; country: string | null; sort_order: number; is_active: boolean };
export type CmsExternalLink = { id: number; label: string; url: string; open_in_new_tab: boolean; location: string; sort_order: number; is_active: boolean };
export type CmsPopularTour = { id: number; tour_id: number; tour_title: string; tour_code: string; sort_order: number; is_active: boolean };
export type CmsDealTour = { id: number; tour_id: number; tour_title: string; tour_code: string; deal_label: string | null; discount_percentage: number | null; sort_order: number; is_active: boolean };
export type CmsHelpArticle = { id: number; question: string; answer: string; category: string; sort_order: number; is_active: boolean };
export type CmsPromoPopup = {
  id: number;
  title: string;
  content: string | null;
  image: string | null;
  cta_text: string | null;
  cta_url: string | null;
  display_after_seconds: number | null;
  display_frequency: string | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
};
export type CmsBlog = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  author: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
};

export async function fetchPublicTours(params: Record<string, string | number | boolean>) {
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

export async function fetchPublicCategories(country?: string) {
  const res = await publicApi.get("/categories", { params: country ? { country } : {} });
  return res.data.items as PublicCategory[];
}

export type ExternalDayTrip = {
  product_code: string;
  title: string;
  description: string | null;
  image_url: string | null;
  rating: number | null;
  review_count: number | null;
  from_price: number | null;
  currency: string | null;
  duration_label: string | null;
  booking_url: string;
};

export async function fetchExternalDayTrips() {
  const res = await publicApi.get("/external-day-trips");
  return res.data as {
    configured: boolean;
    destination_name: string;
    stale: boolean;
    items: ExternalDayTrip[];
  };
}

export async function fetchViatorRedirectUrl() {
  const res = await publicApi.get("/viator/redirect-url");
  return res.data.url as string;
}

export async function fetchPublicSubcategories(category?: string) {
  const res = await publicApi.get("/subcategories", { params: category ? { category } : {} });
  return res.data.items as PublicSubcategory[];
}

export async function fetchPublicCountries() {
  const res = await publicApi.get("/countries");
  return res.data.items as PublicCountry[];
}

export async function fetchPublicCities(country?: string) {
  const res = await publicApi.get("/cities", { params: country ? { country } : {} });
  return res.data.items as PublicCity[];
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

export async function fetchPopularTours() {
  // published_only: true - a pinned tour can be unpublished after pinning;
  // without this the homepage would try to fetch a tour it can't see and
  // 404. See services/website_cms.py list_popular_tours.
  const res = await cmsApi.get("/popular-tours", { params: { active_only: true, published_only: true, limit: 20 } });
  return (res.data.items || res.data.data || []) as CmsPopularTour[];
}

export async function fetchToursOnDeals() {
  const res = await cmsApi.get("/tours-on-deals", { params: { active_only: true, published_only: true, limit: 20 } });
  return (res.data.items || res.data.data || []) as CmsDealTour[];
}

export async function fetchHelpCentre() {
  const res = await cmsApi.get("/help-centre", { params: { active_only: true, limit: 50 } });
  return (res.data.items || res.data.data || []) as CmsHelpArticle[];
}

export async function fetchPromotionalPopups() {
  const res = await cmsApi.get("/promotional-popups", { params: { active_only: true, limit: 20 } });
  return (res.data.items || res.data.data || []) as CmsPromoPopup[];
}

export async function fetchFooterLinks() {
  const res = await cmsApi.get("/external-links", { params: { location: "footer", limit: 100 } });
  return ((res.data.items || res.data.data || []) as CmsExternalLink[]).filter((item) => item.is_active);
}

export async function fetchPublicBlogs() {
  const res = await cmsApi.get("/blogs", { params: { active_only: true, limit: 100 } });
  return (res.data.items || res.data.data || []) as CmsBlog[];
}

export async function fetchPublicBlogBySlug(slug: string) {
  const res = await cmsApi.get("/blogs", { params: { active_only: true, slug, limit: 1 } });
  const items = (res.data.items || res.data.data || []) as CmsBlog[];
  return items[0] ?? null;
}

export async function fetchPublicSettings() {
  const res = await axios.get("/api/settings/public");
  return (res.data.data || {}) as Record<string, string>;
}

export async function subscribeNewsletter(email: string) {
  await publicApi.post("/newsletter/subscribe", { email });
}
