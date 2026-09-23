// Shape of the "home_extra_sections" content block (CMS > Home Page >
// "+ Add new section"). Shared by the admin editor and the public homepage
// renderer so both read/write the same JSON.

export type ExtraSectionSource = "category" | "subcategory" | "tours";

// What an added section shows. "tours" is a tour carousel; the others are
// free content blocks (same shapes as the CMS Pages section builder), plus an
// offer banner and a latest-blog-posts grid.
export type ExtraSectionType = "tours" | "cards" | "offer" | "blogs" | "text" | "image_text";

export const EXTRA_SECTION_TYPES: { type: ExtraSectionType; label: string; description: string }[] = [
  { type: "tours", label: "Tour list", description: "A carousel of tours from a category, subcategory or hand-picked list" },
  { type: "cards", label: "Card grid", description: "Your own cards - image, title, text and link each" },
  { type: "offer", label: "Offer card", description: "A promo banner with badge, image and a button" },
  { type: "blogs", label: "Blog cards", description: "Your latest published blog posts" },
  { type: "text", label: "Text", description: "A heading with paragraphs of text" },
  { type: "image_text", label: "Image + text", description: "An image beside a heading, text and optional button" },
];

export type ExtraSectionCard = { image: string; title: string; description: string; link: string };

export type HomeExtraSection = {
  id: string;
  enabled: boolean;
  type: ExtraSectionType;
  // Shown as the section heading.
  title: string;
  subtitle: string;
  // Key of the built-in homepage section this one is shown after.
  after: string;
  // --- content fields (used by the types noted) ---
  body: string; // text, image_text
  image: string; // offer, image_text
  image_position: "left" | "right"; // image_text
  badge: string; // offer
  button_text: string; // offer, image_text
  button_link: string; // offer, image_text
  cards: ExtraSectionCard[]; // cards
  // --- tour list fields ---
  source: ExtraSectionSource;
  // Category / subcategory slug, used when source is "category" / "subcategory".
  category: string;
  subcategory: string;
  // Hand-picked tour ids, in display order, used when source is "tours".
  tour_ids: number[];
  limit: number; // tours, blogs
  view_all_text: string; // tours, blogs
  view_all_url: string; // tours, blogs
};

export type HomeExtraSectionsBlock = {
  enabled: boolean;
  sections: HomeExtraSection[];
};

export const EXTRA_SECTIONS_BLOCK_KEY = "home_extra_sections";
export const EXTRA_SECTION_DEFAULT_LIMIT = 8;

// Built-in homepage sections a custom section can be placed after, top to
// bottom. Keys match the admin section list and useSectionVisibility.
export const EXTRA_SECTION_ANCHORS: { key: string; label: string }[] = [
  { key: "hero", label: "Hero & Offer Strip" },
  { key: "top-deals", label: "Top Deals" },
  { key: "favourite", label: "Favourite Countries" },
  { key: "about", label: "About Tourvaa" },
  { key: "trending", label: "Trending Tours" },
  { key: "blog", label: "Blog Card" },
  { key: "handpicked", label: "Handpicked Tours" },
  { key: "countries", label: "Countries Worth Exploring" },
  { key: "testimonials", label: "Testimonials" },
  { key: "directory", label: "Popular Searches" },
  { key: "airport", label: "Airport Transfers" },
  { key: "faq", label: "FAQ" },
  { key: "support", label: "Support Card" },
  { key: "offers", label: "Special Offers Card" },
];
export const DEFAULT_EXTRA_SECTION_ANCHOR = "countries";

export function newExtraSectionId() {
  return `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyExtraSection(title = "", after = DEFAULT_EXTRA_SECTION_ANCHOR, type: ExtraSectionType = "tours"): HomeExtraSection {
  return {
    id: newExtraSectionId(),
    enabled: true,
    type,
    title,
    subtitle: "",
    after,
    body: "",
    image: "",
    image_position: "left",
    badge: "",
    button_text: "",
    button_link: "",
    cards: [],
    source: "category",
    category: "",
    subcategory: "",
    tour_ids: [],
    limit: EXTRA_SECTION_DEFAULT_LIMIT,
    view_all_text: "",
    view_all_url: "",
  };
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

// Tolerates missing/garbled fields so a half-saved block never breaks the page.
export function normalizeExtraSections(data: Record<string, unknown> | null | undefined): HomeExtraSectionsBlock {
  const raw = Array.isArray(data?.sections) ? (data.sections as Record<string, unknown>[]) : [];
  return {
    enabled: data?.enabled !== false,
    sections: raw
      .filter((s) => s && typeof s === "object")
      .map((s) => {
        const source = s.source === "subcategory" || s.source === "tours" ? s.source : "category";
        const limit = Number(s.limit);
        const after = str(s.after);
        const type = EXTRA_SECTION_TYPES.find((t) => t.type === s.type)?.type ?? "tours";
        return {
          id: str(s.id) || newExtraSectionId(),
          enabled: s.enabled !== false,
          type,
          title: str(s.title),
          subtitle: str(s.subtitle),
          after: EXTRA_SECTION_ANCHORS.some((a) => a.key === after) ? after : DEFAULT_EXTRA_SECTION_ANCHOR,
          body: str(s.body),
          image: str(s.image),
          image_position: s.image_position === "right" ? "right" : "left",
          badge: str(s.badge),
          button_text: str(s.button_text),
          button_link: str(s.button_link),
          cards: Array.isArray(s.cards)
            ? (s.cards as Record<string, unknown>[])
                .filter((c) => c && typeof c === "object")
                .map((c) => ({ image: str(c.image), title: str(c.title), description: str(c.description), link: str(c.link) }))
            : [],
          source,
          category: str(s.category),
          subcategory: str(s.subcategory),
          tour_ids: Array.isArray(s.tour_ids)
            ? (s.tour_ids as unknown[]).map(Number).filter((n) => Number.isInteger(n) && n > 0)
            : [],
          limit: Number.isFinite(limit) && limit > 0 ? Math.min(Math.round(limit), 20) : EXTRA_SECTION_DEFAULT_LIMIT,
          view_all_text: str(s.view_all_text),
          view_all_url: str(s.view_all_url),
        };
      }),
  };
}

// Where "View all" goes when the admin leaves the link blank.
export function defaultViewAllUrl(section: HomeExtraSection): string {
  if (section.type === "blogs") return "/blogs";
  if (section.source === "category" && section.category) return `/tours?category=${encodeURIComponent(section.category)}`;
  if (section.source === "subcategory" && section.subcategory) return `/tours?subcategory=${encodeURIComponent(section.subcategory)}`;
  return "/tours";
}
