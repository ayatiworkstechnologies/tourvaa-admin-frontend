"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuMapPin as MapPin,
  LuStar as Star,
} from "react-icons/lu";
import MarketingImage from "@/components/public/MarketingImage";
import WishlistButton from "@/components/public/WishlistButton";
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

function getDestinationName(place?: string): string {
  if (!place) return "Special";
  const parts = place.split(",").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || place;
}

function getDurationTag(tour: Tour): string {
  if (tour.durationTag && tour.durationTag.includes("|")) {
    return tour.durationTag;
  }
  if (!tour.days) return "7D | 6N";
  const numMatch = tour.days.match(/\d+/);
  if (numMatch) {
    const d = parseInt(numMatch[0], 10);
    const n = Math.max(1, d - 1);
    return `${d}D | ${n}N`;
  }
  return tour.days;
}

export function TopDealCard({ tour }: { tour: Tour }) {
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

  const ratingVal = tour.rating != null && tour.rating > 0 ? tour.rating.toFixed(1) : "4.9";
  const reviewCountStr = tour.reviews
    ? tour.reviews.replace(/^\(|\)$/g, "").includes("review")
      ? tour.reviews.replace(/^\(|\)$/g, "")
      : `${tour.reviews.replace(/^\(|\)$/g, "")} reviews`
    : "1,842 reviews";
  const destinationName = getDestinationName(tour.place);
  const durationTag = getDurationTag(tour);

  const originalPriceVal =
    tour.originalPrice != null && tour.rawPrice != null && tour.originalPrice > tour.rawPrice
      ? tour.originalPrice
      : tour.rawPrice != null
      ? Math.round(tour.rawPrice * 1.3)
      : null;

  const calculatedPct =
    originalPriceVal != null && tour.rawPrice != null && originalPriceVal > tour.rawPrice
      ? Math.round(((originalPriceVal - tour.rawPrice) / originalPriceVal) * 100)
      : null;

  const discountLabel =
    tour.discountBadge ||
    (calculatedPct && calculatedPct > 0 ? `Save ${calculatedPct}%` : null);

  return (
    <article
      data-deal-card
      className="group relative w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 h-full"
    >
      <Link href={href} className="flex flex-col h-full justify-between">
        {/* Rounded Image with overlaid badges */}
        <div className="relative aspect-[16/10] sm:aspect-[4/3] md:h-52 w-full overflow-hidden rounded-2xl bg-slate-100 shrink-0 shadow-2xs">
          <MarketingImage
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            src={tour.image}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
          />

          {/* Top-Left Destination Badge */}
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#DF6951] px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs pointer-events-none">
            <MapPin size={11} className="shrink-0 text-white fill-white/20" />
            <span className="truncate max-w-[110px]">{destinationName}</span>
          </span>

          {/* Wishlist button (top-right) */}
          <WishlistButton item={travelItem} className="absolute right-3 top-3" />

          {/* Discount Badge (bottom-right of image) */}
          {discountLabel && (
            <span className="absolute bottom-3 right-3 z-10 inline-flex items-center rounded-lg bg-[#E53935] px-2.5 py-1 text-xs font-bold text-white shadow-md pointer-events-none">
              {discountLabel}
            </span>
          )}
        </div>

        {/* Card content below image on the page background */}
        <div className="flex flex-col flex-1 pt-3 pb-1">
          {/* Title row with duration tag */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-[#DF6951] leading-snug line-clamp-1 flex-1 min-w-0">
              {tour.title}
            </h3>
            {durationTag && (
              <span className="shrink-0 rounded-md border border-[#93C5FD] bg-white px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-[#3B82F6] tracking-tight whitespace-nowrap">
                {durationTag}
              </span>
            )}
          </div>

          {/* Rating + review count */}
          <div className="mt-1.5 flex items-center gap-1 text-xs">
            <div className="flex items-center gap-0.5 text-amber-400">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={
                    i < Math.round(Number(ratingVal))
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-200"
                  }
                />
              ))}
            </div>
            <span className="font-bold text-slate-900 ml-0.5">{ratingVal}</span>
            <span className="text-slate-500 font-normal text-xs ml-1">
              {reviewCountStr}
            </span>
          </div>

          {/* Price Row: From $old $new pp with discount savings pill */}
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-semibold text-slate-800">From</span>
            {originalPriceVal != null && (
              <span className="text-xs font-normal text-slate-400 line-through mr-1">
                {format(originalPriceVal, tour.currency || "USD")}
              </span>
            )}
            <strong className="text-base sm:text-lg font-black text-slate-950">
              {tour.rawPrice != null
                ? format(tour.rawPrice, tour.currency || "USD")
                : "On request"}
            </strong>
            {tour.rawPrice != null && (
              <span className="text-xs sm:text-sm font-medium text-slate-800 ml-0.5">pp</span>
            )}
          </div>
        </div>
      </Link>
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

        // Fallback to featured tours slice
        const featured = await fetchFeaturedTours(12);
        if (active && featured?.length) {
          const mapped = featured.map(mapPublicTour);
          const slice = mapped.slice(6, 12).length ? mapped.slice(6, 12) : mapped.slice(0, 6);
          setTours(slice);
          setLoading(false);
          return;
        }

        if (active) {
          setTours([]);
          setLoading(false);
        }
      } catch {
        if (active) {
          setTours([]);
          setLoading(false);
        }
      }
    }

    loadDeals();

    return () => {
      active = false;
    };
  }, [initialTours]);

  // Dynamic tabs based on real tour destinations in the current deals
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
      return ["Top deals", ...uniquePlaces.slice(0, 4).map((place) => `${place} deals`)];
    }

    return ["Top deals", "China deals", "Turkey deals", "Italy deals"];
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
    const matches = tours.filter((t) => {
      const place = (t.place || "").toLowerCase();
      const title = (t.title || "").toLowerCase();
      return place.includes(keyword) || title.includes(keyword);
    });
    return matches.length > 0 ? matches : tours;
  }, [activeTab, tours]);

  const displayTours = filteredTours;

  // Auto-slides right-to-left every few seconds; pauses on hover/touch/drag
  // or a manual arrow click, resuming shortly after.
  const { notifyInteraction } = useAutoSlide(scrollRef, {
    cardSelector: "[data-deal-card]",
    enabled: !loading && displayTours.length > 1,
  });

  if (!sectionEnabled || (!loading && displayTours.length === 0)) return null;

  const move = (direction: number) => {
    notifyInteraction();
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-deal-card]");
    const gap = 20; // 1.25rem gap-5
    const step = firstCard ? firstCard.offsetWidth + gap : 320;
    smoothScrollTo(el, el.scrollLeft + direction * step);
  };

  const viewAllHref =
    activeTab === "All deals" || activeTab === "Top deals"
      ? "/deals"
      : `/tours?sort=price_asc&search=${encodeURIComponent(
          activeTab.replace(/\s+deals$/i, "").trim(),
        )}`;

  return (
    <section className="relative w-full overflow-hidden bg-pub-bg py-12 sm:py-16">
      <div className="relative z-10 mx-auto max-w-[1400px] px-5">
        {/* Top Header Row: Badge, Title & Subtitle (Left) + Explore Deals (Right) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-[#DF6951] px-3.5 py-1 text-[11px] font-bold text-white shadow-2xs">
              Offer Ends Soon
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Big Adventures. Smaller Prices. Save up to 60% off.
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-normal">
              Explore handpicked tours at special prices and make your next journey one to remember.
            </p>
          </div>

          <div className="shrink-0 pt-1 md:pt-0">
            <Link
              href="/deals"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
            >
              <span>Explore Deals</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Filter Pills row (Left) + View all deals & Prev/Next (Right) */}
        <div className="mt-8 mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-[#DF6951] text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Right controls: View all deals + Prev / Next */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Link
              href={viewAllHref}
              className="text-xs sm:text-sm font-semibold text-[#DF6951] hover:underline"
            >
              View all deals
            </Link>

            {!loading && displayTours.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Previous deals"
                  onClick={() => move(-1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-950 active:scale-95 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Next deals"
                  onClick={() => move(1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-950 active:scale-95 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carousel list */}
        <div
          ref={scrollRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth"
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

