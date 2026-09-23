"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
} from "react-icons/lu";
import {
  fetchContentBlock,
  fetchPublicCategories,
  fetchPublicSubcategories,
  fetchPublicTourDetail,
  fetchPublicTours,
} from "@/lib/api/publicClient";
import { mapPublicTour, Tour } from "./homeTypes";
import { Reveal, TourCardSkeleton } from "./HomeHelpers";
import { HandpickedTourCard } from "./HandpickedToursSection";
import { useAutoSlide } from "./useAutoSlide";
import { smoothScrollTo } from "./smoothScrollTo";
import {
  defaultViewAllUrl,
  EXTRA_SECTIONS_BLOCK_KEY,
  HomeExtraSection,
  normalizeExtraSections,
} from "./extraSectionsTypes";
import {
  ExtraBlogsSection,
  ExtraCardsSection,
  ExtraImageTextSection,
  ExtraOfferSection,
  ExtraTextSection,
} from "./HomeExtraContentSections";

// Alternating soft backgrounds so consecutive extra sections stay visually distinct.
const BACKGROUNDS = [
  "bg-gradient-to-b from-white via-[#F0F7FF] to-[#E6F1FC]",
  "bg-gradient-to-b from-white via-[#FFF8F1] to-[#FCEFE3]",
  "bg-gradient-to-b from-white via-[#F3FAF6] to-[#EAF6EF]",
  "bg-gradient-to-b from-white via-[#F7F5FC] to-[#F0ECFA]",
];

const ARROW_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:scale-110 active:scale-90 hover:border-pub-secondary hover:text-pub-secondary hover:bg-slate-50 cursor-pointer";

const CARD_WIDTH =
  "w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)]";

// /tours silently ignores an unknown category/subcategory slug and returns
// every tour, so a section pointing at a deleted or renamed category would
// fill up with unrelated tours. Check the slug against the live lists first
// (fetched once and shared by all sections).
let knownSlugs: Promise<{ category: Set<string>; subcategory: Set<string> }> | null = null;
function getKnownSlugs() {
  knownSlugs ??= Promise.all([
    fetchPublicCategories().catch(() => []),
    fetchPublicSubcategories().catch(() => []),
  ]).then(([cats, subs]) => ({
    category: new Set(cats.map((c) => c.slug)),
    subcategory: new Set(subs.map((c) => c.slug)),
  }));
  return knownSlugs;
}

async function loadSectionTours(section: HomeExtraSection): Promise<Tour[]> {
  if (section.source === "tours") {
    if (!section.tour_ids.length) return [];
    const results = await Promise.allSettled(
      section.tour_ids.slice(0, section.limit).map((id) => fetchPublicTourDetail(id)),
    );
    return results
      .filter(
        (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchPublicTourDetail>>> =>
          r.status === "fulfilled",
      )
      .map((r) => mapPublicTour(r.value));
  }
  const param = section.source === "category" ? "category" : "subcategory";
  const slug = section[param];
  if (!slug) return [];
  const known = await getKnownSlugs();
  if (!known[param].has(slug)) return [];
  const res = await fetchPublicTours({ [param]: slug, limit: section.limit, page: 1 });
  return (res.items || []).map(mapPublicTour);
}

function ExtraTourSection({ section, index }: { section: HomeExtraSection; index: number }) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    loadSectionTours(section)
      .then((items) => {
        if (active) setTours(items);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [section]);

  const { notifyInteraction } = useAutoSlide(scrollRef, {
    cardSelector: "[data-handpicked-card]",
    enabled: !loading && tours.length > 1,
  });

  // A section with nothing to show is hidden entirely rather than rendering
  // an empty carousel on the homepage.
  if (!loading && tours.length === 0) return null;

  const move = (direction: number) => {
    notifyInteraction();
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-handpicked-card]");
    const step = firstCard ? firstCard.offsetWidth + 20 : 320;
    smoothScrollTo(el, el.scrollLeft + direction * step);
  };

  const viewAllHref = section.view_all_url.trim() || defaultViewAllUrl(section);
  const viewAllText = section.view_all_text.trim() || "View all";

  return (
    <section className={`relative w-full overflow-hidden py-14 sm:py-18 ${BACKGROUNDS[index % BACKGROUNDS.length]}`}>
      <div className="relative z-10 mx-auto max-w-[1400px] px-5">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-slate-950 tracking-tight">
              {section.title}
            </h2>
            {section.subtitle && (
              <p className="mt-1.5 max-w-2xl text-sm sm:text-base text-slate-600">{section.subtitle}</p>
            )}
          </div>

          {!loading && (
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href={viewAllHref}
                className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-pub-accent hover:underline"
              >
                {viewAllText} <ArrowRight size={14} />
              </Link>
              {tours.length > 1 && (
                <div className="flex items-center gap-2">
                  <button type="button" aria-label={`Previous ${section.title} tours`} onClick={() => move(-1)} className={ARROW_CLASS}>
                    <ChevronLeft size={16} className="stroke-[2.2]" />
                  </button>
                  <button type="button" aria-label={`Next ${section.title} tours`} onClick={() => move(1)} className={ARROW_CLASS}>
                    <ChevronRight size={16} className="stroke-[2.2]" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          ref={scrollRef}
          className="no-scrollbar reveal-stagger flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`${CARD_WIDTH} shrink-0 snap-start`}>
                  <TourCardSkeleton />
                </div>
              ))
            : tours.map((tour, i) => <HandpickedTourCard key={`${tour.id ?? tour.title}-${i}`} tour={tour} />)}
        </div>

        {!loading && (
          <Link
            href={viewAllHref}
            className="mt-2 inline-flex sm:hidden items-center gap-1 text-sm font-semibold text-pub-accent hover:underline"
          >
            {viewAllText} <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </section>
  );
}

// One request per page load, shared by every <HomeExtraSections after=...> slot.
let pendingSections: Promise<HomeExtraSection[]> | null = null;
function loadSections() {
  pendingSections ??= fetchContentBlock(EXTRA_SECTIONS_BLOCK_KEY)
    .then((res) => {
      const block = normalizeExtraSections(res?.data);
      return block.enabled ? block.sections.filter((s) => s.enabled && s.title.trim()) : [];
    })
    .catch(() => []);
  return pendingSections;
}

function ExtraSection({ section, index }: { section: HomeExtraSection; index: number }) {
  const background = BACKGROUNDS[index % BACKGROUNDS.length];
  switch (section.type) {
    case "cards":
      return <ExtraCardsSection section={section} background={background} />;
    case "offer":
      return <ExtraOfferSection section={section} />;
    case "blogs":
      return <ExtraBlogsSection section={section} background={background} />;
    case "text":
      return <ExtraTextSection section={section} background={background} />;
    case "image_text":
      return <ExtraImageTextSection section={section} background={background} />;
    default:
      return <ExtraTourSection section={section} index={index} />;
  }
}

// Admin-added sections (CMS > Home Page > "+ Add new section") that were
// placed after the built-in section `after`. Renders nothing when there are
// none there, they're switched off, or they have nothing to show.
export default function HomeExtraSections({ after }: { after: string }) {
  const [sections, setSections] = useState<HomeExtraSection[]>([]);

  useEffect(() => {
    let active = true;
    loadSections().then((all) => {
      if (active) setSections(all.filter((s) => s.after === after));
    });
    return () => {
      active = false;
    };
  }, [after]);

  if (!sections.length) return null;

  return (
    <>
      {sections.map((section, i) => (
        <Reveal key={section.id} variant="fade">
          <ExtraSection section={section} index={i} />
        </Reveal>
      ))}
    </>
  );
}
