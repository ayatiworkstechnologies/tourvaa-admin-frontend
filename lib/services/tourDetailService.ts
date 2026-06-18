import api from "@/lib/api";

const base = (tourId: number | string) => `/tours/${tourId}`;

// ── Overview ────────────────────────────────────────────────────────────────

export type TourOverview = {
  id?: number;
  tour_id?: number;
  duration_text: string;
  start_location: string;
  end_location: string;
  group_size: string;
  tour_type: string;
  physical_rating: "easy" | "moderate" | "hard";
  overview_icon_data?: Record<string, string>[] | null;
};

export async function getOverview(tourId: number | string): Promise<TourOverview | null> {
  const r = await api.get<{ data: TourOverview | null }>(`${base(tourId)}/overview`);
  return r.data.data;
}
export async function saveOverview(tourId: number | string, data: TourOverview): Promise<TourOverview> {
  const r = await api.post<{ data: TourOverview }>(`${base(tourId)}/overview`, data);
  return r.data.data;
}

// ── Itinerary ────────────────────────────────────────────────────────────────

export type ItineraryDay = {
  id?: number;
  tour_id?: number;
  day_number: number;
  day_title: string;
  location_name: string;
  short_description: string;
  long_description: string;
  activities: string;
  image: string;
  image_alt_text: string;
  display_order: number;
  status: string;
};

export async function getItineraries(tourId: number | string): Promise<ItineraryDay[]> {
  const r = await api.get<{ data: ItineraryDay[] }>(`${base(tourId)}/itineraries`);
  return r.data.data;
}
export async function createItinerary(tourId: number | string, data: ItineraryDay): Promise<ItineraryDay> {
  const r = await api.post<{ data: ItineraryDay }>(`${base(tourId)}/itineraries`, data);
  return r.data.data;
}
export async function updateItinerary(tourId: number | string, itineraryId: number, data: ItineraryDay): Promise<ItineraryDay> {
  const r = await api.put<{ data: ItineraryDay }>(`${base(tourId)}/itineraries/${itineraryId}`, data);
  return r.data.data;
}
export async function deleteItinerary(tourId: number | string, itineraryId: number): Promise<void> {
  await api.delete(`${base(tourId)}/itineraries/${itineraryId}`);
}
export async function reorderItineraries(tourId: number | string, orderedIds: number[]): Promise<void> {
  await api.patch(`${base(tourId)}/itineraries/reorder`, { ordered_ids: orderedIds });
}

// ── Inclusion / Exclusion ─────────────────────────────────────────────────────

export type TourItem = {
  id?: number;
  tour_id?: number;
  icon: string;
  title: string;
  description: string;
  display_order: number;
  status: string;
};

async function _itemList(tourId: number | string, segment: string): Promise<TourItem[]> {
  const r = await api.get<{ data: TourItem[] }>(`${base(tourId)}/${segment}`);
  return r.data.data;
}
async function _itemCreate(tourId: number | string, segment: string, data: TourItem): Promise<TourItem> {
  const r = await api.post<{ data: TourItem }>(`${base(tourId)}/${segment}`, data);
  return r.data.data;
}
async function _itemUpdate(tourId: number | string, segment: string, id: number, data: TourItem): Promise<TourItem> {
  const r = await api.put<{ data: TourItem }>(`${base(tourId)}/${segment}/${id}`, data);
  return r.data.data;
}
async function _itemDelete(tourId: number | string, segment: string, id: number): Promise<void> {
  await api.delete(`${base(tourId)}/${segment}/${id}`);
}

export const getInclusions = (id: number | string) => _itemList(id, "inclusions");
export const createInclusion = (id: number | string, data: TourItem) => _itemCreate(id, "inclusions", data);
export const updateInclusion = (id: number | string, rid: number, data: TourItem) => _itemUpdate(id, "inclusions", rid, data);
export const deleteInclusion = (id: number | string, rid: number) => _itemDelete(id, "inclusions", rid);

export const getExclusions = (id: number | string) => _itemList(id, "exclusions");
export const createExclusion = (id: number | string, data: TourItem) => _itemCreate(id, "exclusions", data);
export const updateExclusion = (id: number | string, rid: number, data: TourItem) => _itemUpdate(id, "exclusions", rid, data);
export const deleteExclusion = (id: number | string, rid: number) => _itemDelete(id, "exclusions", rid);

// ── Highlight ─────────────────────────────────────────────────────────────────

export type TourHighlight = {
  id?: number;
  tour_id?: number;
  image: string;
  title: string;
  short_description: string;
  display_order: number;
  status: string;
};

export async function getHighlights(tourId: number | string): Promise<TourHighlight[]> {
  const r = await api.get<{ data: TourHighlight[] }>(`${base(tourId)}/highlights`);
  return r.data.data;
}
export async function createHighlight(tourId: number | string, data: TourHighlight): Promise<TourHighlight> {
  const r = await api.post<{ data: TourHighlight }>(`${base(tourId)}/highlights`, data);
  return r.data.data;
}
export async function updateHighlight(tourId: number | string, id: number, data: TourHighlight): Promise<TourHighlight> {
  const r = await api.put<{ data: TourHighlight }>(`${base(tourId)}/highlights/${id}`, data);
  return r.data.data;
}
export async function deleteHighlight(tourId: number | string, id: number): Promise<void> {
  await api.delete(`${base(tourId)}/highlights/${id}`);
}

// ── Similar Tours ─────────────────────────────────────────────────────────────

export type SimilarTour = {
  id?: number;
  tour_id?: number;
  similar_tour_id: number;
  similar_tour_title?: string;
  display_order: number;
  status: string;
};

export async function getSimilarTours(tourId: number | string): Promise<SimilarTour[]> {
  const r = await api.get<{ data: SimilarTour[] }>(`${base(tourId)}/similar-tours`);
  return r.data.data;
}
export async function addSimilarTour(tourId: number | string, similar_tour_id: number, display_order = 0): Promise<SimilarTour> {
  const r = await api.post<{ data: SimilarTour }>(`${base(tourId)}/similar-tours`, { similar_tour_id, display_order });
  return r.data.data;
}
export async function deleteSimilarTour(tourId: number | string, similarId: number): Promise<void> {
  await api.delete(`${base(tourId)}/similar-tours/${similarId}`);
}

// ── Extensions ────────────────────────────────────────────────────────────────

export type TourExtension = {
  id?: number;
  tour_id?: number;
  extension_tour_id: number;
  extension_tour_title?: string;
  extension_title: string;
  extension_note: string;
  extra_price: number;
  display_order: number;
  status: string;
};

export async function getExtensions(tourId: number | string): Promise<TourExtension[]> {
  const r = await api.get<{ data: TourExtension[] }>(`${base(tourId)}/extensions`);
  return r.data.data;
}
export async function createExtension(tourId: number | string, data: TourExtension): Promise<TourExtension> {
  const r = await api.post<{ data: TourExtension }>(`${base(tourId)}/extensions`, data);
  return r.data.data;
}
export async function updateExtension(tourId: number | string, id: number, data: TourExtension): Promise<TourExtension> {
  const r = await api.put<{ data: TourExtension }>(`${base(tourId)}/extensions/${id}`, data);
  return r.data.data;
}
export async function deleteExtension(tourId: number | string, id: number): Promise<void> {
  await api.delete(`${base(tourId)}/extensions/${id}`);
}

// ── Gallery ───────────────────────────────────────────────────────────────────

export type GalleryImage = {
  id?: number;
  tour_id?: number;
  image_path: string;
  image_title: string;
  image_alt_text: string;
  image_caption: string;
  image_type: string;
  display_order: number;
  status: string;
};

export async function getGallery(tourId: number | string): Promise<GalleryImage[]> {
  const r = await api.get<{ data: GalleryImage[] }>(`${base(tourId)}/gallery`);
  return r.data.data;
}
export async function createGalleryImage(tourId: number | string, data: GalleryImage): Promise<GalleryImage> {
  const r = await api.post<{ data: GalleryImage }>(`${base(tourId)}/gallery`, data);
  return r.data.data;
}
export async function updateGalleryImage(tourId: number | string, id: number, data: GalleryImage): Promise<GalleryImage> {
  const r = await api.put<{ data: GalleryImage }>(`${base(tourId)}/gallery/${id}`, data);
  return r.data.data;
}
export async function deleteGalleryImage(tourId: number | string, id: number): Promise<void> {
  await api.delete(`${base(tourId)}/gallery/${id}`);
}

// ── Pricing ───────────────────────────────────────────────────────────────────

export type PricingSlab = {
  id?: number;
  tour_id?: number;
  passenger_from: number;
  passenger_to: number;
  adult_price: number;
  child_price: number;
  supplier_price: number;
  markup_type: string;
  markup_value: number;
  final_price: number;
  currency: string;
  status: string;
};

export async function getPricing(tourId: number | string): Promise<PricingSlab[]> {
  const r = await api.get<{ data: PricingSlab[] }>(`${base(tourId)}/pricing`);
  return r.data.data;
}
export async function createPricing(tourId: number | string, data: PricingSlab): Promise<PricingSlab> {
  const r = await api.post<{ data: PricingSlab }>(`${base(tourId)}/pricing`, data);
  return r.data.data;
}
export async function updatePricing(tourId: number | string, id: number, data: PricingSlab): Promise<PricingSlab> {
  const r = await api.put<{ data: PricingSlab }>(`${base(tourId)}/pricing/${id}`, data);
  return r.data.data;
}
export async function deletePricing(tourId: number | string, id: number): Promise<void> {
  await api.delete(`${base(tourId)}/pricing/${id}`);
}

// ── Optional Activities ───────────────────────────────────────────────────────

export type OptionalActivity = {
  id?: number;
  tour_id?: number;
  activity_name: string;
  description: string;
  price_per_person: number;
  image: string;
  status: string;
};

export async function getOptionalActivities(tourId: number | string): Promise<OptionalActivity[]> {
  const r = await api.get<{ data: OptionalActivity[] }>(`${base(tourId)}/optional-activities`);
  return r.data.data;
}
export async function createOptionalActivity(tourId: number | string, data: OptionalActivity): Promise<OptionalActivity> {
  const r = await api.post<{ data: OptionalActivity }>(`${base(tourId)}/optional-activities`, data);
  return r.data.data;
}
export async function updateOptionalActivity(tourId: number | string, id: number, data: OptionalActivity): Promise<OptionalActivity> {
  const r = await api.put<{ data: OptionalActivity }>(`${base(tourId)}/optional-activities/${id}`, data);
  return r.data.data;
}
export async function deleteOptionalActivity(tourId: number | string, id: number): Promise<void> {
  await api.delete(`${base(tourId)}/optional-activities/${id}`);
}

// ── Accommodation Extras ──────────────────────────────────────────────────────

export type AccommodationExtra = {
  id?: number;
  tour_id?: number;
  accommodation_name: string;
  description: string;
  extra_price: number;
  price_type: "per_person" | "per_booking";
  is_default: boolean;
  status: string;
};

export async function getAccommodationExtras(tourId: number | string): Promise<AccommodationExtra[]> {
  const r = await api.get<{ data: AccommodationExtra[] }>(`${base(tourId)}/accommodation-extras`);
  return r.data.data;
}
export async function createAccommodationExtra(tourId: number | string, data: AccommodationExtra): Promise<AccommodationExtra> {
  const r = await api.post<{ data: AccommodationExtra }>(`${base(tourId)}/accommodation-extras`, data);
  return r.data.data;
}
export async function updateAccommodationExtra(tourId: number | string, id: number, data: AccommodationExtra): Promise<AccommodationExtra> {
  const r = await api.put<{ data: AccommodationExtra }>(`${base(tourId)}/accommodation-extras/${id}`, data);
  return r.data.data;
}
export async function deleteAccommodationExtra(tourId: number | string, id: number): Promise<void> {
  await api.delete(`${base(tourId)}/accommodation-extras/${id}`);
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export type CalendarEntry = {
  id?: number;
  tour_id?: number;
  tour_date: string;
  start_date?: string | null;
  end_date?: string | null;
  available_seats: number;
  booked_seats: number;
  status: string;
};

export async function getCalendar(tourId: number | string): Promise<CalendarEntry[]> {
  const r = await api.get<{ data: CalendarEntry[] }>(`${base(tourId)}/calendar`);
  return r.data.data;
}
export async function createCalendarEntry(tourId: number | string, data: CalendarEntry): Promise<CalendarEntry> {
  const r = await api.post<{ data: CalendarEntry }>(`${base(tourId)}/calendar`, data);
  return r.data.data;
}
export async function updateCalendarEntry(tourId: number | string, id: number, data: CalendarEntry): Promise<CalendarEntry> {
  const r = await api.put<{ data: CalendarEntry }>(`${base(tourId)}/calendar/${id}`, data);
  return r.data.data;
}
export async function deleteCalendarEntry(tourId: number | string, id: number): Promise<void> {
  await api.delete(`${base(tourId)}/calendar/${id}`);
}

// ── Unavailable Dates ─────────────────────────────────────────────────────────

export type UnavailableDate = {
  id?: number;
  tour_id?: number;
  unavailable_date: string;
  reason: string;
};

export async function getUnavailableDates(tourId: number | string): Promise<UnavailableDate[]> {
  const r = await api.get<{ data: UnavailableDate[] }>(`${base(tourId)}/unavailable-dates`);
  return r.data.data;
}
export async function createUnavailableDate(tourId: number | string, data: UnavailableDate): Promise<UnavailableDate> {
  const r = await api.post<{ data: UnavailableDate }>(`${base(tourId)}/unavailable-dates`, data);
  return r.data.data;
}
export async function deleteUnavailableDate(tourId: number | string, id: number): Promise<void> {
  await api.delete(`${base(tourId)}/unavailable-dates/${id}`);
}

// ── Discounts ─────────────────────────────────────────────────────────────────

export type TourDiscount = {
  id?: number;
  tour_id?: number;
  discount_name: string;
  discount_code?: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  discount_scope: string;
  start_date?: string | null;
  end_date?: string | null;
  usage_limit?: number | null;
  used_count?: number;
  minimum_booking_amount: number;
  status: string;
};

export async function getDiscounts(tourId: number | string): Promise<TourDiscount[]> {
  const r = await api.get<{ data: TourDiscount[] }>(`${base(tourId)}/discounts`);
  return r.data.data;
}
export async function createDiscount(tourId: number | string, data: TourDiscount): Promise<TourDiscount> {
  const r = await api.post<{ data: TourDiscount }>(`${base(tourId)}/discounts`, data);
  return r.data.data;
}
export async function updateDiscount(tourId: number | string, id: number, data: TourDiscount): Promise<TourDiscount> {
  const r = await api.put<{ data: TourDiscount }>(`${base(tourId)}/discounts/${id}`, data);
  return r.data.data;
}
export async function deleteDiscount(tourId: number | string, id: number): Promise<void> {
  await api.delete(`${base(tourId)}/discounts/${id}`);
}
