"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuHeart as Heart,
  LuMapPin as MapPin,
  LuSparkles as Sparkles,
  LuStar as Star,
} from "react-icons/lu";
import MarketingImage from "@/components/public/MarketingImage";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import { useCurrency } from "@/hooks/useCurrency";
import { publicTourUrl } from "@/lib/utils/tourUrl";
import {
  fetchContentBlock,
  fetchFeaturedTours,
  fetchPublicTourDetail,
  fetchToursOnDeals,
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

export function TopDealCard({ tour }: { tour: Tour }) {
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

  const ratingVal = tour.rating ? tour.rating.toFixed(1) : "4.9";
  const reviewCountStr = tour.reviews || "1,842 reviews";

  return (
    <article
      data-deal-card
      className="group relative w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start flex flex-col justify-between overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:border-slate-300 hover:shadow-lg hover:-translate-y-1.5 h-full"
    >
      {/* Image with Deal badge, Location badge & Wishlist button */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-[16px] bg-slate-100 shrink-0">
        <Link href={href} className="block h-full w-full">
          <MarketingImage
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            src={tour.image}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
          />
        </Link>

        {/* Subtle vignette for badge contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none" />

        {/* Top-Left Badges */}
        <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
            <MapPin size={11} className="text-orange-400 shrink-0" />
            <span className="truncate max-w-[110px]">{tour.place}</span>
          </span>
        </div>

        {/* Wishlist button (top-right) */}
        <button
          type="button"
          onClick={() => toggleWishlist(travelItem)}
          aria-label={
            wishlisted
              ? `Remove ${tour.title} from wishlist`
              : `Add ${tour.title} to wishlist`
          }
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-700 shadow-md transition-all duration-200 hover:scale-115 active:scale-90 hover:bg-white focus:outline-none cursor-pointer"
        >
          <Heart
            size={16}
            className={
              wishlisted
                ? "fill-red-500 text-red-500"
                : "fill-slate-400/40 text-slate-700"
            }
          />
        </button>
      </div>

      {/* Tour details */}
      <div className="pt-4 flex flex-1 flex-col justify-between">
        <div>
          {/* Title and duration badge - fixed min-h so 1-line and 2-line titles match in height */}
          <div className="flex items-start justify-between gap-2.5 min-h-[46px] sm:min-h-[48px]">
            <Link href={href} className="block flex-1 min-w-0">
              <h3 className="line-clamp-2 text-base sm:text-[17px] font-bold text-slate-900 transition-colors group-hover:text-pub-secondary leading-snug">
                {tour.title}
              </h3>
            </Link>
            <span className="shrink-0 rounded-lg border border-orange-200/80 bg-orange-50/70 px-2 py-0.5 text-[10px] font-extrabold text-[#E4572E] tracking-wide">
              {tour.durationTag || "8D | 7N"}
            </span>
          </div>

          {/* 5 Yellow Stars + Rating + Review count */}
          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
            </div>
            <b className="font-extrabold text-slate-900">{ratingVal}</b>
            <span className="text-slate-400 font-medium">
              ({reviewCountStr})
            </span>
          </div>
        </div>

        {/* Price Row: From $old $new pp + View Deal button */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-semibold text-slate-400">From</span>
              {tour.originalPrice != null && (
                <span className="text-xs font-normal text-slate-400 line-through">
                  {format(tour.originalPrice, tour.currency || "USD")}
                </span>
              )}
              <strong className="text-xl sm:text-2xl font-black text-slate-950">
                {tour.rawPrice != null
                  ? format(tour.rawPrice, tour.currency || "USD")
                  : format(999, "USD")}
              </strong>
              <span className="text-xs font-bold text-slate-500">pp</span>
            </div>
          </div>

          <Link
            href={href}
            aria-label={`View deal: ${tour.title}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B1527] text-white shadow-xs transition-all duration-300 group-hover:bg-[#E4572E] group-hover:scale-108 group-hover:shadow-md active:scale-95"
          >
            <ArrowRight
              size={15}
              className="stroke-[2.5] transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

export interface TopDealsSectionProps {
  initialTours?: Tour[];
  loading?: boolean;
}

export default function TopDealsSection({
  initialTours,
  loading: initialLoading,
}: TopDealsSectionProps) {
  const [tours, setTours] = useState<Tour[]>(initialTours || []);
  const [loading, setLoading] = useState<boolean>(
    initialLoading !== undefined ? initialLoading : !initialTours?.length,
  );
  const [activeTab, setActiveTab] = useState("Top deals");
  const [sectionEnabled, setSectionEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Section can be switched off from admin/cms > Top Deals; defaults to
  // shown (true) when no admin has set it either way.
  useEffect(() => {
    let active = true;
    fetchContentBlock<SectionVisibilityBlock>("top_deals_section")
      .then((res) => {
        if (active && res?.data?.enabled === false) setSectionEnabled(false);
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

    async function loadDeals() {
      try {
        const dealTourResult = await fetchToursOnDeals();
        if (!active) return;

        if (dealTourResult && dealTourResult.length > 0) {
          const refs = dealTourResult.filter((r) => r.is_active !== false);
          const results = await Promise.allSettled(
            refs.map((ref) => fetchPublicTourDetail(ref.tour_id)),
          );

          if (!active) return;

          const loadedTours = refs
            .map((ref, index) => ({ ref, result: results[index] }))
            .filter(
              (
                entry,
              ): entry is {
                ref: (typeof refs)[number];
                result: PromiseFulfilledResult<
                  Awaited<ReturnType<typeof fetchPublicTourDetail>>
                >;
              } => entry.result.status === "fulfilled",
            )
            .map(({ ref, result }) => {
              const mapped = mapPublicTour(result.value);
              return ref.deal_label
                ? { ...mapped, discountBadge: ref.deal_label }
                : mapped;
            });

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
          const slice = mapped.slice(6, 12).length ? mapped.slice(6, 12) : mapped.slice(0, 6);
          setTours(slice);
        }
      } catch {
        // graceful failure
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDeals();

    return () => {
      active = false;
    };
  }, [initialTours]);

  // 100% Dynamic tabs based on real tour destinations in the current deals
  const tabs = useMemo(() => {
    const placesMap = new Map<string, number>();
    for (const t of tours) {
      if (!t.place) continue;
      const parts = t.place
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const dest = parts[parts.length - 1] || t.place.trim();
      if (dest && !/worldwide/i.test(dest)) {
        const canonical = dest.charAt(0).toUpperCase() + dest.slice(1);
        placesMap.set(canonical, (placesMap.get(canonical) || 0) + 1);
      }
    }

    const uniquePlaces = Array.from(placesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([place]) => place);

    if (uniquePlaces.length > 0) {
      return ["Top deals", ...uniquePlaces.map((place) => `${place} deals`)];
    }

    return ["Top deals"];
  }, [tours]);

  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0] || "Top deals");
    }
  }, [tabs, activeTab]);

  const filteredTours = useMemo(() => {
    if (activeTab === "Top deals" || activeTab === "All deals") {
      return tours;
    }
    const keyword = activeTab
      .replace(/\s+deals$/i, "")
      .toLowerCase()
      .trim();
    return tours.filter((t) => {
      const place = (t.place || "").toLowerCase();
      const title = (t.title || "").toLowerCase();
      return place.includes(keyword) || title.includes(keyword);
    });
  }, [activeTab, tours]);

  const displayTours = filteredTours;

  // Auto-slides right-to-left every few seconds; pauses on hover/touch/drag
  // or a manual arrow click, resuming shortly after.
  const { notifyInteraction } = useAutoSlide(scrollRef, {
    cardSelector: "[data-deal-card]",
    enabled: !loading && displayTours.length > 1,
  });

  if (!sectionEnabled) return null;

  const move = (direction: number) => {
    notifyInteraction();
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-deal-card]");
    const gap = 20; // 1.25rem gap-5
    const step = firstCard ? firstCard.offsetWidth + gap : 320;
    smoothScrollTo(el, el.scrollLeft + direction * step);
  };

  return (
    <section className="relative w-full overflow-hidden my-8 sm:my-12 py-10 sm:py-16 bg-gradient-to-b from-white via-[#FAF7F2] to-[#F5F0E8] border-y border-slate-200/60 shadow-2xs">
      {/* Ambient decorative gradient orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-orange-200/20 via-amber-100/15 to-transparent blur-3xl animate-float-orb" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-tl from-amber-200/15 via-orange-100/10 to-transparent blur-3xl animate-float-orb-alt" />

      <div className="relative z-10 mx-auto max-w-[1380px] px-5">
        {/* Top Filter Pills + View all deals link */}
        <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:w-auto sm:flex-wrap sm:gap-2.5 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                    active
                      ? "bg-[#E4572E] text-white shadow-md shadow-orange-500/25 scale-[1.02]"
                      : "border border-slate-200/80 bg-white/90 text-slate-700 hover:bg-white hover:border-orange-300 hover:text-slate-900 hover:scale-[1.02] shadow-2xs"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <Link
            href={
              activeTab === "All deals" || activeTab === "Top deals"
                ? "/tours?sort=price_asc"
                : `/tours?sort=price_asc&search=${encodeURIComponent(
                    activeTab.replace(/\s+deals$/i, "").trim(),
                  )}`
            }
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#E4572E] hover:text-[#c4411b] transition-colors group"
          >
            <span>View all deals</span>
            <ArrowRight
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* Header Row: Title & Arrow Buttons */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#E4572E] mb-2">
              <Sparkles
                size={12}
                className="fill-current animate-sparkle-glow"
              />
              <span>Limited Time Offers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-slate-950 tracking-tight">
              Top Deals
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
              Handpicked guided tours with verified discounts. Book early to
              lock in the lowest rates.
            </p>
          </div>

          {!loading && displayTours.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                aria-label="Previous deals"
                onClick={() => move(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-[#E4572E] hover:text-[#E4572E] hover:scale-110 active:scale-90 hover:shadow-sm cursor-pointer"
              >
                <ChevronLeft size={18} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                aria-label="Next deals"
                onClick={() => move(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-[#E4572E] hover:text-[#E4572E] hover:scale-110 active:scale-90 hover:shadow-sm cursor-pointer"
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
              <TopDealCard key={`${tour.title}-${index}`} tour={tour} />
            ))
          ) : (
            <EmptyCollection
              message="No deals found for this destination."
              href="/tours?sort=price_asc"
              linkLabel="Browse all deals"
            />
          )}
        </div>
      </div>
    </section>
  );
}
