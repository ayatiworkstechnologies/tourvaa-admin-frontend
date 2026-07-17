import axios from "axios";

const publicApi = axios.create({ baseURL: "/api/public" });

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
  city_name: string;
  category_name: string;
  number_of_days: number | null;
  number_of_hours: number | null;
  short_description: string;
  banner_image: string | null;
  status: string;
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
  calendar: { date: string; slots: number; status: string }[];
  similar_tours: PublicTour[];
};

export type PublicCategory = { id: number; category_name: string; slug: string; description: string; image: string | null };
export type PublicSubcategory = { id: number; subcategory_name: string; slug: string; category_name: string };
export type PublicCountry = { id: number; country_name: string; country_code: string };
export type PublicCity = { id: number; city_name: string; country_id: number };

export async function fetchPublicTours(params: Record<string, string | number>) {
  const res = await publicApi.get("/tours", { params });
  return res.data as { total: number; page: number; total_pages: number; items: PublicTour[] };
}

export async function fetchFeaturedTours(limit = 6) {
  const res = await publicApi.get("/tours/featured", { params: { limit } });
  return res.data.items as PublicTour[];
}

export async function fetchPublicTourDetail(id: number) {
  const res = await publicApi.get(`/tours/${id}`);
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
