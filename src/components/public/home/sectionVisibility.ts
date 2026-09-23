import { useEffect, useState } from "react";
import { fetchContentBlock } from "@/lib/api/publicClient";

// Show/hide switches for the built-in homepage sections (CMS > Home Page,
// the switch next to each section). Stored as { [sectionKey]: boolean } in
// one content block; a missing key means "shown", so an empty block renders
// the homepage exactly as before. Top Deals and Trending keep their own
// `enabled` flag in their section blocks instead.
export const SECTION_VISIBILITY_BLOCK_KEY = "home_section_visibility";

export type HomeSectionKey =
  | "top-bar"
  | "hero"
  | "slogan"
  | "favourite"
  | "about"
  | "blog"
  | "handpicked"
  | "countries"
  | "testimonials"
  | "directory"
  | "airport"
  | "faq"
  | "support"
  | "offers";

export type SectionVisibility = Partial<Record<string, boolean>>;

// One request per page load, shared by the header, the hero and the page body.
let pending: Promise<SectionVisibility> | null = null;
function loadVisibility() {
  pending ??= fetchContentBlock<SectionVisibility>(SECTION_VISIBILITY_BLOCK_KEY)
    .then((res) => (res?.data ?? {}) as SectionVisibility)
    .catch(() => ({}));
  return pending;
}

export function useSectionVisibility(): (key: HomeSectionKey) => boolean {
  const [map, setMap] = useState<SectionVisibility>({});
  useEffect(() => {
    let active = true;
    loadVisibility().then((m) => {
      if (active) setMap(m);
    });
    return () => {
      active = false;
    };
  }, []);
  return (key) => map[key] !== false;
}
