"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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

const FALLBACK_DEAL_TOURS: Tour[] = [
  {
    id: 101,
    title: "Xi'an & Gobi",
    place: "China",
    image: "/images/destination-alpine.jpg",
    days: "8 Days",
    durationTag: "8D | 7N",
    reviews: "1,842 reviews",
    rating: 4.9,
    rawPrice: 999,
    originalPrice: 1299,
    currency: "USD",
    features: [],
  },
  {
    id: 102,
    title: "Beijing to Nanjing Trail",
    place: "China",
    image: "/images/destination-desert.jpg",
    days: "10 Days",
    durationTag: "10D | 9N",
    reviews: "3,215 reviews",
    rating: 4.9,
    rawPrice: 1899,
    originalPrice: 2499,
    currency: "USD",
    features: [],
  },
  {
    id: 103,
    title: "Istanbul & Cappadocia",
    place: "Turkey",
    image: "/images/hero-1.jpg",
    days: "7 Days",
    durationTag: "7D | 6N",
    reviews: "2,756 reviews",
    rating: 4.8,
    rawPrice: 899,
    originalPrice: 1199,
    currency: "USD",
    features: [],
  },
  {
    id: 104,
    title: "Ceylon Heritage Trail",
    place: "Sri Lanka",
    image: "/images/hero-2.jpg",
    days: "9 Days",
    durationTag: "9D | 8N",
    reviews: "1,523 reviews",
    rating: 4.7,
    rawPrice: 1149,
    originalPrice: 1450,
    currency: "USD",
    features: [],
  },
  {
    id: 105,
    title: "Rome & Amalfi Explorer",
    place: "Italy",
    image: "/images/hero-3.jpg",
    days: "8 Days",
    durationTag: "8D | 7N",
    reviews: "1,940 reviews",
    rating: 4.9,
    rawPrice: 1299,
    originalPrice: 1699,
    currency: "USD",
    features: [],
  },
];

function getDestinationName(place?: string): string {
  if (!place) return "Special";
  const parts = place.split(",").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || place;
}

function getDurationTag(tour: Tour): string {
  if (tour.durationTag && tour.durationTag.includes("|")) {
    return tour.durationTag;
  }
  if (!tour.days) return "8D | 7N";
  const numMatch = tour.days.match(/\d+/);
  if (numMatch) {
    const d = parseInt(numMatch[0], 10);
    const n = Math.max(1, d - 1);
    return `${d}D | ${n}N`;
  }
  return tour.days;
}

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

  const ratingVal = tour.rating ? tour.rating.toFixed(1) : "4.8";
  const reviewCountStr = tour.reviews
    ? tour.reviews.replace(/^\(|\)$/g, "")
    : "2,486 reviews";
  const destinationName = getDestinationName(tour.place);

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
      data-deal-card
      className="group relative w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-2 sm:p-2.5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-1 h-full"
    >
      <Link href={href} className="flex flex-col h-full justify-between">
        <div>
          {/* Image with Location badge, Wishlist button & Save badge */}
          <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-xl bg-slate-100 shrink-0">
            <MarketingImage
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
              src={tour.image}
              alt={tour.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
            />

            {/* Top-Left Destination Badge */}
            <span className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-[#DF6951] px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-xs pointer-events-none">
              <MapPin size={10} className="fill-white/30 text-white shrink-0" />
              <span className="truncate max-w-[100px]">{destinationName}</span>
            </span>

            {/* Wishlist Heart button (top-right) */}
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
                    ? "fill-red-500 text-red-500 drop-shadow-xs"
                    : "fill-white/70 text-slate-700 drop-shadow-xs"
                }
              />
            </button>

            {/* Discount Badge bottom-right */}
            {discountLabel && (
              <span className="absolute bottom-2.5 right-2.5 z-10 rounded-md bg-[#E53935] px-2.5 py-1 text-xs font-bold text-white shadow-md">
                {discountLabel}
              </span>
            )}
          </div>

          {/* Tour details */}
          <div className="pt-3">
            {/* Title */}
            <h3 className="truncate text-base font-semibold text-slate-900 transition-colors group-hover:text-[#DF6951] leading-snug">
              {tour.title}
            </h3>

            {/* 5 Yellow Stars + Rating + Review count */}
            <div className="mt-1.5 flex items-center gap-1 text-xs">
              <div className="flex items-center gap-0.5 text-amber-400">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <Star size={11} className="fill-amber-400 text-amber-400" />
              </div>
              <span className="font-bold text-slate-900 ml-0.5">{ratingVal}</span>
              <span className="text-slate-500">{reviewCountStr}</span>
            </div>

            {/* 4 Feature specs with blue icons */}
            <div className="mt-2.5 space-y-1 text-[11px] text-slate-600 font-medium">
              <p className="flex items-center gap-1.5">
                <Sun size={12} className="shrink-0 text-sky-500 stroke-[2]" />
                <span>{tour.days || "7 Days"}</span>
              </p>
              <p className="flex items-center gap-1.5 truncate">
                <Navigation size={12} className="shrink-0 text-sky-500 stroke-[2]" />
                <span className="truncate">{tour.place || destinationName}</span>
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

        {/* Price Row: From $old $new pp -- no button on the right */}
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
          setLoading(false);
          return;
        }

        if (active) {
          setTours(FALLBACK_DEAL_TOURS);
          setLoading(false);
        }
      } catch {
        if (active) {
          setTours(FALLBACK_DEAL_TOURS);
          setLoading(false);
        }
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

  const viewAllHref =
    activeTab === "All deals" || activeTab === "Top deals"
      ? "/deals"
      : `/tours?sort=price_asc&search=${encodeURIComponent(
          activeTab.replace(/\s+deals$/i, "").trim(),
        )}`;

  return (
    <section className="relative w-full overflow-hidden bg-white pt-2 pb-12 sm:pb-16">
      <div className="relative z-10 mx-auto max-w-[1400px] px-5">
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
                  className={`shrink-0 rounded-full px-5 py-2 text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 cursor-pointer ${
                    active
                      ? "bg-[#DF6951] text-white shadow-xs scale-[1.02]"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900 hover:scale-[1.02]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <Link
            href={viewAllHref}
            className="text-[#DF6951] hover:text-[#c8441f] text-sm font-semibold hover:underline shrink-0"
          >
            View all deals
          </Link>
        </div>

        {/* Header Row: Title & Arrow Buttons */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Top Deals
          </h2>

          {!loading && displayTours.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                aria-label="Previous deals"
                onClick={() => move(-1)}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-95 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next deals"
                onClick={() => move(1)}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-95 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
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
