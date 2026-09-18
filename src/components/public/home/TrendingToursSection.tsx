"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuHeart as Heart,
  LuMapPin as MapPin,
  LuNavigation as Navigation,
  LuSlidersHorizontal as Sliders,
  LuStar as Star,
  LuSun as Sun,
  LuUsers as Users,
} from "react-icons/lu";
import MarketingImage from "@/components/public/MarketingImage";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import { useCurrency } from "@/hooks/useCurrency";
import { publicTourUrl } from "@/lib/utils/tourUrl";
import {
  fetchContentBlock,
  fetchFeaturedTours,
  fetchPopularTours,
  fetchPublicTourDetail,
  SectionVisibilityBlock,
} from "@/lib/api/publicClient";
import {
  mapPublicTour,
  stableHash,
  Tour,
} from "./homeTypes";
import { EmptyCollection, TourCardSkeleton } from "./HomeHelpers";
import { useAutoSlide } from "./useAutoSlide";
import { smoothScrollTo } from "./smoothScrollTo";

export function TrendingTourCard({ tour }: { tour: Tour }) {
  const { isWishlisted, toggleWishlist } = useTravelStore();
  const { format } = useCurrency();
  const itemId = tour.id ?? stableHash(tour.slug || tour.title);
  const wishlisted = isWishlisted(itemId);
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

  const ratingVal = tour.rating ? tour.rating.toFixed(1) : "4.8";
  const reviewCountStr = tour.reviews || "2,486 reviews";

  // Dynamic discount badge calculation
  const calculatedPct =
    tour.originalPrice && tour.rawPrice && tour.originalPrice > tour.rawPrice
      ? Math.round(
          ((tour.originalPrice - tour.rawPrice) / tour.originalPrice) * 100,
        )
      : null;
  const discountLabel =
    tour.discountBadge ||
    (calculatedPct ? `Save ${calculatedPct}%` : "Save 25%");

  return (
    <article
      data-trending-card
      className="group relative w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 sm:p-2.5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-1 h-full"
    >
      <Link href={href} className="flex flex-col h-full justify-between">
        <div>
          {/* Top Image Container */}
          <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-xl bg-slate-100 shrink-0">
            <MarketingImage
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
              src={tour.image}
              alt={tour.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
            />

            {/* Location pill badge (top-left) */}
            <span className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-pub-accent px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-xs pointer-events-none">
              <MapPin size={10} className="fill-white/30 text-white shrink-0" />
              <span className="truncate max-w-[100px]">{tour.place || "Featured"}</span>
            </span>

            {/* Wishlist button (top-right) */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(travelItem);
              }}
              aria-label={
                wishlisted
                  ? `Remove ${tour.title} from wishlist`
                  : `Add ${tour.title} to wishlist`
              }
              className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center transition-transform duration-200 hover:scale-120 active:scale-90 focus:outline-none cursor-pointer"
            >
              <Heart
                size={18}
                className={
                  wishlisted
                    ? "fill-red-500 text-red-500"
                    : "fill-white/70 text-slate-700"
                }
              />
            </button>

            {/* Discount Pill (bottom-right of image) */}
            {discountLabel && (
              <span className="absolute bottom-2.5 right-2.5 z-10 rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-md">
                {discountLabel}
              </span>
            )}
          </div>

          {/* Tour details */}
          <div className="pt-3">
            {/* Title */}
            <h3 className="truncate text-base font-semibold text-slate-900 transition-colors group-hover:text-pub-accent leading-snug">
              {tour.title}
            </h3>

            {/* 5 Yellow Stars + Rating + Reviews */}
            <div className="mt-1.5 flex items-center gap-1 text-xs">
              <div className="flex items-center gap-0.5 text-amber-400">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <Star size={11} className="fill-amber-400 text-amber-400" />
              </div>
              <span className="font-bold text-slate-900 ml-0.5">{ratingVal}</span>
              <span className="text-slate-500 font-normal">
                ({reviewCountStr})
              </span>
            </div>

            {/* 4 Feature specs with blue icons */}
            <div className="mt-2.5 space-y-1 text-[11px] text-slate-600 font-medium">
              <p className="flex items-center gap-1.5">
                <Sun size={12} className="shrink-0 text-sky-500 stroke-[2]" />
                <span>{tour.days || "7 Days"}</span>
              </p>
              <p className="flex items-center gap-1.5 truncate">
                <Navigation size={12} className="shrink-0 text-sky-500 stroke-[2]" />
                <span className="truncate">{tour.place || "Featured Destination"}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Sliders size={12} className="shrink-0 text-sky-500 stroke-[2]" />
                <span>Age Range: 12-70</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Users size={12} className="shrink-0 text-sky-500 stroke-[2]" />
                <span>Max Group Size: 24</span>
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Row: From $old $new pp -- no button on the right */}
        <div className="mt-3 flex items-baseline gap-1.5 text-slate-900 border-t border-slate-100 pt-2.5">
          <span className="text-xs font-normal text-slate-500">From</span>
          {tour.originalPrice != null && (
            <span className="text-xs font-normal text-slate-400 line-through">
              {format(tour.originalPrice, tour.currency || "USD")}
            </span>
          )}
          <strong className="text-sm sm:text-base font-bold text-slate-950">
            {tour.rawPrice != null
              ? format(tour.rawPrice, tour.currency || "USD")
              : format(1182, "USD")}
          </strong>
          <span className="text-xs text-slate-500 font-normal">pp</span>
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
  const [tours, setTours] = useState<Tour[]>(initialTours || []);
  const [loading, setLoading] = useState<boolean>(
    initialLoading !== undefined ? initialLoading : !initialTours?.length,
  );
  const [sectionEnabled, setSectionEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Section is switched off by default (per current requirement) until
  // enabled from admin/cms > Trending Tour Packages.
  useEffect(() => {
    let active = true;
    fetchContentBlock<SectionVisibilityBlock>("trending_section")
      .then((res) => {
        if (active && res?.data?.enabled === true) setSectionEnabled(true);
      })
      .catch(() => {});
    return () => { active = false; };
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
    <section className="relative w-full overflow-hidden my-8 sm:my-12 py-10 sm:py-16 bg-gradient-to-b from-white via-[#F8FAFC] to-[#F1F5F9] border-y border-slate-200/70 shadow-2xs">
      {/* Ambient decorative glowing blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-bl from-sky-200/20 via-blue-100/15 to-transparent blur-3xl animate-float-orb" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-sky-200/15 via-slate-100/20 to-transparent blur-3xl animate-float-orb-alt" />

      <div className="relative z-10 mx-auto max-w-[1380px] px-5">
        {/* Section Header with Arrows on right */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-slate-950 tracking-tight">
              Trending Tour Packages
            </h2>
          </div>

          {!loading && displayTours.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                aria-label="Previous tours"
                onClick={() => move(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-sky-500 hover:text-sky-600 hover:scale-110 active:scale-90 hover:shadow-sm cursor-pointer"
              >
                <ChevronLeft size={18} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                aria-label="Next tours"
                onClick={() => move(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-sky-500 hover:text-sky-600 hover:scale-110 active:scale-90 hover:shadow-sm cursor-pointer"
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
              <TrendingTourCard key={`${tour.title}-${index}`} tour={tour} />
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
  );
}

