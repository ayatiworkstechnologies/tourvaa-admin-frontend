// Readable "what changed" between two tour version snapshots, for the admin
// approval screen. Groups changes by the same sections the tour editor uses and
// diffs list resources (itinerary days, pricing slabs, ...) item by item instead
// of dumping raw JSON.

type Snapshot = Record<string, unknown>;

export type FieldChange = { field: string; before: string; after: string };
export type ItemChange = {
  kind: "added" | "removed" | "changed";
  label: string;
  fields: FieldChange[];
};
export type SectionChange = { key: string; label: string; items: ItemChange[] };

type SectionDef = { key: string; label: string; scalars?: string[]; lists?: string[]; objects?: string[] };

// Order = the order of the editor steps.
const SECTIONS: SectionDef[] = [
  { key: "basic", label: "Basic Information", scalars: ["title", "subtitle", "slug", "number_of_days", "number_of_hours", "short_description", "long_description", "currency"] },
  { key: "location", label: "Location & Category", scalars: ["country_name", "city_name", "category_name", "start_location", "finish_location"] },
  { key: "overview", label: "Overview & Highlights", objects: ["overview"], lists: ["highlights"] },
  { key: "itinerary", label: "Itinerary", lists: ["itinerary"] },
  { key: "pricing", label: "Pricing & Discounts", scalars: ["price_start_per_person"], lists: ["pricing", "discounts"] },
  { key: "calendar", label: "Calendar & Availability", lists: ["calendar", "unavailable_dates"] },
  { key: "accommodation", label: "Accommodation & Activities", lists: ["accommodations", "activities"] },
  { key: "extras", label: "Extensions & Similar Tours", lists: ["extensions", "similar_tours"] },
  { key: "inclusions", label: "Inclusions & Exclusions", lists: ["inclusions", "exclusions"] },
  { key: "media", label: "Media & Gallery", scalars: ["banner_image", "map_image"], lists: ["gallery"] },
  { key: "seo", label: "SEO", scalars: ["seo_title", "seo_description"] },
];

// Server bookkeeping / counters that change without the supplier editing anything.
const IGNORED_FIELDS = new Set(["id", "tour_id", "created_at", "updated_at", "booked_seats", "used_count", "display_order", "similar_tour_id", "extension_tour_id", "category_id", "country_id"]);

const FIELD_LABELS: Record<string, string> = {
  price_start_per_person: "Starting price per person",
  number_of_days: "Number of days",
  number_of_hours: "Number of hours",
  seo_title: "SEO title",
  seo_description: "SEO description",
  banner_image: "Banner image",
  map_image: "Map image",
  passenger_from: "Travellers from",
  passenger_to: "Travellers to",
  supplier_price: "Supplier price",
  adult_price: "Adult price",
  child_price: "Child price",
  final_price: "Final price",
  extra_price: "Extra price",
  meals_included: "Meals included",
};

const LIST_LABELS: Record<string, string> = {
  highlights: "Highlight",
  itinerary: "Itinerary day",
  pricing: "Pricing slab",
  discounts: "Discount",
  calendar: "Departure",
  unavailable_dates: "Blocked date",
  accommodations: "Accommodation",
  activities: "Activity",
  extensions: "Extension",
  similar_tours: "Similar tour",
  inclusions: "Inclusion",
  exclusions: "Exclusion",
  gallery: "Gallery image",
};

export function fieldLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  const spaced = key.replaceAll("_", " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "(empty)";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length === 0 ? "(empty)" : value.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}(T|$)/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }
  return String(value);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function itemLabel(listKey: string, item: Record<string, unknown>, index: number): string {
  const pick = (...keys: string[]) => keys.map((k) => item[k]).find((v) => typeof v === "string" && v.trim()) as string | undefined;
  switch (listKey) {
    case "itinerary":
      return `Day ${item.day_number ?? index + 1}${pick("day_title") ? ` - ${pick("day_title")}` : ""}`;
    case "pricing":
      return `${item.passenger_from ?? "?"}-${item.passenger_to ?? "+"} travellers`;
    case "calendar":
      return formatValue(item.tour_date);
    case "unavailable_dates":
      return formatValue(item.unavailable_date);
    case "similar_tours":
      return pick("similar_tour_title", "similar_tour_code") ?? `Tour #${item.similar_tour_id}`;
    case "extensions":
      return pick("extension_title", "extension_tour_title") ?? `Extension ${index + 1}`;
    case "accommodations":
      return pick("accommodation_name") ?? `Accommodation ${index + 1}`;
    case "activities":
      return pick("activity_name") ?? `Activity ${index + 1}`;
    case "discounts":
      return pick("discount_name", "discount_code") ?? `Discount ${index + 1}`;
    case "gallery":
      return pick("image_title", "image_caption") ?? (typeof item.image_path === "string" ? item.image_path.split("/").pop() ?? `Image ${index + 1}` : `Image ${index + 1}`);
    default:
      return pick("title", "name", "label") ?? `${LIST_LABELS[listKey] ?? "Item"} ${index + 1}`;
  }
}

function diffFields(before: Record<string, unknown>, after: Record<string, unknown>): FieldChange[] {
  const out: FieldChange[] = [];
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (IGNORED_FIELDS.has(key)) continue;
    if (same(before[key], after[key])) continue;
    out.push({ field: fieldLabel(key), before: formatValue(before[key]), after: formatValue(after[key]) });
  }
  return out;
}

function asRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value.filter((v) => v && typeof v === "object") as Record<string, unknown>[]) : [];
}

function diffList(listKey: string, prevRaw: unknown, nextRaw: unknown): ItemChange[] {
  const prev = asRecords(prevRaw);
  const next = asRecords(nextRaw);
  const usedPrev = new Set<number>();
  const changes: ItemChange[] = [];
  const prefix = LIST_LABELS[listKey] ?? "Item";

  const matchFor = (item: Record<string, unknown>, index: number): number => {
    // Same id first; rows re-created by a restore get new ids, so fall back to the same label.
    let found = item.id != null ? prev.findIndex((p, i) => !usedPrev.has(i) && p.id === item.id) : -1;
    if (found === -1) found = prev.findIndex((p, i) => !usedPrev.has(i) && itemLabel(listKey, p, i) === itemLabel(listKey, item, index));
    return found;
  };

  next.forEach((item, index) => {
    const at = matchFor(item, index);
    const label = `${prefix}: ${itemLabel(listKey, item, index)}`;
    if (at === -1) {
      changes.push({ kind: "added", label, fields: [] });
      return;
    }
    usedPrev.add(at);
    const fields = diffFields(prev[at], item);
    if (fields.length) changes.push({ kind: "changed", label, fields });
  });
  prev.forEach((item, index) => {
    if (!usedPrev.has(index)) changes.push({ kind: "removed", label: `${prefix}: ${itemLabel(listKey, item, index)}`, fields: [] });
  });
  return changes;
}

/** `previous` undefined = first submission: everything present counts as new. */
export function diffTourSnapshots(previous: Snapshot | undefined, next: Snapshot | undefined): SectionChange[] {
  const before = previous ?? {};
  const after = next ?? {};
  const result: SectionChange[] = [];

  for (const section of SECTIONS) {
    const items: ItemChange[] = [];

    const scalarFields: FieldChange[] = [];
    for (const key of section.scalars ?? []) {
      if (!same(before[key], after[key])) scalarFields.push({ field: fieldLabel(key), before: formatValue(before[key]), after: formatValue(after[key]) });
    }
    if (scalarFields.length) items.push({ kind: "changed", label: section.label, fields: scalarFields });

    for (const key of section.objects ?? []) {
      const b = (before[key] ?? {}) as Record<string, unknown>;
      const a = (after[key] ?? {}) as Record<string, unknown>;
      const fields = diffFields(b, a);
      if (fields.length) items.push({ kind: "changed", label: fieldLabel(key), fields });
    }

    for (const key of section.lists ?? []) items.push(...diffList(key, before[key], after[key]));

    if (items.length) result.push({ key: section.key, label: section.label, items });
  }
  return result;
}

export function summarizeChanges(sections: SectionChange[]): string {
  const n = sections.reduce((sum, s) => sum + s.items.length, 0);
  return `${n} change${n === 1 ? "" : "s"} in ${sections.length} section${sections.length === 1 ? "" : "s"}`;
}
