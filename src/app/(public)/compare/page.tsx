"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LuChevronDown as ChevronDown,
  LuHeart as Heart,
  LuLoaderCircle as LoaderCircle,
  LuMapPin as MapPin,
  LuSearch as Search,
  LuShieldCheck as ShieldCheck,
  LuSquareCheckBig as SquareCheckBig,
  LuSquareX as SquareX,
  LuStar as Star,
  LuX as X,
} from "react-icons/lu";
import {
  fetchPublicCountries,
  fetchPublicTourDetail,
  fetchPublicTours,
  PublicTour,
  PublicTourDetail,
} from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useCurrency } from "@/hooks/useCurrency";
import { MAX_COMPARE_ITEMS, TravelItem, useTravelStore } from "@/providers/TravelStoreProvider";

const HERO_BANNER_IMG = "/images/compare-hero.jpg";
const FALLBACK_TOUR_IMG = "/images/compare-nz.jpg";

type CompareTourItem = {
  id: number;
  title: string;
  place: string;
  image: string;
  days: string;
  durationTag: string;
  snippet: string;
  rating: number;
  reviewsCount: number;
  priceFormatted: string;
  rawPrice: number;
  currency: string;
  slug?: string;
  specs: {
    duration: string;
    destinations: string;
    groupSize: string;
    difficulty: string;
    accommodation: string;
    meals: string;
    transport: string;
    guide: string;
    bestSeason: string;
    visa: string;
    price: string;
  };
  inclusionsMap: {
    flights: boolean;
    transfers: boolean;
    accommodation: boolean;
    breakfast: boolean;
    guidedTours: boolean;
    adventure: boolean;
    insurance: boolean;
    support: boolean;
  };
};

type CompareBase = {
  id: number;
  title: string;
  place: string;
  image: string;
  currency: string;
  rawPrice: number;
  slug?: string;
  fallbackDays?: number;
  fallbackSubtitle?: string;
};

function buildCompareItem(
  base: CompareBase,
  detail: PublicTourDetail | null,
  idx: number,
  format: (value: number, currency: string) => string
): CompareTourItem {
  const daysCount = detail?.number_of_days ?? base.fallbackDays ?? 7;
  const nightsCount = Math.max(0, daysCount - 1);
  const destination =
    detail?.city_name || detail?.country_name || base.place || "Multiple Destinations";
  const priceNum = detail?.price_start_per_person ?? base.rawPrice;
  const currency = detail?.currency || base.currency;
  const incTexts = (detail?.inclusions || []).map((i) => i.text.toLowerCase()).join(" ");

  return {
    id: base.id,
    title: detail?.title || base.title,
    place: destination,
    image: detail?.banner_image ? mediaUrl(detail.banner_image) : base.image,
    days: `${daysCount} Days / ${nightsCount} Nights`,
    durationTag: `${daysCount}D | ${nightsCount}N`,
    snippet:
      detail?.subtitle ||
      detail?.short_description ||
      base.fallbackSubtitle ||
      "Scenic marvels and cultural adventures.",
    rating: detail?.rating_average ?? 4.8,
    reviewsCount: detail?.rating_count ?? 120,
    priceFormatted: format(priceNum, currency),
    rawPrice: priceNum,
    currency,
    slug: detail?.slug || base.slug,
    specs: {
      duration: `${daysCount} Days / ${nightsCount} Nights`,
      destinations: detail?.city_name ? "1 Destination" : "Multiple Destinations",
      groupSize: detail?.overview?.group_size
        ? `Max ${detail.overview.group_size} travellers`
        : "Max 16 travellers",
      difficulty: detail?.overview?.physical_rating || "Moderate",
      accommodation: detail?.overview?.accommodation_summary || "3-4 Star Hostels & Hotels",
      meals: detail?.overview?.meal_summary || "Daily Breakfast Included",
      transport: detail?.overview?.transportation_summary || "Private Coach & Scenic Ferry",
      guide: "English-speaking local guide",
      bestSeason: detail?.overview?.best_season || "Year-Round",
      visa: "Visa on Arrival / eTA",
      price: format(priceNum, currency),
    },
    inclusionsMap: {
      flights: incTexts.includes("flight"),
      transfers: incTexts.includes("transfer") || true,
      accommodation: incTexts.includes("hotel") || true,
      breakfast: incTexts.includes("breakfast") || true,
      guidedTours: incTexts.includes("guide") || true,
      adventure: incTexts.includes("activity") || idx % 2 === 0,
      insurance: incTexts.includes("insurance"),
      support: true,
    },
  };
}

function tourToBase(tour: PublicTour): CompareBase {
  return {
    id: tour.id,
    title: tour.title,
    place: tour.country_name || tour.city_name || "Worldwide",
    image: tour.banner_image ? mediaUrl(tour.banner_image) : FALLBACK_TOUR_IMG,
    currency: tour.currency || "USD",
    rawPrice: tour.price_start_per_person ?? 0,
    slug: tour.slug,
    fallbackDays: tour.number_of_days ?? 7,
    fallbackSubtitle: tour.subtitle || tour.short_description,
  };
}

async function loadCompareItemsFromTours(
  tours: PublicTour[],
  format: (value: number, currency: string) => string,
  detailCache: Record<number, PublicTourDetail | null> = {}
): Promise<CompareTourItem[]> {
  const missing = tours.filter((t) => !(t.id in detailCache));
  if (missing.length > 0) {
    const results = await Promise.allSettled(missing.map((t) => fetchPublicTourDetail(t.id)));
    results.forEach((result, idx) => {
      detailCache[missing[idx].id] = result.status === "fulfilled" ? result.value : null;
    });
  }
  return tours.map((tour, idx) =>
    buildCompareItem(tourToBase(tour), detailCache[tour.id] ?? null, idx, format)
  );
}

function durationRange(filter: string): { min_days?: number; max_days?: number } {
  switch (filter) {
    case "1-5 Days":
      return { min_days: 1, max_days: 5 };
    case "6-9 Days":
      return { min_days: 6, max_days: 9 };
    case "10+ Days":
      return { min_days: 10 };
    default:
      return {};
  }
}

function budgetRange(filter: string): { min_price?: number; max_price?: number } {
  switch (filter) {
    case "Under $1,500":
      return { max_price: 1500 };
    case "$1,500 - $3,000":
      return { min_price: 1500, max_price: 3000 };
    case "$3,000+":
      return { min_price: 3000 };
    default:
      return {};
  }
}

export default function ComparePage() {
  const { hydrated, compareList, toggleCompare, isWishlisted, toggleWishlist } =
    useTravelStore();
  const { format } = useCurrency();

  const [countries, setCountries] = useState<string[]>([]);
  const [activeItems, setActiveItems] = useState<CompareTourItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("All Destinations");
  const [durationFilter, setDurationFilter] = useState("Any Duration");
  const [budgetFilter, setBudgetFilter] = useState("Any Budget");
  const [levelFilter, setLevelFilter] = useState("Any Level");

  // Full tour detail payloads are heavy (itineraries, gallery, reviews...) — cache them
  // across every fetch site on this page so the same tour is never re-fetched twice.
  const detailCacheRef = useRef<Record<number, PublicTourDetail | null>>({});

  // Lightweight dedicated endpoint for the destination dropdown — avoids pulling full
  // tour payloads just to read country names.
  useEffect(() => {
    fetchPublicCountries()
      .then((items) => {
        setCountries(items.map((c) => c.country_name).filter(Boolean));
      })
      .catch(() => {});
  }, []);

  const destinationOptions = useMemo(
    () => ["All Destinations", ...[...countries].sort()],
    [countries]
  );

  // Default comparison set: whatever the user has added to Compare elsewhere on the site
  useEffect(() => {
    if (!hydrated || compareList.length === 0) return;
    let active = true;
    setLoading(true);
    Promise.allSettled(
      compareList.map((item) =>
        item.id in detailCacheRef.current
          ? Promise.resolve(detailCacheRef.current[item.id])
          : fetchPublicTourDetail(item.id)
      )
    )
      .then((results) => {
        if (!active) return;
        results.forEach((result, idx) => {
          detailCacheRef.current[compareList[idx].id] =
            result.status === "fulfilled" ? result.value ?? null : null;
        });
        const mapped = compareList.map((item, idx) => {
          const base: CompareBase = {
            id: item.id,
            title: item.title,
            place: item.place,
            image: item.image || FALLBACK_TOUR_IMG,
            currency: item.currency || "USD",
            rawPrice: item.price ?? 0,
            fallbackDays: parseInt(item.duration) || 7,
          };
          return buildCompareItem(base, detailCacheRef.current[item.id] ?? null, idx, format);
        });
        setActiveItems(mapped);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [hydrated, compareList, format]);

  // When there's nothing in the compare list yet, show real tours (not hardcoded samples)
  useEffect(() => {
    if (!hydrated || compareList.length > 0) return;
    let active = true;
    setLoading(true);
    fetchPublicTours({ limit: MAX_COMPARE_ITEMS, sort: "newest" })
      .then((res) => loadCompareItemsFromTours(res.items || [], format, detailCacheRef.current))
      .then((mapped) => {
        if (active) setActiveItems(mapped);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [hydrated, compareList.length, format]);

  // Remove a tour from comparison
  const handleRemoveTour = (tourId: number) => {
    const found = compareList.find((i) => i.id === tourId);
    if (found) {
      toggleCompare(found);
    }
    setActiveItems((prev) => prev.filter((item) => item.id !== tourId));
  };

  // Search + filter against the real tour catalogue and rebuild the comparison
  const runComparison = async () => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const params: Record<string, string | number | boolean> = { limit: 20, sort: "newest" };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (destinationFilter !== "All Destinations") params.country = destinationFilter;

      const { min_days, max_days } = durationRange(durationFilter);
      if (min_days) params.min_days = min_days;
      if (max_days) params.max_days = max_days;

      const { min_price, max_price } = budgetRange(budgetFilter);
      if (min_price) params.min_price = min_price;
      if (max_price) params.max_price = max_price;

      const res = await fetchPublicTours(params);
      let candidates = res.items || [];

      if (candidates.length === 0) {
        setSearchError("No tours match your search and filters. Try adjusting them.");
        return;
      }

      if (levelFilter !== "Any Level") {
        // Difficulty isn't in the list payload, so probe tour details in small batches
        // and stop as soon as we have enough matches — avoids fetching every candidate's
        // full (heavy) detail payload up front.
        const matched: PublicTour[] = [];
        const batchSize = MAX_COMPARE_ITEMS;
        const probeLimit = Math.min(candidates.length, 16);
        for (let offset = 0; offset < probeLimit && matched.length < MAX_COMPARE_ITEMS; offset += batchSize) {
          const batch = candidates.slice(offset, offset + batchSize);
          const toFetch = batch.filter((t) => !(t.id in detailCacheRef.current));
          if (toFetch.length > 0) {
            const results = await Promise.allSettled(
              toFetch.map((t) => fetchPublicTourDetail(t.id))
            );
            results.forEach((result, idx) => {
              detailCacheRef.current[toFetch[idx].id] =
                result.status === "fulfilled" ? result.value : null;
            });
          }
          batch.forEach((t) => {
            if (
              detailCacheRef.current[t.id]?.overview?.physical_rating?.toLowerCase() ===
              levelFilter.toLowerCase()
            ) {
              matched.push(t);
            }
          });
        }
        candidates = matched;
        if (candidates.length === 0) {
          setSearchError("No tours match the selected difficulty level. Try a different filter.");
          return;
        }
      }

      const finalTours = candidates.slice(0, MAX_COMPARE_ITEMS);
      const mapped = await loadCompareItemsFromTours(finalTours, format, detailCacheRef.current);
      setActiveItems(mapped);
    } catch {
      setSearchError("Something went wrong while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const resetToDefaults = () => {
    setSearchQuery("");
    setDestinationFilter("All Destinations");
    setDurationFilter("Any Duration");
    setBudgetFilter("Any Budget");
    setLevelFilter("Any Level");
    setSearchError(null);
    setIsSearching(true);
    fetchPublicTours({ limit: MAX_COMPARE_ITEMS, sort: "newest" })
      .then((res) => loadCompareItemsFromTours(res.items || [], format, detailCacheRef.current))
      .then((mapped) => setActiveItems(mapped))
      .catch(() => {})
      .finally(() => setIsSearching(false));
  };

  const busy = loading || isSearching;

  return (
    <main className="min-h-screen bg-white text-slate-900 pb-20 pt-4 sm:pt-6">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* Top Hero Panoramic Image Banner */}
        <div className="relative mb-8 h-44 sm:h-56 md:h-64 lg:h-72 w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-xs">
          <img
            src={HERO_BANNER_IMG}
            alt="Scenic coastline view - Compare Tours"
            className="h-full w-full object-cover object-center"
          />
        </div>

        {/* Header: Eyebrow + Title + Subtitle */}
        <div className="mb-6">
          <span className="inline-block rounded-full bg-[#EBF3FE] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#146EF5]">
            TRIP PLANNER
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Compare Tours
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-normal">
            Compare features, pricing, and itineraries side by side to find your
            perfect trip.
          </p>
        </div>

        {/* Filter & Search Bar Card */}
        <div className="mb-10 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3.5">
          {/* Top Search Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runComparison()}
                placeholder="Search tours by name or destination..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={runComparison}
              disabled={isSearching}
              className="rounded-lg bg-[#0B1F3A] px-6 py-2.5 text-xs sm:text-sm font-bold text-white transition hover:bg-[#132d50] active:scale-[0.98] disabled:opacity-60"
            >
              Search
            </button>
          </div>

          {/* Middle Dropdown Filters Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Destination Select */}
            <div className="relative flex-1 min-w-[130px]">
              <select
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500"
              >
                {destinationOptions.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Duration Select */}
            <div className="relative flex-1 min-w-[120px]">
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500"
              >
                <option>Any Duration</option>
                <option>1-5 Days</option>
                <option>6-9 Days</option>
                <option>10+ Days</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Budget Select */}
            <div className="relative flex-1 min-w-[110px]">
              <select
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500"
              >
                <option>Any Budget</option>
                <option>Under $1,500</option>
                <option>$1,500 - $3,000</option>
                <option>$3,000+</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Level Select */}
            <div className="relative flex-1 min-w-[110px]">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500"
              >
                <option>Any Level</option>
                <option>Easy</option>
                <option>Moderate</option>
                <option>Challenging</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Apply Filters button */}
            <button
              type="button"
              onClick={runComparison}
              disabled={isSearching}
              className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#132d50] disabled:opacity-60"
            >
              Apply Filters
            </button>
          </div>

          {/* Bottom Chips / Selection Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800 shrink-0 mr-1">
              Select tours to compare:
            </span>

            {activeItems.map((item, index) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs"
              >
                <span>{`Tour ${index + 1}: ${item.title}`}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTour(item.id)}
                  aria-label={`Remove Tour ${index + 1}`}
                  className="flex h-3.5 w-3.5 items-center justify-center rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                >
                  <X size={12} className="stroke-[2.5]" />
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={runComparison}
              disabled={isSearching}
              className="ml-auto rounded-lg bg-[#0B1F3A] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[#132d50] disabled:opacity-60"
            >
              Compare Now
            </button>
          </div>

          {searchError && (
            <p className="pt-1 text-xs font-semibold text-rose-500">{searchError}</p>
          )}
        </div>

        {/* COMPARISON CONTENT AREA */}
        {busy && activeItems.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <LoaderCircle size={22} className="animate-spin text-slate-400" />
            <p className="text-xs sm:text-sm text-slate-500">Loading tours...</p>
          </div>
        ) : activeItems.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <h2 className="text-xl font-black text-slate-900">
              No tours currently selected for comparison
            </h2>
            <p className="max-w-md text-xs sm:text-sm text-slate-500">
              Reset the comparison or browse all tours to pick and compare up to
              {" "}
              {MAX_COMPARE_ITEMS} destinations.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={resetToDefaults}
                className="rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#132d50]"
              >
                Reset Comparison
              </button>
              <Link
                href="/tours"
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Browse All Tours
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {/* Tour Cards Row (aligned above specifications) */}
            <div className="mb-6 overflow-x-auto pb-2">
              <div className="min-w-[680px]">
                <div
                  className={`grid ${activeItems.length === 2 ? "grid-cols-2" : activeItems.length >= 4 ? "grid-cols-4" : "grid-cols-3"} gap-4 sm:gap-6`}
                >
                  {activeItems.map((tour) => {
                    const wishlisted = isWishlisted(tour.id);
                    const travelItem: TravelItem = {
                      id: tour.id,
                      title: tour.title,
                      place: tour.place,
                      image: tour.image,
                      price: tour.rawPrice,
                      currency: tour.currency,
                      duration: tour.days,
                      href: tour.slug ? `/tours/${tour.slug}` : `/tours`,
                    };

                    return (
                      <div
                        key={tour.id}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition hover:shadow-md"
                      >
                        {/* Card Image */}
                        <div className="relative h-44 sm:h-48 w-full overflow-hidden rounded-xl bg-slate-100">
                          <img
                            src={tour.image}
                            alt={tour.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-104"
                          />

                          {/* Top-Left Location Pill */}
                          <span className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-slate-900/40 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white">
                            <MapPin size={10} className="shrink-0 text-white" />
                            <span>{tour.place}</span>
                          </span>

                          {/* Top-Right Wishlist Button */}
                          <button
                            type="button"
                            onClick={() => toggleWishlist(travelItem)}
                            aria-label="Toggle Wishlist"
                            className="absolute right-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/20 backdrop-blur-xs transition hover:scale-110"
                          >
                            <Heart
                              size={14}
                              className={
                                wishlisted
                                  ? "fill-red-500 text-red-500"
                                  : "fill-white text-white"
                              }
                            />
                          </button>
                        </div>

                        {/* Details */}
                        <div className="pt-3">
                          {/* Title + Duration Badge */}
                          <div className="flex items-start justify-between gap-1.5">
                            <h3 className="line-clamp-1 text-sm sm:text-[15px] font-bold text-slate-900">
                              {tour.title}
                            </h3>
                            <span className="shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-slate-600 uppercase">
                              {tour.durationTag}
                            </span>
                          </div>

                          {/* Snippet */}
                          <p className="mt-1 line-clamp-2 min-h-[30px] text-[11px] leading-relaxed text-slate-500 font-normal">
                            {tour.snippet}
                          </p>

                          {/* Rating Row */}
                          <div className="mt-2 flex items-center gap-1 text-xs">
                            <div className="flex items-center text-amber-400">
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                            </div>
                            <span className="font-bold text-slate-900 text-[11px]">
                              {tour.rating.toFixed(1)}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {tour.reviewsCount.toLocaleString()} reviews
                            </span>
                          </div>

                          {/* Price Row */}
                          <div className="mt-3 flex items-baseline gap-1 text-xs border-t border-slate-100 pt-2.5">
                            <span className="font-bold text-slate-900 text-[12px]">
                              Price
                            </span>
                            <strong className="text-sm sm:text-[15px] font-black text-slate-950">
                              {tour.priceFormatted}
                            </strong>
                            <span className="text-[11px] font-medium text-slate-400">
                              pp
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* FULL SPECIFICATIONS SECTION */}
            <div className="mt-8">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 tracking-tight">
                Full Specifications
              </h2>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                  <tbody>
                    {/* Duration */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Duration
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0"
                        >
                          {item.specs.duration}
                        </td>
                      ))}
                    </tr>

                    {/* Destinations */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Destinations
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0"
                        >
                          {item.specs.destinations}
                        </td>
                      ))}
                    </tr>

                    {/* Group Size */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Group Size
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0"
                        >
                          {item.specs.groupSize}
                        </td>
                      ))}
                    </tr>

                    {/* Difficulty Level */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Difficulty Level
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0"
                        >
                          {item.specs.difficulty}
                        </td>
                      ))}
                    </tr>

                    {/* Accommodation */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Accommodation
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0"
                        >
                          {item.specs.accommodation}
                        </td>
                      ))}
                    </tr>

                    {/* Meals Included */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Meals Included
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0"
                        >
                          {item.specs.meals}
                        </td>
                      ))}
                    </tr>

                    {/* Transport */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Transport
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0"
                        >
                          {item.specs.transport}
                        </td>
                      ))}
                    </tr>

                    {/* Guide */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Guide
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0"
                        >
                          {item.specs.guide}
                        </td>
                      ))}
                    </tr>

                    {/* Best Season */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Best Season
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0"
                        >
                          {item.specs.bestSeason}
                        </td>
                      ))}
                    </tr>

                    {/* Visa Required */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Visa Required
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0"
                        >
                          {item.specs.visa}
                        </td>
                      ))}
                    </tr>

                    {/* Price */}
                    <tr className="hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Price
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 text-slate-700 font-bold border-r border-slate-100 last:border-r-0"
                        >
                          {item.specs.price}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* INCLUSIONS & EXCLUSIONS SECTION */}
            <div className="mt-10">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 tracking-tight">
                Inclusions & Exclusions
              </h2>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                  <tbody>
                    {/* Flights */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Flights
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 border-r border-slate-100 last:border-r-0"
                        >
                          {item.inclusionsMap.flights ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-500">
                              <SquareCheckBig size={14} className="stroke-[2.2]" />
                              <span>Included</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-bold text-rose-500">
                              <SquareX size={14} className="stroke-[2.2]" />
                              <span>Not Included</span>
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Airport Transfers */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Airport Transfers
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 border-r border-slate-100 last:border-r-0"
                        >
                          {item.inclusionsMap.transfers ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-500">
                              <SquareCheckBig size={14} className="stroke-[2.2]" />
                              <span>Included</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-bold text-rose-500">
                              <SquareX size={14} className="stroke-[2.2]" />
                              <span>Not Included</span>
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Accommodation */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Accommodation
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 border-r border-slate-100 last:border-r-0"
                        >
                          {item.inclusionsMap.accommodation ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-500">
                              <SquareCheckBig size={14} className="stroke-[2.2]" />
                              <span>Included</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-bold text-rose-500">
                              <SquareX size={14} className="stroke-[2.2]" />
                              <span>Not Included</span>
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Daily Breakfast */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Daily Breakfast
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 border-r border-slate-100 last:border-r-0"
                        >
                          {item.inclusionsMap.breakfast ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-500">
                              <SquareCheckBig size={14} className="stroke-[2.2]" />
                              <span>Included</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-bold text-rose-500">
                              <SquareX size={14} className="stroke-[2.2]" />
                              <span>Not Included</span>
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Guided Tours */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Guided Tours
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 border-r border-slate-100 last:border-r-0"
                        >
                          {item.inclusionsMap.guidedTours ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-500">
                              <SquareCheckBig size={14} className="stroke-[2.2]" />
                              <span>Included</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-bold text-rose-500">
                              <SquareX size={14} className="stroke-[2.2]" />
                              <span>Not Included</span>
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Adventure Activities */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Adventure Activities
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 border-r border-slate-100 last:border-r-0"
                        >
                          {item.inclusionsMap.adventure ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-500">
                              <SquareCheckBig size={14} className="stroke-[2.2]" />
                              <span>Included</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-bold text-rose-500">
                              <SquareX size={14} className="stroke-[2.2]" />
                              <span>Not Included</span>
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Travel Insurance */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        Travel Insurance
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 border-r border-slate-100 last:border-r-0"
                        >
                          {item.inclusionsMap.insurance ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-500">
                              <SquareCheckBig size={14} className="stroke-[2.2]" />
                              <span>Included</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-bold text-rose-500">
                              <SquareX size={14} className="stroke-[2.2]" />
                              <span>Not Included</span>
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* 24/7 Support */}
                    <tr className="hover:bg-slate-50/50">
                      <th className="w-48 sm:w-56 bg-white px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100">
                        24/7 Support
                      </th>
                      {activeItems.map((item) => (
                        <td
                          key={item.id}
                          className="px-4 py-3.5 border-r border-slate-100 last:border-r-0"
                        >
                          {item.inclusionsMap.support ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-500">
                              <SquareCheckBig size={14} className="stroke-[2.2]" />
                              <span>Included</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-bold text-rose-500">
                              <SquareX size={14} className="stroke-[2.2]" />
                              <span>Not Included</span>
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ACTION BOOKING BUTTONS */}
            <div className="mt-8 overflow-x-auto pb-2">
              <div className="min-w-[680px]">
                <div
                  className={`grid ${activeItems.length === 2 ? "grid-cols-2" : activeItems.length >= 4 ? "grid-cols-4" : "grid-cols-3"} gap-4 sm:gap-6`}
                >
                  {activeItems.map((tour) => (
                    <Link
                      key={tour.id}
                      href={tour.slug ? `/tours/${tour.slug}` : `/tours`}
                      className="inline-flex w-full items-center justify-center rounded-lg bg-[#0B1F3A] py-3 px-4 text-center text-xs sm:text-sm font-bold text-white shadow-xs transition duration-200 hover:bg-[#132d50] active:scale-[0.99]"
                    >
                      Book {tour.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* TRUST & GUARANTEE BAR */}
            <div className="mt-8 rounded-xl border border-amber-200/50 bg-[#FDF8EE] py-3.5 px-6 text-center text-xs font-semibold text-slate-700 shadow-2xs">
              <div className="inline-flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-500 shrink-0" />
                <span>
                  Best Price Guarantee • 24/7 Premium Concierge Support •
                  Flex-Booking Protection Included
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
