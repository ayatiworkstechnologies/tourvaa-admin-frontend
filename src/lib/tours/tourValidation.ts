// Field-level validation for the tour editor's item forms (highlights, itinerary days,
// pricing slabs, add-ons, discounts, ...). Mirrors the backend payload rules in
// app/schemas/tours.py so a mistake is caught next to the field instead of coming back
// as a 422 toast. Each validator returns { fieldName: message }; empty = valid.

export type FieldErrors = Record<string, string>;

const isBlank = (v: unknown) => v === undefined || v === null || String(v).trim() === "";
const num = (v: unknown) => (isBlank(v) ? NaN : Number(v));

function required(errors: FieldErrors, field: string, value: unknown, message: string) {
  if (isBlank(value)) errors[field] = message;
}

function maxLength(errors: FieldErrors, field: string, value: unknown, max: number, label: string) {
  if (!errors[field] && !isBlank(value) && String(value).length > max) errors[field] = `${label} can be at most ${max} characters (currently ${String(value).length}).`;
}

function nonNegative(errors: FieldErrors, field: string, value: unknown, label: string) {
  if (errors[field] || isBlank(value)) return;
  const n = num(value);
  if (Number.isNaN(n)) errors[field] = `${label} must be a number.`;
  else if (n < 0) errors[field] = `${label} cannot be negative.`;
}

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

export function validateHighlight(v: { title?: string; short_description?: string; display_order?: unknown }): FieldErrors {
  const e: FieldErrors = {};
  required(e, "title", v.title, "Give the highlight a title, e.g. \"Sunset dhow cruise\".");
  maxLength(e, "title", v.title, 255, "Title");
  nonNegative(e, "display_order", v.display_order, "Order");
  return e;
}

/** Inclusions and exclusions share one shape. */
export function validateInclusion(v: { title?: string; description?: string; display_order?: unknown }, label = "Item"): FieldErrors {
  const e: FieldErrors = {};
  required(e, "title", v.title, `${label} text is required, e.g. "Airport transfers".`);
  maxLength(e, "title", v.title, 255, "Title");
  nonNegative(e, "display_order", v.display_order, "Order");
  return e;
}

export function validateItineraryDay(
  v: {
    day_number?: unknown; day_title?: string; location_name?: string; accommodation?: string;
    start_time?: string; end_time?: string; image_alt_text?: string; meals_included?: string;
  },
  opts: { tourDays?: number; existingDayNumbers?: number[] } = {},
): FieldErrors {
  const e: FieldErrors = {};
  const day = num(v.day_number);
  if (Number.isNaN(day) || !Number.isInteger(day) || day < 1) e.day_number = "Day number must be a whole number, 1 or more.";
  else if (opts.existingDayNumbers?.includes(day)) e.day_number = `Day ${day} already exists - edit that day or choose another number.`;
  else if (opts.tourDays && day > opts.tourDays) e.day_number = `This tour is ${opts.tourDays} day${opts.tourDays === 1 ? "" : "s"} long - change the tour's duration first, or use a day up to ${opts.tourDays}.`;
  required(e, "day_title", v.day_title, "Add a short title for the day, e.g. \"Arrival and city walk\".");
  maxLength(e, "day_title", v.day_title, 255, "Day title");
  maxLength(e, "location_name", v.location_name, 255, "Location");
  maxLength(e, "accommodation", v.accommodation, 255, "Accommodation");
  maxLength(e, "meals_included", v.meals_included, 150, "Meals");
  maxLength(e, "image_alt_text", v.image_alt_text, 180, "Image description");
  for (const f of ["start_time", "end_time"] as const) {
    if (!isBlank(v[f]) && !TIME_RE.test(String(v[f]).trim())) e[f] = "Use a 24-hour time like 09:30.";
  }
  if (!e.start_time && !e.end_time && !isBlank(v.start_time) && !isBlank(v.end_time)) {
    const toMin = (t: string) => { const [h, m] = t.trim().split(":").map(Number); return h * 60 + m; };
    if (toMin(String(v.end_time)) <= toMin(String(v.start_time))) e.end_time = "End time must be after the start time.";
  }
  return e;
}

// Overlapping slabs are allowed (the pricing engine picks the narrowest matching band), so
// only each slab's own numbers are checked here.
export function validatePricingSlab(
  v: { passenger_from?: unknown; passenger_to?: unknown; adult_price?: unknown; child_price?: unknown; commission_percentage?: unknown },
): FieldErrors {
  const e: FieldErrors = {};
  const from = num(v.passenger_from);
  const to = num(v.passenger_to);
  if (Number.isNaN(from) || !Number.isInteger(from) || from < 1) e.passenger_from = "Minimum travellers must be a whole number, 1 or more.";
  if (Number.isNaN(to) || !Number.isInteger(to) || to < 1) e.passenger_to = "Maximum travellers must be a whole number, 1 or more.";
  else if (!e.passenger_from && to < from) e.passenger_to = "Maximum travellers cannot be less than the minimum.";
  if (isBlank(v.adult_price)) e.adult_price = "Enter the adult price per traveller.";
  else if (Number.isNaN(num(v.adult_price)) || num(v.adult_price) <= 0) e.adult_price = "Adult price must be greater than 0.";
  nonNegative(e, "child_price", v.child_price, "Child price");
  if (!isBlank(v.commission_percentage)) {
    const c = num(v.commission_percentage);
    if (Number.isNaN(c) || c < 0 || c > 100) e.commission_percentage = "Commission must be between 0% and 100%.";
  }
  return e;
}

export function validateActivity(v: {
  activity_name?: string; price_per_person?: unknown; child_price_per_person?: unknown; infant_price_per_person?: unknown; pricing_mode?: string;
}): FieldErrors {
  const e: FieldErrors = {};
  required(e, "activity_name", v.activity_name, "Name the activity, e.g. \"Desert safari\".");
  maxLength(e, "activity_name", v.activity_name, 255, "Activity name");
  if (isBlank(v.price_per_person)) e.price_per_person = "Enter the price per person (0 if it is free).";
  else nonNegative(e, "price_per_person", v.price_per_person, "Price");
  if (v.pricing_mode === "per_passenger_type") {
    nonNegative(e, "child_price_per_person", v.child_price_per_person, "Child price");
    nonNegative(e, "infant_price_per_person", v.infant_price_per_person, "Infant price");
  }
  return e;
}

export function validateAccommodation(v: { accommodation_name?: string; extra_price?: unknown }): FieldErrors {
  const e: FieldErrors = {};
  required(e, "accommodation_name", v.accommodation_name, "Name the accommodation option, e.g. \"Deluxe sea-view room\".");
  maxLength(e, "accommodation_name", v.accommodation_name, 255, "Name");
  nonNegative(e, "extra_price", v.extra_price, "Extra price");
  return e;
}

export function validateExtension(v: { extension_tour_id?: unknown; extension_title?: string; extra_price?: unknown }): FieldErrors {
  const e: FieldErrors = {};
  if (isBlank(v.extension_tour_id) || Number(v.extension_tour_id) < 1) e.extension_tour_id = "Choose the tour this extension adds.";
  maxLength(e, "extension_title", v.extension_title, 255, "Title");
  nonNegative(e, "extra_price", v.extra_price, "Extra price");
  return e;
}

export function validateDiscount(v: {
  discount_name?: string; discount_code?: string | null; discount_type?: string; discount_value?: unknown;
  start_date?: string | null; end_date?: string | null; usage_limit?: unknown; minimum_booking_amount?: unknown;
}): FieldErrors {
  const e: FieldErrors = {};
  required(e, "discount_name", v.discount_name, "Name the discount, e.g. \"Early bird 10%\".");
  maxLength(e, "discount_name", v.discount_name, 255, "Name");
  if (!isBlank(v.discount_code)) {
    if (!/^[A-Za-z0-9_-]+$/.test(String(v.discount_code).trim())) e.discount_code = "Codes use letters, numbers, hyphens and underscores only, with no spaces.";
    else maxLength(e, "discount_code", v.discount_code, 50, "Code");
  }
  if (isBlank(v.discount_value)) e.discount_value = "Enter the discount amount.";
  else {
    const n = num(v.discount_value);
    if (Number.isNaN(n) || n <= 0) e.discount_value = "The discount must be more than 0.";
    else if (v.discount_type === "percentage" && n > 100) e.discount_value = "A percentage discount cannot be more than 100%.";
  }
  if (v.start_date && v.end_date && new Date(v.end_date) < new Date(v.start_date)) e.end_date = "The end date must be on or after the start date.";
  if (!isBlank(v.usage_limit)) {
    const u = num(v.usage_limit);
    if (Number.isNaN(u) || !Number.isInteger(u) || u < 1) e.usage_limit = "Usage limit must be a whole number, 1 or more (or leave blank for unlimited).";
  }
  nonNegative(e, "minimum_booking_amount", v.minimum_booking_amount, "Minimum booking amount");
  return e;
}

/** A cancellation/refund rule applies from `days_before_tour_min` up to `days_before_tour_max` days before departure. */
export function validateRefundRule(v: { days_before_tour_min?: unknown; days_before_tour_max?: unknown; refund_percentage?: unknown }): FieldErrors {
  const e: FieldErrors = {};
  const min = num(v.days_before_tour_min);
  if (isBlank(v.days_before_tour_min)) e.days_before_tour_min = "Enter how many days before departure this rule starts (0 = departure day).";
  else if (Number.isNaN(min) || !Number.isInteger(min) || min < 0) e.days_before_tour_min = "Days must be a whole number, 0 or more.";
  if (!isBlank(v.days_before_tour_max)) {
    const max = num(v.days_before_tour_max);
    if (Number.isNaN(max) || !Number.isInteger(max) || max < 0) e.days_before_tour_max = "Days must be a whole number, 0 or more.";
    else if (!e.days_before_tour_min && max < min) e.days_before_tour_max = "The upper limit cannot be lower than the lower limit.";
  }
  if (isBlank(v.refund_percentage)) e.refund_percentage = "Enter the percentage refunded (0 for no refund).";
  else {
    const p = num(v.refund_percentage);
    if (Number.isNaN(p) || p < 0 || p > 100) e.refund_percentage = "Refund must be between 0% and 100%.";
  }
  return e;
}

export function firstErrorField(errors: FieldErrors): string | undefined {
  return Object.keys(errors)[0];
}
