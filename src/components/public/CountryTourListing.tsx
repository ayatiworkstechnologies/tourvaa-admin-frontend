"use client";

import Link from "next/link";
import PrimaryCtaButton from "@/components/public/PrimaryCtaButton";
import MarketingImage from "@/components/public/MarketingImage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LuArrowUpDown as ArrowUpDown,
  LuBanknote as Banknote,
  LuCalendarDays as CalendarDays,
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuClock as Clock,
  LuCompass as Compass,
  LuHouse as Home,
  LuLayers as Layers,
  LuLayoutGrid as LayoutGrid,
  LuList as List,
  LuMap as MapIcon,
  LuMapPin as MapPin,
  LuRotateCcw as RotateCcw,
  LuSearch as Search,
  LuSlidersHorizontal as Sliders,
  LuSparkles as Sparkles,
  LuStar as Star,
  LuUser as User,
  LuUsers as Users,
  LuX as X,
} from "react-icons/lu";

function formatCountryTitle(name: string): string {
  if (!name) return "";
  return name
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
import { CmsCountryPage, fetchCountryPages, fetchPublicCategories, fetchPublicCountries, fetchPublicSubcategories, fetchPublicTours, PublicCategory, PublicSubcategory } from "@/lib/api/publicClient";
import { useCurrency } from "@/hooks/useCurrency";
import { useContentBlock } from "@/hooks/useContentBlock";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { publicTourUrl, slugifyTourSegment } from "@/lib/utils/tourUrl";
import WishlistButton from "@/components/public/WishlistButton";
import { DiscountCardBadge, hasActiveDiscount } from "@/components/public/DiscountPrice";
import ExternalExperiencesSection from "@/components/public/external/ExternalExperiencesSection";
import Loader from "@/components/ui/Loader";

type TourItem = {
  id: number | string;
  title: string;
  location: string;
  duration: string;
  days: number;
  route: string;
  guideType?: string;
  tourType?: string;
  travelStyle?: string;
  rating?: number;
  inclusions?: string[];
  maxGroup: number | null;
  minAge?: number;
  maxAge?: number;
  ageRange?: string;
  cities: string;
  departures: { date: string; price: string; slots?: number }[];
  originalPrice?: string;
  price: string;
  rawPrice: number | null;
  discountPercentage?: number | null;
  originalPriceRaw?: number | null;
  discountedPriceRaw?: number | null;
  currency?: string;
  image: string;
  slug?: string;
  country_name?: string;
};

const DEFAULT_TOUR_FALLBACK_IMAGE = "/images/tour-card-fallback.jpg";

type ToursListingContent = {
  hero_title?: string;
  hero_description?: string;
  hero_image?: string;
  hero_rating?: string;
  hero_reviews?: string;
  hero_group_tours?: string;
  hero_private_tours?: string;
  hero_destinations?: string;
  results_heading?: string;
  results_context?: string;
  showcase_title?: string;
  showcase_description?: string;
  showcase_image?: string;
};

const DEFAULT_TOURS_LISTING_CONTENT: Required<ToursListingContent> = {
  hero_title: "Explore the World's Best Tours",
  hero_description: "Discover handpicked tour packages across the world's most incredible destinations - from the alpine peaks of Switzerland and New Zealand to the rich heritage of India and the tropical islands of Bali. Guided journeys, scenic road trips, and memorable adventures crafted for every traveller.",
  hero_image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
  hero_rating: "4.9",
  hero_reviews: "12,400+ reviews",
  hero_group_tours: "250+ Group Tours",
  hero_private_tours: "180+ Private Tours",
  hero_destinations: "95+ Destinations",
  results_heading: "Discover World Tours",
  results_context: "Across Worldwide Destinations",
  showcase_title: "World Best Group & Private Tours",
  showcase_description: "Travel together, share unforgettable experiences, and explore incredible destinations with expertly planned tours across 50+ countries. Meet like-minded travellers, enjoy seamless itineraries, and create lasting memories along the way.",
  showcase_image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
};

const DEPARTURE_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "2-digit" });

function formatDepartureDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? isoDate : DEPARTURE_DATE_FORMAT.format(parsed);
}

// "2-20" -> 20 (the group cap); a bare number stays as-is.
function parseMaxGroup(groupSize: string | null | undefined): number | null {
  if (!groupSize) return null;
  const numbers = groupSize.match(/\d+/g);
  if (!numbers || numbers.length === 0) return null;
  return Math.max(...numbers.map(Number));
}

function parseDurationFromParams(sp: { get: (key: string) => string | null }): string {
  const duration = sp.get("duration");
  if (duration) return duration;
  const min = sp.get("min_days");
  const max = sp.get("max_days");
  if (max === "1" && (!min || min === "1")) return "1";
  if (min === "2" && max === "6") return "2-6";
  if (min === "7" && max === "10") return "7-10";
  if (min === "11" && max === "14") return "11-14";
  if (min === "15" && !max) return "15+";
  if (min === "1" && max === "3") return "1-3";
  if (min === "4" && max === "7") return "4-7";
  if (min === "8" && !max) return "8+";
  return "";
}

function durationRange(val: string, sp?: { get: (key: string) => string | null }): { min_days?: number; max_days?: number } {
  if (val === "1") return { min_days: 1, max_days: 1 };
  if (val === "2-6") return { min_days: 2, max_days: 6 };
  if (val === "7-10") return { min_days: 7, max_days: 10 };
  if (val === "11-14") return { min_days: 11, max_days: 14 };
  if (val === "15+") return { min_days: 15 };
  if (val === "1-3") return { min_days: 1, max_days: 3 };
  if (val === "4-7") return { min_days: 4, max_days: 7 };
  if (val === "8+") return { min_days: 8 };
  if (sp) {
    const min = sp.get("min_days");
    const max = sp.get("max_days");
    if (min || max) {
      return {
        min_days: min ? Number(min) : undefined,
        max_days: max ? Number(max) : undefined,
      };
    }
  }
  return {};
}

export default function CountryTourListing({ countrySlug }: { countrySlug?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCountry = searchParams.get("country") || "";
  const querySearch = searchParams.get("search") || "";
  const queryCategory = searchParams.get("category") || "";
  const queryDepartureMonth = searchParams.get("departure_month") || searchParams.get("travel_date") || "";
  const queryBudget = searchParams.get("budget") || "";
  const queryDuration = parseDurationFromParams(searchParams);
  const querySubcategory = searchParams.get("subcategory") || "";
  const queryDestination = searchParams.get("destination") || "";
  const queryRating = searchParams.get("rating") || "";
  const queryAvailableOnly = searchParams.get("available_only") === "true";
  const querySort = (searchParams.get("sort") as "newest" | "price_asc" | "price_desc" | "duration_asc") || "newest";
  const { format } = useCurrency();
  const toursListingContent = useContentBlock<ToursListingContent>("tours_listing", DEFAULT_TOURS_LISTING_CONTENT);

  const [searchTerm, setSearchTerm] = useState(querySearch);
  useEffect(() => {
    setSearchTerm(querySearch);
  }, [querySearch]);

  const updateQueryParam = useCallback((updates: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (!val) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    if (!("page" in updates)) {
      params.set("page", "1");
    }
    router.replace(`${countrySlug ? `/tours/${countrySlug}` : "/tours"}?${params.toString()}`, { scroll: false });
  }, [countrySlug, router, searchParams]);

  const handleSearchSubmit = (text: string) => {
    const trimmed = text.trim();
    updateQueryParam({ search: trimmed || null });
  };

  const [countryName, setCountryName] = useState("");
  const [countryPages, setCountryPages] = useState<CmsCountryPage[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [subcategories, setSubcategories] = useState<PublicSubcategory[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Server-driven filters initialized from URL searchParams
  const [selectedBudget, setSelectedBudget] = useState(queryBudget);
  const [selectedDuration, setSelectedDuration] = useState(queryDuration);
  const [selectedDepartureMonth, setSelectedDepartureMonth] = useState(queryDepartureMonth);
  const [selectedSubcategory, setSelectedSubcategory] = useState(querySubcategory);
  const [availableOnly, setAvailableOnly] = useState(queryAvailableOnly);
  const [sortOrder, setSortOrder] = useState<"newest" | "price_asc" | "price_desc" | "duration_asc">(querySort);
  const queryPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const [page, setPage] = useState(queryPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 12;

  // Client-side-only filters
  const [selectedDestination, setSelectedDestination] = useState(queryDestination);
  const [selectedRating, setSelectedRating] = useState(queryRating);

  // Sync state when URL searchParams change
  useEffect(() => {
    setSelectedBudget(searchParams.get("budget") || "");
    setSelectedDuration(parseDurationFromParams(searchParams));
    setSelectedDepartureMonth(searchParams.get("departure_month") || searchParams.get("travel_date") || "");
    setSelectedSubcategory(searchParams.get("subcategory") || "");
    setAvailableOnly(searchParams.get("available_only") === "true");
    const sortParam = searchParams.get("sort") as "newest" | "price_asc" | "price_desc" | "duration_asc";
    if (sortParam) setSortOrder(sortParam);
    setSelectedDestination(searchParams.get("destination") || "");
    setSelectedRating(searchParams.get("rating") || "");
  }, [searchParams]);

  // Next 12 calendar months as real "YYYY-MM" values for departure_month,
  // dynamically including any active query departure month.
  const departureMonthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      options.push({ value, label });
    }
    if (selectedDepartureMonth && !options.some((o) => o.value === selectedDepartureMonth)) {
      const [y, m] = selectedDepartureMonth.split("-").map(Number);
      if (y && m) {
        const d = new Date(y, m - 1, 1);
        const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        options.push({ value: selectedDepartureMonth, label });
      }
    }
    return options;
  }, [selectedDepartureMonth]);

  const hasSpecificCountry = Boolean(countrySlug || queryCountry);

  const isIndia =
    countrySlug?.toLowerCase().includes("india") ||
    queryCountry.toLowerCase().includes("india") ||
    countryName.toLowerCase().includes("india");

  // Budget ranges, mapped to real min_price/max_price on GET /api/public/tours
  // (Tour.price_start_per_person is stored in each tour's own currency, so
  // these bands are only meaningful within one currency family -- India's
  // tours are priced in INR, everywhere else defaults to USD-scale pricing).
  // Memoized on isIndia so it's a stable reference across renders -- the
  // fetch effect below depends on it, and an unmemoized array here would be
  // a new reference every render, re-triggering that effect every render.
  const budgetOptions = useMemo(() => (
    isIndia
      ? [
          { value: "0-25000", label: "Under ₹25k", min: undefined, max: 25000 },
          { value: "25000-50000", label: "₹25k – ₹50k", min: 25000, max: 50000 },
          { value: "50000-100000", label: "₹50k – ₹1L", min: 50000, max: 100000 },
          { value: "100000+", label: "Above ₹1L", min: 100000, max: undefined },
        ]
      : [
          { value: "0-500", label: "Under $500", min: undefined, max: 500 },
          { value: "500-1000", label: "$500 – $1,000", min: 500, max: 1000 },
          { value: "1000-2000", label: "$1,000 – $2,000", min: 1000, max: 2000 },
          { value: "2000+", label: "Above $2,000", min: 2000, max: undefined },
        ]
  ), [isIndia]);

  // Keep API filter bounds in the tours' source-currency family, while the
  // visible labels follow the header's active display currency.
  const displayBudgetOptions = useMemo(() => {
    const sourceCurrency = isIndia ? "INR" : "USD";
    return budgetOptions.map((option) => {
      const min = option.min === undefined ? null : format(option.min, sourceCurrency);
      const max = option.max === undefined ? null : format(option.max, sourceCurrency);
      return {
        ...option,
        label: min && max ? `${min} to ${max}` : max ? `Under ${max}` : min ? `Above ${min}` : option.label,
      };
    });
  }, [budgetOptions, format, isIndia]);

  // Admin-editable per-country landing page overrides (see admin/cms >
  // Country Pages) - fetched once, matched against the resolved
  // countryName below. Falls back to the algorithmically generated hero/
  // showcase copy when no active row exists for the country.
  useEffect(() => {
    let active = true;
    fetchCountryPages()
      .then((pages) => { if (active) setCountryPages(pages); })
      .catch(() => { if (active) setCountryPages([]); });
    return () => { active = false; };
  }, []);

  const countryPage = useMemo(
    () => countryPages.find((p) => p.country_name.toLowerCase() === countryName.toLowerCase()) ?? null,
    [countryPages, countryName]
  );

  const [tours, setTours] = useState<TourItem[]>([]);

  // Any real filter change (not just paging) should restart at page 1 --
  // otherwise "page 3 of the unfiltered list" could silently become an
  // out-of-range page for the newly filtered result set.
  useEffect(() => {
    setPage(1);
  }, [countrySlug, queryCountry, querySearch, queryCategory, selectedDuration, selectedBudget, selectedDepartureMonth, selectedSubcategory, availableOnly, sortOrder]);

  useEffect(() => {
    setPage(queryPage);
  }, [queryPage]);

  // Resolves the country slug/query into a real country name, then loads
  // ONLY the categories that have a published tour in that country (see
  // routers.public.public_categories) -- so an empty category never shows
  // up as a filter option for a country with nothing in it. Only depends on
  // the country itself, so switching Duration/Budget/Departure Month/page
  // never re-hits these two endpoints.
  useEffect(() => {
    let active = true;
    fetchPublicCountries()
      .then(async (countries) => {
        if (!active) return;
        let resolvedCountry = "";
        if (countrySlug) {
          const match = countries.find((item) => slugifyTourSegment(item.country_name) === countrySlug);
          resolvedCountry = match?.country_name || countrySlug;
        } else if (queryCountry) {
          const match = countries.find((item) => item.country_name.toLowerCase() === queryCountry.toLowerCase());
          resolvedCountry = match?.country_name || queryCountry;
        }
        setCountryName(resolvedCountry);
        const categoryList = await fetchPublicCategories(resolvedCountry || undefined);
        if (!active) return;
        setCategories(categoryList);
        if (queryCategory) {
          // Public links created before slugs were standard may still contain
          // the category name. Resolve both forms to the current canonical
          // slug, otherwise the selected filter appears blank and is removed
          // even when it refers to a valid category.
          const normalizedCategory = slugifyTourSegment(queryCategory);
          const matchedCategory = categoryList.find((cat) => (
            cat.slug === queryCategory
            || cat.slug === normalizedCategory
            || cat.category_name.toLocaleLowerCase() === queryCategory.toLocaleLowerCase()
          ));
          const params = new URLSearchParams(searchParams.toString());
          if (!matchedCategory) {
            params.delete("category");
            router.replace(`${countrySlug ? `/tours/${countrySlug}` : "/tours"}?${params.toString()}`);
          } else if (matchedCategory.slug !== queryCategory) {
            params.set("category", matchedCategory.slug);
            router.replace(`${countrySlug ? `/tours/${countrySlug}` : "/tours"}?${params.toString()}`);
          }
        }
      })
      .catch(() => {
        if (!active) return;
        setCountryName(countrySlug || queryCountry);
        setCategories([]);
      });
    return () => { active = false; };
  }, [countrySlug, queryCountry, queryCategory, router, searchParams]);

  // Subcategories are scoped to the selected category (see public_subcategories).
  // Preserve a valid URL-selected subcategory while its option list loads;
  // clearing it eagerly caused the UI to show an unfiltered result even
  // though the URL still contained the subcategory query.
  useEffect(() => {
    let active = true;
    fetchPublicSubcategories(queryCategory || undefined)
      .then((subs) => {
        if (!active) return;
        setSubcategories(subs);
        if (querySubcategory && !subs.some((sub) => sub.slug === querySubcategory)) {
          updateQueryParam({ subcategory: null });
        }
      })
      .catch(() => {
        if (active) setSubcategories([]);
      });
    return () => { active = false; };
  }, [queryCategory, querySubcategory, updateQueryParam]);

  // The actual tour list fetch -- re-runs only when a real filter or the
  // page changes, each one mapped straight to routers.public.public_tours's
  // real query params (no client-side re-filtering of duration/budget/month).
  useEffect(() => {
    if ((countrySlug || queryCountry) && !countryName) return;
    let active = true;
    setLoading(true);
    setLoadError(false);

    const params: Record<string, string | number | boolean> = { limit: PAGE_SIZE, page, sort: sortOrder };
    // countryName is resolved by the effect above, keyed off countrySlug/
    // queryCountry -- only send it as a filter when one of those is set, so
    // the unfiltered "/tours" (all destinations) page doesn't accidentally
    // scope to a stale leftover countryName.
    if (countrySlug || queryCountry) params.country = countryName;
    if (querySearch) params.search = querySearch;
    if (queryCategory) params.category = queryCategory;
    if (selectedSubcategory) params.subcategory = selectedSubcategory;
    const range = durationRange(selectedDuration, searchParams);
    if (range.min_days !== undefined) params.min_days = range.min_days;
    if (range.max_days !== undefined) params.max_days = range.max_days;
    if (selectedBudget) {
      const band = budgetOptions.find((b) => b.value === selectedBudget);
      if (band?.min !== undefined) params.min_price = band.min;
      if (band?.max !== undefined) params.max_price = band.max;
    } else {
      const minP = searchParams.get("min_price");
      const maxP = searchParams.get("max_price");
      if (minP) params.min_price = Number(minP);
      if (maxP) params.max_price = Number(maxP);
    }
    if (selectedDepartureMonth) params.departure_month = selectedDepartureMonth;
    if (availableOnly) params.available_only = true;
    if (selectedDestination) params.destination = selectedDestination;
    if (selectedRating) params.min_rating = selectedRating;

    fetchPublicTours(params)
      .then((result) => {
        if (!active) return;
        const apiItems = result.items || [];

        setTotalPages(result.total_pages || 1);
        setTotalCount(result.total || apiItems.length);

        const mapped: TourItem[] = apiItems.map((t) => {
          const realRoute = t.start_location && t.end_location
            ? `${t.start_location} > ${t.end_location}`
            : t.city_name && t.country_name
              ? `${t.city_name}, ${t.country_name}`
              : (t.country_name || null);
          const realDepartures = t.departures
            ?.filter((d) => d.status === "available")
            .slice(0, 3)
            .map((d) => ({
              date: formatDepartureDate(d.date),
              slots: d.slots,
              price: t.discounted_price_per_person != null
                ? format(t.discounted_price_per_person, t.currency)
                : t.price_start_per_person != null
                  ? format(t.price_start_per_person, t.currency)
                  : "Price on request",
            }));
          const realMaxGroup = t.max_group_size ?? parseMaxGroup(t.group_size);
          return {
            id: t.id,
            title: t.title || "Untitled tour",
            location: t.country_name || "Worldwide",
            duration: t.number_of_days
              ? `${t.number_of_days}D | ${Math.max(0, t.number_of_days - 1)}N`
              : t.number_of_hours
                ? `${t.number_of_hours} hours`
                : "Flexible",
            days: t.number_of_days || 0,
            route: realRoute || "Route details on request",
            guideType: undefined,
            tourType: undefined,
            travelStyle: undefined,
            rating: t.rating_average ?? undefined,
            inclusions: [],
            maxGroup: realMaxGroup,
            minAge: undefined,
            maxAge: undefined,
            ageRange: t.suitable_age_range || undefined,
            cities: t.city_name || t.country_name || "Location to be confirmed",
            departures: realDepartures || [],
            originalPrice: (t.storefront_original_price_per_person ?? t.original_price_per_person) != null
              ? format(t.storefront_original_price_per_person ?? t.original_price_per_person, t.currency)
              : undefined,
            price: t.discounted_price_per_person != null
              ? format(t.discounted_price_per_person, t.currency)
              : t.price_start_per_person != null
                ? format(t.price_start_per_person, t.currency)
                : "Price on request",
            rawPrice: t.discounted_price_per_person ?? t.price_start_per_person ?? null,
            discountPercentage: t.discount_percentage,
            originalPriceRaw: t.storefront_original_price_per_person ?? t.original_price_per_person,
            discountedPriceRaw: t.discounted_price_per_person,
            currency: t.currency || "USD",
            image: t.banner_image ? mediaUrl(t.banner_image) : DEFAULT_TOUR_FALLBACK_IMAGE,
            slug: t.slug,
            country_name: t.country_name,
          };
        });
        setTours(mapped);
      })
      .catch(() => {
        if (!active) return;
        setTours([]);
        setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [countryName, countrySlug, queryCountry, querySearch, queryCategory, selectedSubcategory, selectedDuration, selectedBudget, selectedDestination, selectedRating, budgetOptions, selectedDepartureMonth, availableOnly, sortOrder, page, format, isIndia, retryKey, searchParams]);

  // Destination and hero headings
  const destinationTitle = useMemo(() => {
    if (countryName) return formatCountryTitle(countryName);
    if (isIndia) return "India";
    if (countrySlug) return formatCountryTitle(countrySlug);
    if (queryCountry) return formatCountryTitle(queryCountry);
    return hasSpecificCountry ? "Destination" : "World Tours";
  }, [countryName, isIndia, countrySlug, queryCountry, hasSpecificCountry]);

  // Dynamic available destinations from the current page's real
  // country_name/city_name fields.
  const availableDestinations = useMemo(() => {
    const set = new Set<string>();
    tours.forEach((t) => {
      if (t.location) set.add(t.location);
      if (t.cities) set.add(t.cities);
    });
    return Array.from(set);
  }, [tours]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (querySearch) count++;
    if (selectedBudget || searchParams.get("min_price") || searchParams.get("max_price")) count++;
    if (selectedDuration || searchParams.get("min_days") || searchParams.get("max_days")) count++;
    if (selectedDestination) count++;
    if (selectedRating) count++;
    if (selectedDepartureMonth) count++;
    if (queryCategory) count++;
    if (selectedSubcategory) count++;
    if (availableOnly) count++;
    return count;
  }, [querySearch, selectedBudget, selectedDuration, selectedDestination, selectedRating, selectedDepartureMonth, queryCategory, selectedSubcategory, availableOnly, searchParams]);

  // Selecting a category updates the URL (preserving country/search) rather
  // than just local state, so the request is re-run against the backend --
  // country + category are combined server-side (see routers.public.public_tours).
  const selectCategory = (slugOrName: string) => {
    const nextCategory = (!slugOrName || slugOrName === queryCategory) ? null : slugOrName;
    updateQueryParam({ category: nextCategory, subcategory: null });
  };

  const handleBudgetChange = (value: string) => {
    setSelectedBudget(value);
    const band = budgetOptions.find((b) => b.value === value);
    updateQueryParam({
      budget: value || null,
      min_price: band?.min !== undefined ? String(band.min) : null,
      max_price: band?.max !== undefined ? String(band.max) : null,
    });
  };

  const handleDurationChange = (value: string) => {
    setSelectedDuration(value);
    const range = durationRange(value);
    updateQueryParam({
      duration: value || null,
      min_days: range.min_days ? String(range.min_days) : null,
      max_days: range.max_days ? String(range.max_days) : null,
    });
  };

  const handleDepartureMonthChange = (value: string) => {
    setSelectedDepartureMonth(value);
    updateQueryParam({
      departure_month: value || null,
      travel_date: null,
    });
  };

  const handleSubcategoryChange = (value: string) => {
    setSelectedSubcategory(value);
    updateQueryParam({ subcategory: value || null });
  };

  const handleDestinationChange = (value: string) => {
    setSelectedDestination(value);
    updateQueryParam({ destination: value || null });
  };

  const handleRatingChange = (value: string) => {
    setSelectedRating(value);
    updateQueryParam({ rating: value || null });
  };

  const handleAvailableOnlyToggle = () => {
    const next = !availableOnly;
    setAvailableOnly(next);
    updateQueryParam({ available_only: next ? "true" : null });
  };

  const handleSortChange = (value: typeof sortOrder) => {
    setSortOrder(value);
    updateQueryParam({ sort: value !== "newest" ? value : null });
  };

  const clearAllFilters = () => {
    setSelectedBudget("");
    setSelectedDuration("");
    setSelectedDestination("");
    setSelectedRating("");
    setSelectedDepartureMonth("");
    setSelectedSubcategory("");
    setAvailableOnly(false);
    setSearchTerm("");
    setSortOrder("newest");
    router.replace(countrySlug ? `/tours/${countrySlug}` : "/tours", { scroll: false });
  };

  const changePage = (nextPage: number) => {
    const safePage = Math.min(totalPages, Math.max(1, nextPage));
    updateQueryParam({ page: String(safePage) });
    setPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // All listing filters, including destination and rating, are applied by
  // the API before its total and pagination are calculated.
  const filteredTours = tours;

  // Dynamic titles and descriptions - an active admin-authored CountryPage
  // (see admin/cms > Country Pages) overrides these on a per-field basis;
  // anything it doesn't set falls back to the algorithmically generated
  // copy below.
  const heroTitle = countryPage?.hero_title?.trim() || (hasSpecificCountry ? `${destinationTitle} Tours` : toursListingContent.hero_title || DEFAULT_TOURS_LISTING_CONTENT.hero_title);

  const heroDescription = countryPage?.hero_description?.trim() || (hasSpecificCountry
    ? isIndia
      ? "India tours bring together breathtaking heritage palaces, vibrant cultural festivals, golden desert landscapes, and tranquil coastal backwaters, making every journey packed with unforgettable experiences. Explore iconic destinations such as Delhi, Agra, Jaipur, Kerala, and Varanasi."
      : `${destinationTitle} tours bring together breathtaking mountains, pristine lakes, dramatic coastlines and vibrant cities, making every journey packed with unforgettable experiences. Explore iconic destinations with scenic road trips, guided adventures and plenty of time to discover the natural beauty.`
    : toursListingContent.hero_description || DEFAULT_TOURS_LISTING_CONTENT.hero_description);

  const heroBannerImage = countryPage?.hero_image ? mediaUrl(countryPage.hero_image) : (hasSpecificCountry
    ? isIndia
      ? "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1600&q=80"
      : "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80"
    : toursListingContent.hero_image || DEFAULT_TOURS_LISTING_CONTENT.hero_image);

  const showcaseTitle = countryPage?.showcase_title?.trim() || (hasSpecificCountry ? `${destinationTitle} Group Tours` : toursListingContent.showcase_title || DEFAULT_TOURS_LISTING_CONTENT.showcase_title);

  const showcaseDescription = countryPage?.showcase_description?.trim() || (hasSpecificCountry
    ? "Travel together, share unforgettable experiences, and explore incredible destinations with expertly planned group tours. Meet like-minded travellers, enjoy seamless itineraries, and create lasting memories along the way."
    : toursListingContent.showcase_description || DEFAULT_TOURS_LISTING_CONTENT.showcase_description);

  const showcaseImage = countryPage?.showcase_image ? mediaUrl(countryPage.showcase_image) : (hasSpecificCountry
    ? isIndia
      ? "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80"
      : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
    : toursListingContent.showcase_image || DEFAULT_TOURS_LISTING_CONTENT.showcase_image);

  return (
    <main className="min-h-screen bg-white pb-24 pt-3 text-slate-950 overflow-x-clip">
      <div className="mx-auto max-w-[1400px] px-5 min-w-0">
        {/* ── 1. Hero Landscape Banner ── */}
        <section className="relative h-[480px] min-h-[480px] w-full rounded-[20px] bg-slate-950 shadow-md">
          {/* Background Image -- its own clipped layer so the content below
              can grow taller than min-h (e.g. the stats row wrapping to a
              second line on narrow screens) without being cut off. */}
          <div className="absolute inset-0 overflow-hidden rounded-[20px]">
            <MarketingImage fill sizes="100vw" preload
              src={heroBannerImage}
              alt={heroTitle}
              className="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent" />
          </div>

          {/* Hero Content Card */}
          <div className="relative z-10 flex h-full min-h-[480px] flex-col justify-between p-6 sm:p-10">
            <div className="max-w-2xl rounded-2xl bg-black/40 p-5 sm:p-7 backdrop-blur-md border border-white/10 text-white shadow-xl">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                {heroTitle}
              </h1>
              <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-white/90">
                {heroDescription}
              </p>

              {/* Meta stats */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-white/90">
                <span className="flex items-center gap-1">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  {hasSpecificCountry ? "4.9" : toursListingContent.hero_rating} <span className="text-white/70 font-normal">{hasSpecificCountry ? "12,400+ reviews" : toursListingContent.hero_reviews}</span>
                </span>
                <span className="flex items-center gap-1 text-white/80">
                  <Users size={13} />
                  {hasSpecificCountry ? "250+ Group Tours" : toursListingContent.hero_group_tours}
                </span>
                <span className="flex items-center gap-1 text-white/80">
                  <User size={13} />
                  {hasSpecificCountry ? "180+ Private Tours" : toursListingContent.hero_private_tours}
                </span>
                <span className="flex items-center gap-1 text-white/80">
                  <Compass size={13} />
                  {hasSpecificCountry ? "95+ Destinations" : toursListingContent.hero_destinations}
                </span>
              </div>

              {hasSpecificCountry && (
                <div className="mt-4 pt-3 border-t border-white/15">
                  <PrimaryCtaButton href={`/destinations/${slugifyTourSegment(destinationTitle)}`} size="sm">
                    Read {destinationTitle} Travel Guide, Climate & Best Places
                  </PrimaryCtaButton>
                </div>
              )}
            </div>

            {/* Bottom rating statement */}
            <p className="text-xs font-medium text-white/90">
              Tourvaa travellers rate us <span className="font-bold">Excellent</span>{" "}
              <span className="inline-flex text-amber-400">★★★★★</span>{" "}
              <span className="font-bold">4.8</span> out of 5 based on 522 reviews
            </p>
          </div>
        </section>

        {/* ── 2. Clickable Breadcrumbs Navigation ── */}
        <nav aria-label="Breadcrumb" className="mt-6 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-pub-secondary transition"
          >
            <Home size={13} className="text-pub-accent" />
            <span>Home</span>
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            href="/tours"
            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition ${
              hasSpecificCountry ? "text-slate-600 hover:bg-slate-100 hover:text-pub-secondary" : "bg-pub-accent/10 text-pub-accent font-bold"
            }`}
          >
            <MapIcon size={13} className="text-pub-accent" />
            <span>{hasSpecificCountry ? "Tour" : "All Tours"}</span>
          </Link>
          {hasSpecificCountry && (
            <>
              <span className="text-slate-300">/</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50/80 px-2.5 py-1 font-bold text-blue-700"
              >
                <MapPin size={13} className="text-blue-600" />
                <span>{destinationTitle}</span>
              </span>
            </>
          )}
        </nav>

        {/* ── 3. Destination Heading & Result Count ── */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-pub-primary">
              {hasSpecificCountry ? destinationTitle : toursListingContent.results_heading}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-900 shadow-2xs">
                {selectedDestination || selectedRating ? filteredTours.length : totalCount} Tour{(selectedDestination || selectedRating ? filteredTours.length : totalCount) === 1 ? "" : "s"} Found
              </span>
              <span>
                {hasSpecificCountry ? `in ${destinationTitle}` : toursListingContent.results_context}
              </span>
              {totalPages > 1 && <span className="text-slate-400 font-medium">(page {page} of {totalPages})</span>}
              {activeFiltersCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  {activeFiltersCount} filter{activeFiltersCount === 1 ? "" : "s"} active
                </span>
              )}
            </div>
          </div>

          {/* Grid / List View Switcher & Clear Filters */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 rounded-xl border border-red-200/90 bg-red-50/80 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 hover:border-red-300 transition shadow-2xs"
              >
                <RotateCcw size={12} />
                <span>Reset filters</span>
              </button>
            )}

            {/* Segmented Grid / List Control */}
            <div className="inline-flex items-center rounded-2xl bg-slate-100 p-1 border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LayoutGrid size={15} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <List size={15} />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 4. Search, filter, and sort controls (Upgraded Modern Filter Suite) ── */}
        <section
          aria-label="Tour filters"
          className="mt-6 rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xs sm:p-6"
        >
          {/* Top Row: Filters Indicator Capsule + Unified Search Input + Available Departures */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Filters Counter Capsule */}
            <div className="inline-flex h-11 shrink-0 items-center gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50 px-3.5 text-xs sm:text-sm font-bold text-pub-primary shadow-2xs">
              <Sliders size={16} className={activeFiltersCount > 0 ? "text-blue-600" : "text-slate-500"} />
              <span>Filters</span>
              <span
                className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-black tabular-nums transition ${
                  activeFiltersCount > 0
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {activeFiltersCount}
              </span>
            </div>

            {/* Quick Search Input */}
            <div className="relative min-w-0 flex-1">
              <input
                type="text"
                placeholder={`Search tours, itineraries, or highlights in ${destinationTitle}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit(searchTerm);
                  }
                }}
                aria-label="Search tours"
                className="h-11 w-full rounded-xl border border-slate-200/90 bg-slate-50/70 py-2.5 pl-10 pr-9 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 outline-none shadow-2xs transition hover:bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    handleSearchSubmit("");
                  }}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Available Departures Toggle */}
            <button
              type="button"
              onClick={handleAvailableOnlyToggle}
              aria-pressed={availableOnly}
              className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all active:scale-[0.98] ${
                availableOnly
                  ? "border border-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs hover:from-blue-700 hover:to-indigo-700"
                  : "border border-slate-200/90 bg-white text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-pub-primary"
              }`}
            >
              <CalendarDays size={16} className={availableOnly ? "text-blue-100" : "text-slate-400"} />
              <span>Available departures</span>
              {availableOnly && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {/* 1. Budget */}
            <div
              className={`group relative min-w-0 flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs sm:text-sm transition-all shadow-2xs ${
                selectedBudget
                  ? "border-blue-400 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-400/25 shadow-xs"
                  : "border-slate-200/90 bg-slate-50/70 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-100/70"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-6">
                <Banknote size={15} className={`shrink-0 ${selectedBudget ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span className="truncate">
                  {selectedBudget ? (displayBudgetOptions.find((b) => b.value === selectedBudget)?.label || selectedBudget) : "Budget"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {selectedBudget && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBudgetChange("");
                    }}
                    aria-label="Clear budget"
                    className="relative z-10 rounded-full p-0.5 text-blue-600 hover:bg-blue-100 transition"
                  >
                    <X size={12} />
                  </button>
                )}
                <ChevronDown size={14} className={`pointer-events-none transition-transform group-hover:translate-y-0.5 ${selectedBudget ? "text-blue-600" : "text-slate-400"}`} />
              </div>
              <select
                value={selectedBudget}
                onChange={(e) => handleBudgetChange(e.target.value)}
                aria-label="Budget"
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer text-slate-900"
              >
                <option value="">All Budgets</option>
                {displayBudgetOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 2. Duration */}
            <div
              className={`group relative min-w-0 flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs sm:text-sm transition-all shadow-2xs ${
                selectedDuration
                  ? "border-blue-400 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-400/25 shadow-xs"
                  : "border-slate-200/90 bg-slate-50/70 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-100/70"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-6">
                <Clock size={15} className={`shrink-0 ${selectedDuration ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span className="truncate">
                  {selectedDuration ? `${selectedDuration} Days` : "Duration"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {selectedDuration && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDurationChange("");
                    }}
                    aria-label="Clear duration"
                    className="relative z-10 rounded-full p-0.5 text-blue-600 hover:bg-blue-100 transition"
                  >
                    <X size={12} />
                  </button>
                )}
                <ChevronDown size={14} className={`pointer-events-none transition-transform group-hover:translate-y-0.5 ${selectedDuration ? "text-blue-600" : "text-slate-400"}`} />
              </div>
              <select
                value={selectedDuration}
                onChange={(e) => handleDurationChange(e.target.value)}
                aria-label="Duration"
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer text-slate-900"
              >
                <option value="">Any Duration</option>
                <option value="1">1 Day</option>
                <option value="2-6">2–6 Days</option>
                <option value="7-10">7–10 Days</option>
                <option value="11-14">11–14 Days</option>
                <option value="15+">15+ Days</option>
                <option value="1-3">1–3 Days</option>
                <option value="4-7">4–7 Days</option>
                <option value="8+">8+ Days</option>
              </select>
            </div>

            {/* 3. Category (shown when categories exist) */}
            {categories.length > 0 && (
              <div
                className={`group relative min-w-0 flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs sm:text-sm transition-all shadow-2xs ${
                  queryCategory
                    ? "border-blue-400 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-400/25 shadow-xs"
                    : "border-slate-200/90 bg-slate-50/70 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-6">
                  <Compass size={15} className={`shrink-0 ${queryCategory ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                  <span className="truncate">
                    {queryCategory ? (categories.find((c) => c.slug === queryCategory)?.category_name || "Category") : "Category"}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {queryCategory && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        selectCategory("");
                      }}
                      aria-label="Clear category"
                      className="relative z-10 rounded-full p-0.5 text-blue-600 hover:bg-blue-100 transition"
                    >
                      <X size={12} />
                    </button>
                  )}
                  <ChevronDown size={14} className={`pointer-events-none transition-transform group-hover:translate-y-0.5 ${queryCategory ? "text-blue-600" : "text-slate-400"}`} />
                </div>
                <select
                  value={queryCategory}
                  onChange={(e) => selectCategory(e.target.value)}
                  aria-label="Category"
                  className="absolute inset-0 h-full w-full opacity-0 cursor-pointer text-slate-900"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 4. Subcategory (shown when subcategories exist) */}
            {subcategories.length > 0 && (
              <div
                className={`group relative min-w-0 flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs sm:text-sm transition-all shadow-2xs ${
                  selectedSubcategory
                    ? "border-blue-400 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-400/25 shadow-xs"
                    : "border-slate-200/90 bg-slate-50/70 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-6">
                  <Layers size={15} className={`shrink-0 ${selectedSubcategory ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                  <span className="truncate">
                    {selectedSubcategory ? (subcategories.find((s) => s.slug === selectedSubcategory)?.subcategory_name || "Subcategory") : "Subcategory"}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {selectedSubcategory && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSubcategoryChange("");
                      }}
                      aria-label="Clear subcategory"
                      className="relative z-10 rounded-full p-0.5 text-blue-600 hover:bg-blue-100 transition"
                    >
                      <X size={12} />
                    </button>
                  )}
                  <ChevronDown size={14} className={`pointer-events-none transition-transform group-hover:translate-y-0.5 ${selectedSubcategory ? "text-blue-600" : "text-slate-400"}`} />
                </div>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => handleSubcategoryChange(e.target.value)}
                  aria-label="Subcategory"
                  className="absolute inset-0 h-full w-full opacity-0 cursor-pointer text-slate-900"
                >
                  <option value="">All Subcategories</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.slug}>
                      {sub.subcategory_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 5. Destination */}
            <div
              className={`group relative min-w-0 flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs sm:text-sm transition-all shadow-2xs ${
                selectedDestination
                  ? "border-blue-400 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-400/25 shadow-xs"
                  : "border-slate-200/90 bg-slate-50/70 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-100/70"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-6">
                <MapPin size={15} className={`shrink-0 ${selectedDestination ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span className="truncate">
                  {selectedDestination || "Destination"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {selectedDestination && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDestinationChange("");
                    }}
                    aria-label="Clear destination"
                    className="relative z-10 rounded-full p-0.5 text-blue-600 hover:bg-blue-100 transition"
                  >
                    <X size={12} />
                  </button>
                )}
                <ChevronDown size={14} className={`pointer-events-none transition-transform group-hover:translate-y-0.5 ${selectedDestination ? "text-blue-600" : "text-slate-400"}`} />
              </div>
              <select
                value={selectedDestination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                aria-label="Destination"
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer text-slate-900"
              >
                <option value="">All Destinations</option>
                {availableDestinations.map((dest) => (
                  <option key={dest} value={dest}>
                    {dest}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Rating */}
            <div
              className={`group relative min-w-0 flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs sm:text-sm transition-all shadow-2xs ${
                selectedRating
                  ? "border-blue-400 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-400/25 shadow-xs"
                  : "border-slate-200/90 bg-slate-50/70 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-100/70"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-6">
                <Star size={15} className={`shrink-0 ${selectedRating ? "fill-amber-400 text-amber-400" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span className="truncate">
                  {selectedRating ? `${selectedRating}+ Stars` : "Rating"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {selectedRating && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRatingChange("");
                    }}
                    aria-label="Clear rating"
                    className="relative z-10 rounded-full p-0.5 text-blue-600 hover:bg-blue-100 transition"
                  >
                    <X size={12} />
                  </button>
                )}
                <ChevronDown size={14} className={`pointer-events-none transition-transform group-hover:translate-y-0.5 ${selectedRating ? "text-blue-600" : "text-slate-400"}`} />
              </div>
              <select
                value={selectedRating}
                onChange={(e) => handleRatingChange(e.target.value)}
                aria-label="Rating"
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer text-slate-900"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
              </select>
            </div>

            {/* 7. Departure Month */}
            <div
              className={`group relative min-w-0 flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs sm:text-sm transition-all shadow-2xs ${
                selectedDepartureMonth
                  ? "border-blue-400 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-400/25 shadow-xs"
                  : "border-slate-200/90 bg-slate-50/70 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-100/70"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-6">
                <CalendarDays size={15} className={`shrink-0 ${selectedDepartureMonth ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span className="truncate">
                  {selectedDepartureMonth ? (departureMonthOptions.find((opt) => opt.value === selectedDepartureMonth)?.label || selectedDepartureMonth) : "Departure Month"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {selectedDepartureMonth && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDepartureMonthChange("");
                    }}
                    aria-label="Clear departure month"
                    className="relative z-10 rounded-full p-0.5 text-blue-600 hover:bg-blue-100 transition"
                  >
                    <X size={12} />
                  </button>
                )}
                <ChevronDown size={14} className={`pointer-events-none transition-transform group-hover:translate-y-0.5 ${selectedDepartureMonth ? "text-blue-600" : "text-slate-400"}`} />
              </div>
              <select
                value={selectedDepartureMonth}
                onChange={(e) => handleDepartureMonthChange(e.target.value)}
                aria-label="Departure month"
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer text-slate-900"
              >
                <option value="">Any Month</option>
                {departureMonthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 8. Sort */}
            <div
              className={`group relative min-w-0 flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs sm:text-sm transition-all shadow-2xs ${
                sortOrder !== "newest"
                  ? "border-blue-400 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-400/25 shadow-xs"
                  : "border-slate-200/90 bg-slate-50/70 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-100/70"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-6">
                <ArrowUpDown size={15} className={`shrink-0 ${sortOrder !== "newest" ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span className="truncate">
                  {sortOrder === "newest"
                    ? "Sort: Newest"
                    : sortOrder === "price_asc"
                    ? "Price: Low to High"
                    : sortOrder === "price_desc"
                    ? "Price: High to Low"
                    : "Duration: Shortest"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {sortOrder !== "newest" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSortChange("newest");
                    }}
                    aria-label="Reset sort"
                    className="relative z-10 rounded-full p-0.5 text-blue-600 hover:bg-blue-100 transition"
                  >
                    <X size={12} />
                  </button>
                )}
                <ChevronDown size={14} className={`pointer-events-none transition-transform group-hover:translate-y-0.5 ${sortOrder !== "newest" ? "text-blue-600" : "text-slate-400"}`} />
              </div>
              <select
                value={sortOrder}
                onChange={(e) => handleSortChange(e.target.value as typeof sortOrder)}
                aria-label="Sort tours"
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer text-slate-900"
              >
                <option value="newest">Sort: Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="duration_asc">Duration: Shortest First</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips Tray */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Sliders size={11} /> Active:
              </span>

              {querySearch && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/90 px-3 py-1 text-xs font-bold text-blue-800 shadow-2xs">
                  <span>Search: &ldquo;{querySearch}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => { setSearchTerm(""); handleSearchSubmit(""); }}
                    aria-label="Clear search filter"
                    className="rounded-full p-0.5 hover:bg-blue-200/60 transition"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedBudget && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
                  <span>Budget: {displayBudgetOptions.find((b) => b.value === selectedBudget)?.label || selectedBudget}</span>
                  <button
                    type="button"
                    onClick={() => handleBudgetChange("")}
                    aria-label="Clear budget filter"
                    className="rounded-full p-0.5 hover:bg-emerald-200/60 transition"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedDuration && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/90 px-3 py-1 text-xs font-bold text-amber-800 shadow-2xs">
                  <span>Duration: {selectedDuration} Days</span>
                  <button
                    type="button"
                    onClick={() => handleDurationChange("")}
                    aria-label="Clear duration filter"
                    className="rounded-full p-0.5 hover:bg-amber-200/60 transition"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {queryCategory && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/90 px-3 py-1 text-xs font-bold text-indigo-800 shadow-2xs">
                  <span>Category: {categories.find((c) => c.slug === queryCategory)?.category_name || queryCategory}</span>
                  <button
                    type="button"
                    onClick={() => selectCategory("")}
                    aria-label="Clear category filter"
                    className="rounded-full p-0.5 hover:bg-indigo-200/60 transition"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedSubcategory && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200/90 px-3 py-1 text-xs font-bold text-purple-800 shadow-2xs">
                  <span>Type: {subcategories.find((s) => s.slug === selectedSubcategory)?.subcategory_name || selectedSubcategory}</span>
                  <button
                    type="button"
                    onClick={() => handleSubcategoryChange("")}
                    aria-label="Clear subcategory filter"
                    className="rounded-full p-0.5 hover:bg-purple-200/60 transition"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedDestination && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/90 px-3 py-1 text-xs font-bold text-rose-800 shadow-2xs">
                  <span>Destination: {selectedDestination}</span>
                  <button
                    type="button"
                    onClick={() => handleDestinationChange("")}
                    aria-label="Clear destination filter"
                    className="rounded-full p-0.5 hover:bg-rose-200/60 transition"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedRating && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/90 px-3 py-1 text-xs font-bold text-amber-800 shadow-2xs">
                  <span>Rating: {selectedRating}+ Stars</span>
                  <button
                    type="button"
                    onClick={() => handleRatingChange("")}
                    aria-label="Clear rating filter"
                    className="rounded-full p-0.5 hover:bg-amber-200/60 transition"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedDepartureMonth && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200/90 px-3 py-1 text-xs font-bold text-sky-800 shadow-2xs">
                  <span>Month: {departureMonthOptions.find((opt) => opt.value === selectedDepartureMonth)?.label || selectedDepartureMonth}</span>
                  <button
                    type="button"
                    onClick={() => handleDepartureMonthChange("")}
                    aria-label="Clear month filter"
                    className="rounded-full p-0.5 hover:bg-sky-200/60 transition"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {availableOnly && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
                  <span>Available Departures Only</span>
                  <button
                    type="button"
                    onClick={handleAvailableOnlyToggle}
                    aria-label="Clear available only filter"
                    className="rounded-full p-0.5 hover:bg-emerald-200/60 transition"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-3 py-1 rounded-full border border-red-200/80 transition"
              >
                <RotateCcw size={11} />
                <span>Reset All ({activeFiltersCount})</span>
              </button>
            </div>
          )}
        </section>

        {/* ── 5. ⭐ Featured Category Showcase Banner Card ── */}
        <section className="mt-8 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 gap-6 items-center md:grid-cols-2">
            {/* Left side content */}
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold text-pub-primary">
                {showcaseTitle}
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 font-medium">
                {showcaseDescription}
              </p>
            </div>

            {/* Right side image */}
            <div className="relative h-56 sm:h-64 w-full overflow-hidden rounded-2xl bg-slate-100 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={showcaseImage}
                alt={showcaseTitle}
                className="h-full w-full object-cover transition duration-500 hover:scale-105"
              />
            </div>
          </div>
        </section>

        {/* ── 6. 3-Column Tour Card Grid or Empty State ── */}
        {loading ? (
          <div className="mt-12"><Loader label="Loading tours..." /></div>
        ) : loadError ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-12 text-center">
            <MapPin size={36} className="text-red-400" />
            <h3 className="mt-3 text-lg font-black text-slate-900">Couldn&apos;t load tours</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Something went wrong reaching the server. Please try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              className="mt-5 rounded-xl bg-pub-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-pub-primary-dark"
            >
              Retry
            </button>
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-12 text-center">
            <MapPin size={36} className="text-slate-400" />
            <h3 className="mt-3 text-lg font-black text-slate-900">No tours match your filters</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Try adjusting or clearing your selected filters to discover other available journeys across our destinations.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-5 rounded-xl bg-pub-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-pub-primary-dark transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div
            className={`mt-8 ${
              viewMode === "grid"
                ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-6"
            }`}
          >
            {filteredTours.map((tour, idx) => {
              const tourLink = tour.slug
                ? publicTourUrl({ country_name: tour.country_name || tour.location, title: tour.title, slug: tour.slug })
                : `/tours/${tour.id}`;
              const wishlistId = typeof tour.id === "number" ? tour.id : Number(tour.id) || 1;

              return (
                <div
                  key={`${tour.id}-${idx}`}
                  className={`group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    viewMode === "list" ? "sm:flex-row" : ""
                  }`}
                >
                  {/* ── Card Image Header ── */}
                  <div
                    className={`relative w-full overflow-hidden ${
                      viewMode === "list" ? "h-56 sm:h-auto sm:w-80 shrink-0" : "h-52"
                    }`}
                  >
                    <MarketingImage fill sizes="(max-width: 640px) 100vw, 360px"
                      src={tour.image}
                      alt={tour.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    {hasActiveDiscount({
                      discount_percentage: tour.discountPercentage,
                      original_price_per_person: tour.originalPriceRaw,
                      discounted_price_per_person: tour.discountedPriceRaw,
                    }) && <DiscountCardBadge percentage={tour.discountPercentage!} />}
                    {/* Wishlist button (top-right) */}
                    <WishlistButton
                      variant="badge"
                      className="absolute right-2.5 top-2.5"
                      item={{
                        id: wishlistId,
                        title: tour.title,
                        place: tour.location,
                        duration: tour.duration,
                        image: tour.image,
                        price: tour.rawPrice,
                        currency: tour.currency || "USD",
                        href: tourLink,
                      }}
                    />
                  </div>

                  {/* ── Card Body ── */}
                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div>
                      {/* Title and Duration Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={tourLink}
                          className="text-base font-semibold text-slate-900 transition hover:text-pub-accent line-clamp-1"
                        >
                          {tour.title}
                        </Link>
                        <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {tour.duration}
                        </span>
                      </div>

                      {/* Specifications Grid */}
                      <div className="mt-3.5 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] text-slate-600 font-medium">
                        {/* Left Column */}
                        <div className="space-y-1.5">
                          <p className="flex items-center gap-1.5 truncate">
                            <Clock size={12} className="text-sky-500 shrink-0" />
                            <span>{tour.days > 0 ? `${tour.days} Days` : tour.duration}</span>
                          </p>
                          <p className="flex items-center gap-1.5 truncate">
                            <MapPin size={12} className="text-sky-500 shrink-0" />
                            <span className="truncate">{tour.route}</span>
                          </p>
                          {tour.guideType && <p className="flex items-center gap-1.5 truncate">
                            <Compass size={12} className="text-sky-500 shrink-0" />
                            <span>{tour.guideType}</span>
                          </p>}
                          {tour.maxGroup != null && <p className="flex items-center gap-1.5 truncate">
                            <Users size={12} className="text-sky-500 shrink-0" />
                            <span>Max group: {String(tour.maxGroup).replace(/^Max\s*/i, "")}</span>
                          </p>}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-1.5">
                          {tour.ageRange && <p className="flex items-center gap-1.5 truncate">
                            <User size={12} className="text-sky-500 shrink-0" />
                            <span>Age: {tour.ageRange}</span>
                          </p>}
                          {tour.cities && <p className="flex items-center gap-1.5 truncate">
                            <MapPin size={12} className="text-sky-500 shrink-0" />
                            <span className="truncate">{tour.cities}</span>
                          </p>}
                        </div>
                      </div>

                      {/* Upcoming Available Departure Date Chips (4 individual cards matching Figma) */}
                      <div className="mt-3.5 grid grid-cols-4 gap-1.5">
                        {tour.departures.length > 0 ? (
                          <>
                            {tour.departures.slice(0, 3).map((dep, dIdx) => (
                              <div
                                key={`${dep.date}-${dIdx}`}
                                className="rounded-lg border border-slate-200/90 bg-white py-1 px-1 text-center shadow-2xs"
                              >
                                <p className="text-[9px] font-medium text-slate-500 truncate">{dep.date}</p>
                                <p className="text-[11px] font-bold text-slate-900 leading-tight truncate">{dep.price}</p>
                              </div>
                            ))}
                            <Link
                              href={tourLink}
                              className="rounded-lg border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100 py-1 px-1 text-center shadow-2xs flex items-center justify-center text-[11px] font-bold text-slate-800 transition"
                            >
                              +More
                            </Link>
                          </>
                        ) : (
                          <Link href={tourLink} className="col-span-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2 text-center text-xs font-semibold text-slate-600 transition hover:bg-slate-100">
                            View available dates and live pricing
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* ── Card Footer ── */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
                      <div className="text-xs text-slate-500 font-medium">
                        <span>From </span>
                        {tour.originalPrice && tour.discountPercentage ? (
                          <>
                            <span className="line-through text-slate-400 mr-1 text-xs">{tour.originalPrice}</span>
                            <span className="text-base font-bold text-slate-900">{tour.price}</span>
                          </>
                        ) : (
                          <span className="text-base font-bold text-slate-900">{tour.price}</span>
                        )}
                        <span className="text-[11px] text-slate-400 ml-0.5">pp</span>
                      </div>
                      <PrimaryCtaButton href={tourLink} size="sm">
                        View tour
                      </PrimaryCtaButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 7. Pagination -- real page/total_pages from the backend ── */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => changePage(page - 1)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 text-xs font-bold text-slate-600">Page {page} of {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => changePage(page + 1)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Partner "things to do" - a separate section after Tourvaa's own
          tours (never mixed into them); only on a country landing page. */}
      {countryName && (countrySlug || queryCountry) && (
        <ExternalExperiencesSection placement="show_on_destination_pages" source="destination" country={countryName} />
      )}
    </main>
  );
}

