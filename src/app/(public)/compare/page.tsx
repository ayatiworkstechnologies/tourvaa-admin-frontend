"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LuArrowRight as ArrowRight,
  LuCheck as Check,
  LuCircleCheck as CircleCheck,
  LuCircleX as CircleX,
  LuClock as Clock,
  LuMapPin as MapPin,
  LuPlus as Plus,
  LuScale as Scale,
  LuSearch as Search,
  LuSparkles as Sparkles,
  LuStar as Star,
  LuTrash2 as Trash2,
  LuUsers as Users,
  LuX as X,
} from "react-icons/lu";
import {
  fetchFeaturedTours,
  fetchPublicTourDetail,
  fetchPublicTours,
  PublicTour,
  PublicTourDetail,
} from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { publicTourUrl } from "@/lib/utils/tourUrl";
import { useCurrency } from "@/hooks/useCurrency";
import WishlistButton from "@/components/public/WishlistButton";
import Loader from "@/components/ui/Loader";
import {
  MAX_COMPARE_ITEMS,
  TravelItem,
  useTravelStore,
} from "@/providers/TravelStoreProvider";

const HERO_BANNER_IMG = "/images/compare-hero.jpg";
const FALLBACK_TOUR_IMG = "/images/compare-nz.jpg";

const POPULAR_SEARCH_KEYWORDS = [
  "Switzerland",
  "India",
  "Georgia",
  "Australia",
  "New Zealand",
  "City Breaks",
  "Adventure",
];

type CompareTourItem = {
  id: number;
  title: string;
  place: string;
  country_name?: string;
  country_flag?: string;
  city_name?: string;
  category_name?: string;
  image: string;
  days: string;
  durationTag: string;
  snippet: string;
  rating: number | null;
  reviewsCount: number;
  priceFormatted: string;
  rawPrice: number;
  currency: string;
  slug?: string;
  specs: {
    duration: string;
    destinations: string;
    category: string;
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
  country_name?: string;
  country_flag?: string;
  city_name?: string;
  category_name?: string;
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
  format: (value: number, currency: string) => string,
): CompareTourItem {
  const daysCount = detail?.number_of_days ?? base.fallbackDays ?? null;
  const nightsCount = typeof daysCount === "number" ? Math.max(0, daysCount - 1) : null;
  const destination =
    detail?.city_name && detail?.country_name
      ? `${detail.city_name}, ${detail.country_name}`
      : detail?.city_name || detail?.country_name || base.place || "Worldwide";
  const priceNum = detail?.price_start_per_person ?? base.rawPrice;
  const currency = detail?.currency || base.currency;

  const incTexts = (detail?.inclusions || [])
    .map((i) => i.text.toLowerCase())
    .join(" ");
  const excTexts = (detail?.exclusions || [])
    .map((e) => e.text.toLowerCase())
    .join(" ");

  const accommodationSummary = detail?.overview?.accommodation_summary || "";
  const accommodationEvidence = `${accommodationSummary} ${incTexts}`.toLowerCase();
  const accommodationExplicitlyExcluded =
    /(?:no accommodation|accommodation\s*(?:is)?\s*not included|accommodation\s*:\s*no|without accommodation|own accommodation)/i.test(
      accommodationEvidence,
    );
  const accommodationIncluded =
    typeof daysCount === "number" &&
    daysCount > 1 &&
    !accommodationExplicitlyExcluded &&
    /\b(accommodation|hotel|overnight stay|lodging|resort)\b/i.test(accommodationEvidence);

  return {
    id: base.id,
    title: detail?.title || base.title,
    place: destination,
    country_name: detail?.country_name || base.country_name,
    country_flag: detail?.country_flag || base.country_flag,
    city_name: detail?.city_name || base.city_name,
    category_name: detail?.category_name || base.category_name || "Guided Tour",
    image: detail?.banner_image ? mediaUrl(detail.banner_image) : base.image,
    days: daysCount == null ? "Flexible Duration" : `${daysCount} Days / ${nightsCount} Nights`,
    durationTag: daysCount == null ? "Flexible" : `${daysCount}D / ${nightsCount}N`,
    snippet:
      detail?.subtitle ||
      detail?.short_description ||
      base.fallbackSubtitle ||
      "Comprehensive guided tour with curated experiences and highlights.",
    rating:
      (detail?.rating_count ?? 0) > 0 && detail?.rating_average != null
        ? detail.rating_average
        : null,
    reviewsCount: detail?.rating_count ?? 0,
    priceFormatted: format(priceNum, currency),
    rawPrice: priceNum,
    currency,
    slug: detail?.slug || base.slug,
    specs: {
      duration: daysCount == null ? "Flexible" : `${daysCount} Days / ${nightsCount} Nights`,
      destinations: destination,
      category: detail?.category_name || base.category_name || "Guided Tour",
      groupSize: detail?.overview?.group_size
        ? `Max ${detail.overview.group_size} travellers`
        : detail?.max_group_size
        ? `Max ${detail.max_group_size} travellers`
        : "Small group experience",
      difficulty: detail?.overview?.physical_rating || detail?.suitable_age_range || "Moderate",
      accommodation:
        accommodationSummary ||
        (typeof daysCount === "number" && daysCount <= 1
          ? "Day trip (No overnight stay)"
          : accommodationIncluded
          ? "Curated hotel / resort stays included"
          : "Standard tour accommodations"),
      meals:
        detail?.overview?.meal_summary ||
        (incTexts.includes("breakfast") ? "Daily breakfast included" : "Check itinerary details"),
      transport:
        detail?.overview?.transportation_summary ||
        (incTexts.includes("transfer") ? "Air-conditioned private/group transfers" : "Included as per itinerary"),
      guide:
        incTexts.includes("guide") || detail?.overview?.guide_style
          ? "Professional English-speaking guide"
          : "Local host & coordinator",
      bestSeason: detail?.overview?.best_season || "Year-round availability",
      visa: "Check entry visa requirements",
      price: `${format(priceNum, currency)} per person`,
    },
    inclusionsMap: {
      flights: !excTexts.includes("flight") && incTexts.includes("flight"),
      transfers:
        !excTexts.includes("airport transfer") &&
        (incTexts.includes("transfer") || incTexts.includes("pickup") || incTexts.includes("airport")),
      accommodation: accommodationIncluded,
      breakfast: !excTexts.includes("breakfast") && (incTexts.includes("breakfast") || incTexts.includes("meals")),
      guidedTours: !excTexts.includes("guide") && (incTexts.includes("guide") || incTexts.includes("sightseeing")),
      adventure:
        incTexts.includes("activity") ||
        incTexts.includes("adventure") ||
        incTexts.includes("boat") ||
        incTexts.includes("safari"),
      insurance: !excTexts.includes("insurance") && incTexts.includes("insurance"),
      support: true,
    },
  };
}

function tourToBase(tour: PublicTour): CompareBase {
  return {
    id: tour.id,
    title: tour.title,
    place:
      tour.city_name && tour.country_name
        ? `${tour.city_name}, ${tour.country_name}`
        : tour.country_name || tour.city_name || "Worldwide",
    country_name: tour.country_name,
    country_flag: tour.country_flag,
    city_name: tour.city_name,
    category_name: tour.category_name,
    image: tour.banner_image ? mediaUrl(tour.banner_image) : FALLBACK_TOUR_IMG,
    currency: tour.currency || "USD",
    rawPrice: tour.price_start_per_person ?? 0,
    slug: tour.slug,
    fallbackDays: tour.number_of_days ?? undefined,
    fallbackSubtitle: tour.subtitle || tour.short_description,
  };
}

export default function ComparePage() {
  const { hydrated, compareList, toggleCompare, clearCompare, isWishlisted, toggleWishlist } =
    useTravelStore();
  const { format } = useCurrency();

  const [activeItems, setActiveItems] = useState<CompareTourItem[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PublicTour[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  // Recommended/featured tours to display when user hasn't searched yet
  const [recommendedTours, setRecommendedTours] = useState<PublicTour[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);

  // Full tour detail cache across fetches on this page
  const detailCacheRef = useRef<Record<number, PublicTourDetail | null>>({});

  // Load featured/recommended tours on mount
  useEffect(() => {
    let active = true;
    setLoadingRecommended(true);

    fetchFeaturedTours(6)
      .then((tours) => {
        if (!active) return;
        if (tours && tours.length > 0) {
          setRecommendedTours(tours);
        } else {
          // Fallback to latest public tours
          return fetchPublicTours({ limit: 6, sort: "newest" }).then((res) => {
            if (active && res.items) setRecommendedTours(res.items);
          });
        }
      })
      .catch(() => {
        // Fallback fetch
        return fetchPublicTours({ limit: 6, sort: "newest" })
          .then((res) => {
            if (active && res.items) setRecommendedTours(res.items);
          })
          .catch(() => {});
      })
      .finally(() => {
        if (active) setLoadingRecommended(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Synchronize active comparison items with compareList
  useEffect(() => {
    if (!hydrated) return;

    if (compareList.length === 0) {
      setActiveItems([]);
      setLoadingActive(false);
      return;
    }

    let active = true;
    setLoadingActive(true);

    Promise.allSettled(
      compareList.map((item) =>
        item.id in detailCacheRef.current
          ? Promise.resolve(detailCacheRef.current[item.id])
          : fetchPublicTourDetail(item.id),
      ),
    )
      .then((results) => {
        if (!active) return;
        results.forEach((result, idx) => {
          detailCacheRef.current[compareList[idx].id] =
            result.status === "fulfilled" ? (result.value ?? null) : null;
        });

        const mapped = compareList.map((item) => {
          const base: CompareBase = {
            id: item.id,
            title: item.title,
            place: item.place,
            image: item.image || FALLBACK_TOUR_IMG,
            currency: item.currency || "USD",
            rawPrice: item.price ?? 0,
            fallbackDays: Number.isFinite(Number.parseInt(item.duration, 10))
              ? Number.parseInt(item.duration, 10)
              : undefined,
          };
          return buildCompareItem(
            base,
            detailCacheRef.current[item.id] ?? null,
            format,
          );
        });
        setActiveItems(mapped);
      })
      .finally(() => {
        if (active) setLoadingActive(false);
      });

    return () => {
      active = false;
    };
  }, [hydrated, compareList, format]);

  // Handle Keyword Search
  const handlePerformSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setHasSearched(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const res = await fetchPublicTours({
        search: trimmed,
        limit: 12,
        sort: "newest",
      });

      const items = res.items || [];
      setSearchResults(items);

      if (items.length === 0) {
        setSearchError(`No tours found matching "${trimmed}". Try searching by country, city, or tour style.`);
      }
    } catch {
      setSearchError("Unable to search tours at this time. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    void handlePerformSearch(searchQuery);
  };

  const handleQuickKeywordClick = (keyword: string) => {
    setSearchQuery(keyword);
    void handlePerformSearch(keyword);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setSearchError(null);
  };

  // Toggle adding or removing a tour from comparison
  const handleToggleTourInCompare = (tour: PublicTour) => {
    const isAlreadyInCompare = compareList.some((item) => item.id === tour.id);

    if (!isAlreadyInCompare && compareList.length >= MAX_COMPARE_ITEMS) {
      setLimitWarning(`Maximum ${MAX_COMPARE_ITEMS} tours can be compared at once. Remove one of your selected tours below to add this.`);
      setTimeout(() => setLimitWarning(null), 6000);
      return;
    }

    setLimitWarning(null);

    const travelItem: TravelItem = {
      id: tour.id,
      title: tour.title,
      place:
        tour.city_name && tour.country_name
          ? `${tour.city_name}, ${tour.country_name}`
          : tour.country_name || tour.city_name || "Worldwide",
      image: tour.banner_image ? mediaUrl(tour.banner_image) : FALLBACK_TOUR_IMG,
      price: tour.price_start_per_person ?? null,
      currency: tour.currency || "USD",
      duration: tour.number_of_days ? `${tour.number_of_days} Days` : "Custom",
      href: publicTourUrl({
        country_name: tour.country_name,
        title: tour.title,
        slug: tour.slug,
      }),
    };

    toggleCompare(travelItem);
  };

  const handleRemoveTour = (tourId: number) => {
    const found = compareList.find((i) => i.id === tourId);
    if (found) {
      toggleCompare(found);
    } else {
      setActiveItems((prev) => prev.filter((item) => item.id !== tourId));
    }
  };

  const handleClearAll = () => {
    clearCompare();
    setActiveItems([]);
  };

  // Determine which tours to show in the discovery tray (Search results take priority; if empty and not searched, show recommended)
  const discoveryTours = hasSearched ? searchResults : recommendedTours;
  const showDiscoveryTray = hasSearched ? searchResults.length > 0 || isSearching : recommendedTours.length > 0;

  return (
    <main className="min-h-screen bg-[#F8FAFD] text-slate-900 pb-24 pt-4 sm:pt-6">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">

        {/* HERO BANNER */}
        <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#071D3E] via-[#0B2A56] to-[#12386E] text-white shadow-[0_16px_36px_rgba(7,29,62,0.18)]">
          <img
            src={HERO_BANNER_IMG}
            alt="Scenic mountain landscape"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-30 mix-blend-overlay"
          />
          <div className="relative z-10 px-5 py-7 sm:px-8 sm:py-9">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-200 backdrop-blur-md">
              <Scale size={14} className="text-sky-300" />
              <span>Tour Comparison Tool</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
              Compare Tours Side by Side
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-sky-100/90 leading-relaxed">
              Search by destination, tour name, or travel style. Add up to {MAX_COMPARE_ITEMS} tours to compare itineraries, pricing, accommodations, and inclusions at a glance.
            </p>
          </div>
        </section>

        {/* KEYWORD SEARCH & SELECTION SECTION (NO FILTERS) */}
        <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-[0_4px_24px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Search size={16} className="text-sky-600" />
                  Search &amp; Add Tours
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Type a keyword to discover tours and click <span className="font-semibold text-sky-700">+ Compare</span> on any tour to add it.
                </p>
              </div>

              {/* Slot Counter Pill */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                <span className="text-sky-600">{activeItems.length}</span>
                <span className="text-slate-400">/</span>
                <span>{MAX_COMPARE_ITEMS} Selected</span>
              </div>
            </div>

            {/* Keyword Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2 mt-1">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by destination or keyword (e.g. Switzerland, Georgia, South India, Adventure)..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-11 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Clear search input"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition disabled:opacity-60"
              >
                {isSearching ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Search</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500" />
                Popular searches:
              </span>
              {POPULAR_SEARCH_KEYWORDS.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => handleQuickKeywordClick(keyword)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                    searchQuery.toLowerCase() === keyword.toLowerCase()
                      ? "bg-sky-600 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {keyword}
                </button>
              ))}
            </div>

            {/* Limit Warning Alert */}
            {limitWarning && (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs font-medium text-amber-800 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900 font-bold text-[11px]">
                    !
                  </span>
                  <span>{limitWarning}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLimitWarning(null)}
                  className="rounded p-1 text-amber-600 hover:bg-amber-100"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Search Error Notice */}
            {searchError && (
              <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-semibold text-rose-700">
                {searchError}
              </div>
            )}
          </div>

          {/* TOUR DISCOVERY TRAY (SEARCH RESULTS / RECOMMENDED TOURS) */}
          {showDiscoveryTray && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                    {hasSearched
                      ? `Search Results (${searchResults.length})`
                      : "Recommended Tours to Compare"}
                  </h3>
                  {hasSearched && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-slate-500">
                  Click <strong>+ Compare</strong> to add to table
                </span>
              </div>

              {/* Grid of Available Tours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {discoveryTours.map((tour) => {
                  const isCompared = compareList.some((c) => c.id === tour.id);
                  const isLimitReached = !isCompared && compareList.length >= MAX_COMPARE_ITEMS;
                  const days = tour.number_of_days;
                  const nights = typeof days === "number" ? Math.max(0, days - 1) : null;
                  const durationStr = days == null ? "Flexible" : `${days}D / ${nights}N`;
                  const priceStr = format(tour.price_start_per_person ?? 0, tour.currency || "USD");

                  return (
                    <div
                      key={tour.id}
                      className={`group flex flex-col justify-between overflow-hidden rounded-xl border transition-all duration-200 ${
                        isCompared
                          ? "border-sky-300 bg-sky-50/30 shadow-xs ring-2 ring-sky-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      <div>
                        {/* Image Thumbnail */}
                        <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                          <img
                            src={tour.banner_image ? mediaUrl(tour.banner_image) : FALLBACK_TOUR_IMG}
                            alt={tour.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {/* Location Badge */}
                          <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-slate-900/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white">
                            {tour.country_flag ? <span>{tour.country_flag}</span> : <MapPin size={9} />}
                            <span className="truncate max-w-[120px]">
                              {tour.city_name || tour.country_name || "Worldwide"}
                            </span>
                          </span>

                          {/* Duration Badge */}
                          <span className="absolute right-2 top-2 z-10 rounded-md bg-white/90 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-black text-slate-800 shadow-2xs">
                            {durationStr}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="p-3">
                          <h4 className="line-clamp-1 text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                            {tour.title}
                          </h4>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500 min-h-[32px]">
                            {tour.subtitle || tour.short_description || "Experience top attractions with local guided insights."}
                          </p>

                          <div className="mt-2 flex items-baseline justify-between border-t border-slate-100 pt-2">
                            <div>
                              <span className="text-[10px] text-slate-400 font-medium">Starts from</span>
                              <div className="text-xs sm:text-sm font-black text-slate-950">
                                {priceStr}
                                <span className="text-[10px] font-normal text-slate-400 ml-0.5">/ person</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-3 pt-0">
                        {isCompared ? (
                          <button
                            type="button"
                            onClick={() => handleToggleTourInCompare(tour)}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 group/btn"
                          >
                            <Check size={13} className="group-hover/btn:hidden text-emerald-600" />
                            <span className="group-hover/btn:hidden">In Comparison</span>
                            <X size={13} className="hidden group-hover/btn:inline text-rose-600" />
                            <span className="hidden group-hover/btn:inline">Remove</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleTourInCompare(tour)}
                            disabled={isLimitReached}
                            className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition shadow-2xs ${
                              isLimitReached
                                ? "border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white"
                            }`}
                          >
                            <Plus size={13} />
                            <span>{isLimitReached ? `Max ${MAX_COMPARE_ITEMS} Selected` : "Add to Compare"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* COMPARISON STATUS & CURRENTLY SELECTED CHIPS */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white px-4 py-3 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-800 shrink-0">
              Comparing ({activeItems.length} of {MAX_COMPARE_ITEMS}):
            </span>

            {activeItems.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                No tours added yet. Use the search above or click &quot;Add to Compare&quot; on recommended tours.
              </span>
            ) : (
              activeItems.map((item, index) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50/70 px-3 py-1 text-xs font-semibold text-slate-800"
                >
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  <span className="max-w-[180px] sm:max-w-[240px] truncate">{`Tour ${index + 1}: ${item.title}`}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTour(item.id)}
                    aria-label={`Remove ${item.title}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition"
                  >
                    <X size={12} className="stroke-[2.5]" />
                  </button>
                </span>
              ))
            )}
          </div>

          {activeItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
            >
              <Trash2 size={13} />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* COMPARISON CONTENT OR EMPTY STATE */}
        {loadingActive && activeItems.length === 0 ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <Loader label="Loading tours for comparison..." />
          </div>
        ) : activeItems.length === 0 ? (
          <div className="flex min-h-[38vh] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 sm:p-12 text-center shadow-2xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Scale size={32} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                No tours selected for comparison
              </h2>
              <p className="mt-1 max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed">
                Search for tours by destination, activity, or country above, then click <strong>&quot;Add to Compare&quot;</strong> to review them side by side.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-xs font-semibold text-slate-600 mr-1">Try comparing:</span>
              <button
                type="button"
                onClick={() => handleQuickKeywordClick("Switzerland")}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition"
              >
                Switzerland Tours
              </button>
              <button
                type="button"
                onClick={() => handleQuickKeywordClick("India")}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition"
              >
                India Packages
              </button>
              <button
                type="button"
                onClick={() => handleQuickKeywordClick("Georgia")}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition"
              >
                Georgia Expeditions
              </button>
              <Link
                href="/tours"
                className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-700 transition"
              >
                Browse All Tours
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-6">

            {/* SIDE BY SIDE TABLE CONTAINER */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-[0_6px_28px_rgba(15,23,42,0.05)]">
              <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-xs">
                <colgroup>
                  <col style={{ width: "220px" }} />
                  {activeItems.map((item) => (
                    <col key={item.id} style={{ width: `${(100 - (220 / 760) * 100) / activeItems.length}%` }} />
                  ))}
                </colgroup>

                {/* THE TOUR CARDS ROW (TABLE HEADER) */}
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="p-5 align-top border-r border-slate-200">
                      <div className="flex flex-col justify-between h-full space-y-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-100/60 px-2 py-0.5 rounded">
                            Comparison
                          </span>
                          <h3 className="text-base font-black text-slate-900 mt-1.5">
                            Tour Overview
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            Compare highlights, itineraries, and inclusions side-by-side.
                          </p>
                        </div>

                        {activeItems.length < MAX_COMPARE_ITEMS && (
                          <div className="rounded-xl border border-dashed border-sky-300 bg-sky-50/50 p-3 text-center">
                            <p className="text-[11px] font-semibold text-sky-800">
                              + Add {MAX_COMPARE_ITEMS - activeItems.length} more tour{MAX_COMPARE_ITEMS - activeItems.length > 1 ? "s" : ""}
                            </p>
                            <p className="text-[10px] text-sky-600 mt-0.5">Use search above</p>
                          </div>
                        )}
                      </div>
                    </th>

                    {activeItems.map((tour) => {
                      const wishlisted = isWishlisted(tour.id);
                      const tourUrl = tour.slug
                        ? publicTourUrl({ country_name: tour.country_name, title: tour.title, slug: tour.slug })
                        : "/tours";

                      const travelItem: TravelItem = {
                        id: tour.id,
                        title: tour.title,
                        place: tour.place,
                        image: tour.image,
                        price: tour.rawPrice,
                        currency: tour.currency,
                        duration: tour.days,
                        href: tourUrl,
                      };

                      return (
                        <th key={tour.id} className="p-4 align-top border-r border-slate-200 last:border-r-0">
                          <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                            {/* Card Image */}
                            <div className="relative h-44 w-full overflow-hidden rounded-lg bg-slate-100">
                              <img
                                src={tour.image}
                                alt={tour.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-104"
                              />

                              {/* Place Pill */}
                              <span className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-slate-900/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white">
                                {tour.country_flag ? <span>{tour.country_flag}</span> : <MapPin size={10} className="shrink-0" />}
                                <span className="truncate max-w-[130px]">{tour.place}</span>
                              </span>

                              {/* Wishlist Button */}
                              <WishlistButton
                                item={travelItem}
                                variant="badge"
                                className="absolute right-2.5 top-2.5 z-10"
                                wishlisted={wishlisted}
                                onToggle={() => toggleWishlist(travelItem)}
                              />
                            </div>

                            {/* Details */}
                            <div className="pt-3">
                              <div className="flex items-start justify-between gap-1.5">
                                <Link
                                  href={tourUrl}
                                  className="line-clamp-2 text-sm font-extrabold text-slate-900 hover:text-sky-600 transition"
                                >
                                  {tour.title}
                                </Link>
                              </div>

                              <div className="mt-1 flex items-center gap-2">
                                <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                                  {tour.durationTag}
                                </span>
                                <span className="rounded bg-sky-50 text-sky-700 px-1.5 py-0.5 text-[10px] font-semibold truncate max-w-[140px]">
                                  {tour.category_name}
                                </span>
                              </div>

                              <p className="mt-1.5 line-clamp-2 min-h-[32px] text-[11px] leading-relaxed text-slate-500 font-normal">
                                {tour.snippet}
                              </p>

                              {/* Rating */}
                              {tour.rating != null ? (
                                <div className="mt-2 flex items-center gap-1 text-xs">
                                  <div role="img" className="flex items-center text-amber-400" aria-label={`${tour.rating.toFixed(1)} out of 5`}>
                                    {Array.from({ length: 5 }, (_, index) => (
                                      <Star
                                        key={index}
                                        size={11}
                                        className={index < Math.round(tour.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                                      />
                                    ))}
                                  </div>
                                  <span className="font-bold text-slate-900 text-[11px]">{tour.rating.toFixed(1)}</span>
                                  <span className="text-slate-400 text-[10px]">({tour.reviewsCount.toLocaleString()})</span>
                                </div>
                              ) : (
                                <p className="mt-2 text-[10px] font-medium text-slate-400">Trusted supplier verified</p>
                              )}

                              {/* Price */}
                              <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-2.5">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-medium">Starting from</span>
                                  <div className="text-base font-black text-slate-950">
                                    {tour.priceFormatted}
                                    <span className="text-[10px] font-normal text-slate-500 ml-1">/ person</span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveTour(tour.id)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                  title="Remove from comparison"
                                >
                                  <X size={15} />
                                </button>
                              </div>

                              {/* Action Link */}
                              <Link
                                href={tourUrl}
                                className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-700 py-2 px-3 text-xs font-bold text-white shadow-2xs transition"
                              >
                                <span>Book Tour</span>
                                <ArrowRight size={13} />
                              </Link>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* SPECIFICATIONS SECTION */}
                <tbody>
                  <tr className="bg-slate-100/70 border-b border-slate-200">
                    <td colSpan={activeItems.length + 1} className="px-5 py-2.5 font-black uppercase tracking-wider text-[11px] text-slate-700">
                      Full Specifications
                    </td>
                  </tr>

                  {/* Duration */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Duration
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0">
                        {item.specs.duration}
                      </td>
                    ))}
                  </tr>

                  {/* Destinations */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Destinations &amp; Route
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0">
                        {item.specs.destinations}
                      </td>
                    ))}
                  </tr>

                  {/* Category */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Tour Style &amp; Category
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0">
                        {item.specs.category}
                      </td>
                    ))}
                  </tr>

                  {/* Group Size */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Group Size
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0">
                        {item.specs.groupSize}
                      </td>
                    ))}
                  </tr>

                  {/* Physical Rating */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Physical Difficulty
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0">
                        {item.specs.difficulty}
                      </td>
                    ))}
                  </tr>

                  {/* Accommodation */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Accommodation
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0">
                        {item.specs.accommodation}
                      </td>
                    ))}
                  </tr>

                  {/* Meals */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Meals Included
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0">
                        {item.specs.meals}
                      </td>
                    ))}
                  </tr>

                  {/* Transport */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Transportation
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0">
                        {item.specs.transport}
                      </td>
                    ))}
                  </tr>

                  {/* Guide */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Tour Guide &amp; Escort
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0">
                        {item.specs.guide}
                      </td>
                    ))}
                  </tr>

                  {/* Best Season */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Best Season
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0">
                        {item.specs.bestSeason}
                      </td>
                    ))}
                  </tr>

                  {/* Visa */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Visa Guidelines
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-r-0">
                        {item.specs.visa}
                      </td>
                    ))}
                  </tr>

                  {/* Starting Price */}
                  <tr className="border-b border-slate-200 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Starting Price
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 text-slate-900 font-black text-sm border-r border-slate-100 last:border-r-0">
                        {item.specs.price}
                      </td>
                    ))}
                  </tr>

                  {/* INCLUSIONS & EXCLUSIONS HEADER */}
                  <tr className="bg-slate-100/70 border-b border-slate-200">
                    <td colSpan={activeItems.length + 1} className="px-5 py-2.5 font-black uppercase tracking-wider text-[11px] text-slate-700">
                      Inclusions &amp; Exclusions Matrix
                    </td>
                  </tr>

                  {/* Flights */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Flights
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 border-r border-slate-100 last:border-r-0">
                        {item.inclusionsMap.flights ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <CircleCheck size={13} className="text-emerald-600 shrink-0" />
                            <span>Included</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 border border-rose-200">
                            <CircleX size={13} className="text-rose-500 shrink-0" />
                            <span>Not Included</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Airport Transfers */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Airport Transfers
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 border-r border-slate-100 last:border-r-0">
                        {item.inclusionsMap.transfers ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <CircleCheck size={13} className="text-emerald-600 shrink-0" />
                            <span>Included</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 border border-rose-200">
                            <CircleX size={13} className="text-rose-500 shrink-0" />
                            <span>Not Included</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Hotel Accommodation */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Hotel Accommodation
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 border-r border-slate-100 last:border-r-0">
                        {item.inclusionsMap.accommodation ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <CircleCheck size={13} className="text-emerald-600 shrink-0" />
                            <span>Included</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 border border-rose-200">
                            <CircleX size={13} className="text-rose-500 shrink-0" />
                            <span>Not Included</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Daily Breakfast */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Daily Breakfast
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 border-r border-slate-100 last:border-r-0">
                        {item.inclusionsMap.breakfast ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <CircleCheck size={13} className="text-emerald-600 shrink-0" />
                            <span>Included</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 border border-rose-200">
                            <CircleX size={13} className="text-rose-500 shrink-0" />
                            <span>Not Included</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Guided Sightseeing */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Guided Sightseeing
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 border-r border-slate-100 last:border-r-0">
                        {item.inclusionsMap.guidedTours ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <CircleCheck size={13} className="text-emerald-600 shrink-0" />
                            <span>Included</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 border border-rose-200">
                            <CircleX size={13} className="text-rose-500 shrink-0" />
                            <span>Not Included</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Adventure Activities */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Adventure &amp; Experiences
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 border-r border-slate-100 last:border-r-0">
                        {item.inclusionsMap.adventure ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <CircleCheck size={13} className="text-emerald-600 shrink-0" />
                            <span>Included</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 border border-rose-200">
                            <CircleX size={13} className="text-rose-500 shrink-0" />
                            <span>Not Included</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Travel Insurance */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      Travel Insurance
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 border-r border-slate-100 last:border-r-0">
                        {item.inclusionsMap.insurance ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <CircleCheck size={13} className="text-emerald-600 shrink-0" />
                            <span>Included</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 border border-rose-200">
                            <CircleX size={13} className="text-rose-500 shrink-0" />
                            <span>Not Included</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* 24/7 Support */}
                  <tr className="hover:bg-slate-50/50">
                    <th className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 bg-white">
                      24/7 Travel Care
                    </th>
                    {activeItems.map((item) => (
                      <td key={item.id} className="px-4 py-3.5 border-r border-slate-100 last:border-r-0">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          <CircleCheck size={13} className="text-emerald-600 shrink-0" />
                          <span>Dedicated Support</span>
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* BOTTOM BOOKING ACTION ROW */}
                  <tr className="border-t-2 border-slate-200 bg-slate-50/50">
                    <th className="px-5 py-4 border-r border-slate-200">
                      <span className="text-xs font-bold text-slate-900">Next Steps</span>
                    </th>
                    {activeItems.map((tour) => {
                      const tourUrl = tour.slug
                        ? publicTourUrl({ country_name: tour.country_name, title: tour.title, slug: tour.slug })
                        : "/tours";

                      return (
                        <td key={tour.id} className="p-4 border-r border-slate-200 last:border-r-0">
                          <Link
                            href={tourUrl}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] py-2.5 px-4 text-center text-xs font-bold text-white shadow-xs transition"
                          >
                            <span>Book {tour.title}</span>
                            <ArrowRight size={13} />
                          </Link>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
