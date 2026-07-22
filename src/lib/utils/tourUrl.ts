export function slugifyTourSegment(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function publicTourUrl(tour: { country_name?: string; place?: string; title: string; slug?: string | null }) {
  const country = slugifyTourSegment(tour.country_name || tour.place || "worldwide") || "worldwide";
  const tourSlug = slugifyTourSegment(tour.slug || tour.title) || "tour";
  return `/tours/${country}/${tourSlug}`;
}
