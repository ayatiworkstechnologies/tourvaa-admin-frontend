"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSectionCopy, text } from "./useSectionCopy";
import {
  LuArrowRight as ArrowRight,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuClock as Clock,
  LuMapPin as MapPin,
  LuSlidersHorizontal as Sliders,
  LuSparkles as Sparkles,
  LuStar as Star,
  LuUsers as Users,
} from "react-icons/lu";
import MarketingImage from "@/components/public/MarketingImage";
import WishlistButton from "@/components/public/WishlistButton";
import { useCurrency } from "@/hooks/useCurrency";
import { publicTourUrl } from "@/lib/utils/tourUrl";
import {
  fetchContentBlock,
  fetchFeaturedTours,
  fetchPopularTours,
  fetchPublicTourDetail,
  SectionVisibilityBlock,
} from "@/lib/api/publicClient";
import { mapPublicTour, stableHash, Tour } from "./homeTypes";
import { EmptyCollection, Reveal, TourCardSkeleton } from "./HomeHelpers";
import { useAutoSlide } from "./useAutoSlide";
import { smoothScrollTo } from "./smoothScrollTo";

export function TrendingTourCard({ tour }: { tour: Tour }) {
  const { format } = useCurrency();
  const itemId = tour.id ?? stableHash(tour.slug || tour.title);
  const href = tour.id
    ? publicTourUrl(tour)
    : `/tours?search=${encodeURIComponent(tour.title)}`;
  const travelItem = {
    id: itemId,
    title: tour.title,
    place: tour.place,
    image: tour.image,
    price: tour.rawPrice ?? null,
    currency: tour.currency || "USD",
    duration: tour.days,
    href,
  };

  // Only show a rating when the tour actually has reviews
  const ratingVal = tour.rating != null ? tour.rating.toFixed(1) : null;
  const reviewCountStr = tour.reviews || "";

  // Dynamic discount badge calculation
  const calculatedPct =
    tour.originalPrice && tour.rawPrice && tour.originalPrice > tour.rawPrice
      ? Math.round(
          ((tour.originalPrice - tour.rawPrice) / tour.originalPrice) * 100,
        )
      : null;
  const discountLabel =
    tour.discountBadge || (calculatedPct ? `Save ${calculatedPct}%` : null);

  return (
    <article
      data-trending-card
      className="group relative w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start flex flex-col justify-between overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:border-pub-accent hover:shadow-md h-full"
    >
      <Link href={href} className="flex flex-col h-full justify-between">
        <div>
          {/* Top Image: Edge-to-edge with seamless top rounded corners */}
          <div className="relative h-56 sm:h-60 w-full overflow-hidden rounded-t-[25px] bg-slate-100 shrink-0">
            <MarketingImage
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
              src={tour.image}
              alt={tour.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            />

            {/* Wishlist Button (top-right) with frosted backdrop */}
            <div className="absolute right-3 top-3 z-10">
              <WishlistButton
                item={travelItem}
                className="bg-white/85 backdrop-blur-md rounded-full shadow-md hover:bg-white transition"
              />
            </div>

            {/* Ambient dark gradient overlay on bottom of photo */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent pointer-events-none" />

            {/* Bottom pills directly on photo */}
            <div className="absolute inset-x-3 bottom-3 z-10 flex items-center justify-between pointer-events-none">
              {tour.days ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/15">
                  <Clock size={12} className="text-sky-300" />
                  <span>{tour.days}</span>
                </span>
              ) : (
                <span />
              )}

              {discountLabel && (
                <span className="rounded-md bg-rose-600 px-2.5 py-1 text-[10px] font-black text-white shadow-md tracking-wide uppercase">
                  {discountLabel}
                </span>
              )}
            </div>
          </div>

          {/* Card Body with comfortable padding */}
          <div className="p-4 sm:p-5">
            {/* Meta row: Location & Social Proof Rating */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-pub-accent uppercase tracking-wider text-[11px] truncate flex items-center gap-1">
                <MapPin size={11} className="text-pub-accent shrink-0" />
                <span>{tour.place || "Curated Adventure"}</span>
              </span>

              {ratingVal ? (
                <div className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 border border-amber-200/60 text-amber-900 font-bold text-[11px] shrink-0">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  <span>{ratingVal}</span>
                  {reviewCountStr && (
                    <span className="text-slate-400 font-normal">
                      ({reviewCountStr})
                    </span>
                  )}
                </div>
              ) : null}
            </div>

            {/* Title: 2 lines with proper line clamp and font heading */}
            <h3 className="mt-2.5 line-clamp-2 text-base font-bold text-slate-950 transition-colors group-hover:text-pub-secondary leading-snug font-heading min-h-[46px]">
              {tour.title}
            </h3>

            {/* Modern Spec Chips (Distinct from standard blue bullets) */}
            <div className="mt-3.5 grid grid-cols-2 gap-2 text-[11px]">
              {tour.maxGroupSize != null ? (
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-slate-600 font-medium truncate">
                  <Users size={13} className="text-pub-secondary shrink-0" />
                  <span className="truncate">
                    Max {tour.maxGroupSize} guests
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-slate-600 font-medium truncate">
                  <Sparkles size={13} className="text-pub-secondary shrink-0" />
                  <span className="truncate">Small Group</span>
                </div>
              )}

              {tour.ageRange ? (
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-slate-600 font-medium truncate">
                  <Sliders size={13} className="text-pub-secondary shrink-0" />
                  <span className="truncate">Age: {tour.ageRange}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-slate-600 font-medium truncate">
                  <Clock size={13} className="text-pub-secondary shrink-0" />
                  <span className="truncate">{tour.days || "Flexible"}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Row + Action Button (Arrow Only) */}
        <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:px-5 sm:py-3.5 flex items-center justify-between rounded-b-[25px] transition-colors duration-300 group-hover:bg-slate-50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Starting from
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              {tour.originalPrice != null && (
                <span className="text-xs font-medium text-slate-400 line-through">
                  {format(tour.originalPrice, tour.currency || "USD")}
                </span>
              )}
              <strong className="text-lg sm:text-xl font-black text-slate-950 font-heading tracking-tight">
                {tour.rawPrice != null
                  ? format(tour.rawPrice, tour.currency || "USD")
                  : "On request"}
              </strong>
              <span className="text-xs text-slate-500 font-medium">
                / person
              </span>
            </div>
          </div>

          {/* Just Arrow Button Only */}
          <span
            aria-label="Explore tour"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B1F3A] text-white shadow-xs transition-all duration-300 group-hover:bg-pub-accent group-hover:shadow-md group-hover:scale-105"
          >
            <ArrowRight
              size={17}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}

export interface TrendingToursSectionProps {
  initialTours?: Tour[];
  loading?: boolean;
}

export default function TrendingToursSection({
  initialTours,
  loading: initialLoading,
}: TrendingToursSectionProps) {
  const copy = useSectionCopy("trending_section");
  const [tours, setTours] = useState<Tour[]>(initialTours || []);
  const [loading, setLoading] = useState<boolean>(
    initialLoading !== undefined ? initialLoading : !initialTours?.length,
  );
  const [sectionEnabled, setSectionEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Section can be switched off from admin/cms > Trending Tour Packages;
  // defaults to shown (true) when no admin has set it either way.
  useEffect(() => {
    let active = true;
    fetchContentBlock<SectionVisibilityBlock>("trending_section")
      .then((res) => {
        if (active && res?.data?.enabled === false) setSectionEnabled(false);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Fast independent data loading
  useEffect(() => {
    if (initialTours && initialTours.length > 0) {
      setTours(initialTours);
      setLoading(false);
      return;
    }

    let active = true;

    async function loadTrending() {
      try {
        const popularTourResult = await fetchPopularTours();
        if (!active) return;

        if (popularTourResult && popularTourResult.length > 0) {
          const refs = popularTourResult.filter((r) => r.is_active !== false);
          const results = await Promise.allSettled(
            refs.map((ref) => fetchPublicTourDetail(ref.tour_id)),
          );

          if (!active) return;

          const loadedTours = results
            .filter(
              (
                r,
              ): r is PromiseFulfilledResult<
                Awaited<ReturnType<typeof fetchPublicTourDetail>>
              > => r.status === "fulfilled",
            )
            .map((r) => mapPublicTour(r.value));

          if (loadedTours.length > 0) {
            setTours(loadedTours);
            setLoading(false);
            return;
          }
        }

        // Fallback: load featured tours slice
        const featured = await fetchFeaturedTours(12);
        if (active && featured?.length) {
          const mapped = featured.map(mapPublicTour);
          setTours(mapped.slice(0, 6));
        }
      } catch {
        // graceful fallback
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTrending();

    return () => {
      active = false;
    };
  }, [initialTours]);

  const displayTours = tours;

  // Auto-slides right-to-left every few seconds; pauses on hover/touch/drag
  // or a manual arrow click, resuming shortly after.
  const { notifyInteraction } = useAutoSlide(scrollRef, {
    cardSelector: "[data-trending-card]",
    enabled: !loading && displayTours.length > 1,
  });

  if (!sectionEnabled) return null;

  const move = (direction: number) => {
    notifyInteraction();
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-trending-card]");
    const gap = 20;
    const step = firstCard ? firstCard.offsetWidth + gap : 320;
    smoothScrollTo(el, el.scrollLeft + direction * step);
  };

  return (
    <Reveal variant="fade-up">
      <section className="relative w-full overflow-hidden py-14 sm:py-20 bg-gradient-to-b from-white via-[#F8FAFC] to-[#F1F5F9]">
        {/* Ambient decorative glowing blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-bl from-amber-200/20 via-orange-100/15 to-transparent blur-3xl animate-float-orb" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-sky-200/15 via-slate-100/20 to-transparent blur-3xl animate-float-orb-alt" />

        <div className="relative z-10 mx-auto max-w-[1400px] px-5">
          {/* Section Header with Eyebrow and Carousel Navigation */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-semibold text-slate-950 tracking-tight font-heading flex items-center gap-2.5">
                <span>{text(copy.title, "Trending Tour Packages")}</span>
              </h2>
            </div>

            {!loading && displayTours.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  aria-label="Previous tours"
                  onClick={() => move(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-pub-accent hover:text-pub-accent hover:scale-110 active:scale-90 hover:shadow-sm cursor-pointer"
                >
                  <ChevronLeft size={18} className="stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  aria-label="Next tours"
                  onClick={() => move(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-pub-accent hover:text-pub-accent hover:scale-110 active:scale-90 hover:shadow-sm cursor-pointer"
                >
                  <ChevronRight size={18} className="stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>

          {/* Carousel list */}
          <div
            ref={scrollRef}
            className="no-scrollbar reveal-stagger flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth"
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start"
                >
                  <TourCardSkeleton />
                </div>
              ))
            ) : displayTours.length > 0 ? (
              displayTours.map((tour, index) => (
                <TrendingTourCard
                  key={`${tour.title}-${index}`}
                  tour={tour}
                />
              ))
            ) : (
              <EmptyCollection
                message="No featured tours are available yet."
                href="/tours"
                linkLabel="Browse all tours"
              />
            )}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
