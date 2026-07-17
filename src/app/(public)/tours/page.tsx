"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/* eslint-disable @next/next/no-img-element */
import { LuArrowRight as ArrowRight, LuCalendarDays as CalendarDays, LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuClock as Clock, LuHeart as Heart, LuHotel as Hotel, LuLayoutGrid as LayoutGrid, LuList as List, LuMapPin as MapPin, LuSearch as Search, LuSlidersHorizontal as SlidersHorizontal, LuSparkles as Sparkles, LuUsers as Users, LuUtensils as Utensils, LuX as X } from "react-icons/lu";
import { fetchPublicCategories, fetchPublicCountries, fetchPublicTours, PublicCategory, PublicCountry, PublicTour } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";

const PLACEHOLDER = "/images/tour-card-fallback.jpg";
type SortOption = "popular" | "price-asc" | "price-desc" | "duration";
type TourFilters = {
  search: string;
  country: string;
  category: string;
  min_days: string;
  max_days: string;
  min_price: string;
  max_price: string;
};

const FILTER_KEYS: (keyof TourFilters)[] = [
  "search",
  "country",
  "category",
  "min_days",
  "max_days",
  "min_price",
  "max_price",
];

const EMPTY_FILTERS: TourFilters = {
  search: "",
  country: "",
  category: "",
  min_days: "",
  max_days: "",
  min_price: "",
  max_price: "",
};

function filtersFromParams(params: Pick<URLSearchParams, "get">): TourFilters {
  return FILTER_KEYS.reduce(
    (result, key) => ({ ...result, [key]: params.get(key) || "" }),
    { ...EMPTY_FILTERS },
  );
}

function TourCard({ tour, index, view = "grid", bookingQuery = "" }: { tour: PublicTour; index: number; view?: "grid" | "list"; bookingQuery?: string }) {
  const isList = view === "list";
  return (
    <Link
      href={`/tours/${tour.id}${bookingQuery ? `?${bookingQuery}` : ""}`}
      className={`tour-card group flex h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isList ? "flex-col sm:flex-row" : "flex-col"}`}
      style={{ animationDelay: `${(index % 6) * 60}ms` }}
    >
      {/* Image */}
      <div className={`relative overflow-hidden bg-zinc-100 ${isList ? "aspect-[3/2] sm:aspect-auto sm:w-72 shrink-0" : "aspect-[3/2]"}`}>
        <img
          src={tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER}
          alt={tour.title}
          onError={(event) => {
            if (!event.currentTarget.src.endsWith(PLACEHOLDER)) event.currentTarget.src = PLACEHOLDER;
          }}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {tour.category_name && (
            <span className="rounded-xl bg-teal-600/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-sm">
              {tour.category_name}
            </span>
          )}
        </div>
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow"><Heart size={15} /></span>

        {/* Duration badge */}
        {tour.number_of_days && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-black text-slate-800 shadow-sm">
            <Clock size={12} />
            {tour.number_of_days}D
          </span>
        )}

        {/* Location overlay */}
        {(tour.city_name || tour.country_name) && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs font-semibold text-white/90 drop-shadow-md">
            <MapPin size={12} className="shrink-0 text-teal-400" />
            {[tour.city_name, tour.country_name].filter(Boolean).join(", ")}
          </div>
        )}
      </div>

      {/* Body */}
      <div className={`flex flex-1 flex-col ${isList ? "p-6 sm:p-8" : "p-4"}`}>
        <h3 className={`font-black leading-snug text-zinc-950 transition-colors group-hover:text-teal-600 ${isList ? "text-xl line-clamp-2" : "min-h-12 text-lg line-clamp-2"}`}>
          {tour.title}
        </h3>
        <p className={`mt-3 min-h-10 text-sm leading-relaxed text-zinc-500 ${isList ? "line-clamp-3" : "line-clamp-2"}`}>
          {tour.short_description || "A thoughtfully curated holiday with comfortable stays and memorable experiences."}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-500"><span className="flex items-center gap-1"><Hotel size={12} /> Hotel</span><span className="flex items-center gap-1"><Utensils size={12} /> Meals</span><span className="flex items-center gap-1 text-orange-500"><Sparkles size={12} /> 4.8</span></div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
          {tour.price_start_per_person ? (
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">From</p>
              <p className="text-base font-black text-zinc-950">
                {tour.currency || "AED"}{" "}
                <span className="text-lg">{Number(tour.price_start_per_person).toLocaleString()}</span>
                <span className="text-xs font-semibold text-zinc-400"> /person</span>
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-zinc-500">Price on request</p>
          )}
          <span className="flex items-center gap-2 rounded-lg bg-[#075b57] px-4 py-2 text-xs font-bold text-white transition-all group-hover:bg-orange-500">
            View Details <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

const SELECT_CLS = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10";
const INPUT_CLS = SELECT_CLS;

export default function ToursPage() {
  return (
    <Suspense fallback={null}>
      <ToursPageInner />
    </Suspense>
  );
}

function ToursPageInner() {
  const searchParams = useSearchParams();
  const bookingQuery = new URLSearchParams();
  ["travel_date", "adults", "children"].forEach((key) => {
    const value = searchParams.get(key);
    if (value) bookingQuery.set(key, value);
  });
  const [tours, setTours] = useState<PublicTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get("page")) || 1));
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortOption>("popular");
  const [heroAdults, setHeroAdults] = useState(searchParams.get("adults") || "2");
  const [heroDate, setHeroDate] = useState(searchParams.get("travel_date") || "");

  // Pre-fill filters from the URL so links like /tours?country=India&min_days=4
  // (e.g. from the homepage hero filter bar) actually apply on landing,
  // instead of silently being ignored.
  const [filters, setFilters] = useState<TourFilters>(() => filtersFromParams(searchParams));
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    fetchPublicCategories().then(setCategories).catch(() => {});
    fetchPublicCountries().then(setCountries).catch(() => {});
  }, []);

  const load = useCallback(async (f: TourFilters, p: number) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const result = await fetchPublicTours({ ...f, page: p, limit: 12 });
      if (requestId !== requestIdRef.current) return;
      setTours(result.items);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setTours([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(filters, page); }, [filters, page, load]);

  // Keep active filters shareable/bookmarkable without triggering a server
  // navigation for every field change.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    FILTER_KEYS.forEach((key) => {
      if (filters[key]) params.set(key, filters[key]);
      else params.delete(key);
    });
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  }, [filters, page]);

  // Restore the visible controls and results when browser history changes.
  useEffect(() => {
    const restoreFilters = () => {
      const params = new URLSearchParams(window.location.search);
      const restored = filtersFromParams(params);
      setFilters(restored);
      setSearchInput(restored.search);
      setPage(Math.max(1, Number(params.get("page")) || 1));
    };
    window.addEventListener("popstate", restoreFilters);
    return () => window.removeEventListener("popstate", restoreFilters);
  }, []);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    requestIdRef.current += 1;
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: value }));
      setPage(1);
    }, 400);
  };

  const setFilter = (key: keyof typeof filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = null;
    setFilters({ ...EMPTY_FILTERS });
    setSearchInput("");
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const displayedTours = [...tours].sort((a, b) => {
    if (sort === "price-asc") return (a.price_start_per_person ?? Number.MAX_SAFE_INTEGER) - (b.price_start_per_person ?? Number.MAX_SAFE_INTEGER);
    if (sort === "price-desc") return (b.price_start_per_person ?? 0) - (a.price_start_per_person ?? 0);
    if (sort === "duration") return (a.number_of_days ?? Number.MAX_SAFE_INTEGER) - (b.number_of_days ?? Number.MAX_SAFE_INTEGER);
    return 0;
  });

  const searchFromHero = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (filters.country) params.set("country", filters.country); else params.delete("country");
    params.set("adults", heroAdults);
    if (heroDate) params.set("travel_date", heroDate); else params.delete("travel_date");
    window.history.replaceState(null, "", `/tours${params.size ? `?${params}` : ""}`);
    setPage(1);
  };

  // Pagination helper
  const pageNums: number[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNums.push(i);
  } else if (page <= 4) {
    pageNums.push(1, 2, 3, 4, 5, -1, totalPages);
  } else if (page >= totalPages - 3) {
    pageNums.push(1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pageNums.push(1, -1, page - 1, page, page + 1, -2, totalPages);
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">

      {/* hero */}
      <section className="relative overflow-hidden bg-[#063c42] pb-14 pt-32 md:pt-36">
        <div className="absolute inset-0">
          <img
            src={PLACEHOLDER}
            alt="Tropical island resort"
            className="h-full w-full scale-105 object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#073b4c]/90 via-[#073b4c]/55 to-[#073b4c]/15" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8">
          <h1 className="font-heading text-4xl font-black tracking-tight text-white md:text-5xl">Tour Packages</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/80">Handpicked holidays for every kind of traveller.</p>

          <div className="mt-10 grid w-full max-w-5xl grid-cols-1 gap-2 rounded-xl bg-white p-2 shadow-2xl sm:grid-cols-2 lg:grid-cols-[1.25fr_.8fr_1fr_auto]">
            <label className="flex min-h-14 items-center gap-3 rounded-lg px-3 hover:bg-slate-50"><MapPin size={16} className="text-teal-700" /><span className="min-w-0 flex-1"><span className="block text-[9px] font-bold text-slate-400">Destination</span><select value={filters.country} onChange={(event) => setFilter("country", event.target.value)} className="w-full bg-transparent text-sm font-black text-slate-900 outline-none"><option value="">Any Destination</option>{countries.map((country) => <option key={country.id} value={country.country_name}>{country.country_name}</option>)}</select></span></label>
            <label className="flex min-h-14 items-center gap-3 rounded-lg px-3 hover:bg-slate-50"><Users size={16} className="text-teal-700" /><span className="flex-1"><span className="block text-[9px] font-bold text-slate-400">Travellers</span><select value={heroAdults} onChange={(event) => setHeroAdults(event.target.value)} className="w-full bg-transparent text-sm font-black text-slate-900 outline-none">{[1,2,3,4,5,6].map((count) => <option key={count} value={count}>{count} Adult{count > 1 ? "s" : ""}</option>)}</select></span></label>
            <label className="flex min-h-14 items-center gap-3 rounded-lg px-3 hover:bg-slate-50"><CalendarDays size={16} className="text-teal-700" /><span className="flex-1"><span className="block text-[9px] font-bold text-slate-400">Date</span><input type="date" value={heroDate} min={new Date().toISOString().split("T")[0]} onChange={(event) => setHeroDate(event.target.value)} className="w-full bg-transparent text-sm font-black text-slate-900 outline-none" /></span></label>
            <button type="button" onClick={searchFromHero} className="flex min-h-14 items-center justify-center gap-2 rounded-lg bg-orange-500 px-7 text-sm font-black text-white transition hover:bg-orange-600 sm:col-span-2 lg:col-span-1"><Search size={15} /> Search Tours</button>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-7">
        <div className="no-scrollbar mx-auto flex max-w-7xl justify-start gap-4 overflow-x-auto px-5 md:px-8 lg:justify-center lg:gap-5">
          <button type="button" onClick={() => setFilter("category", "")} className={`min-w-20 text-center ${!filters.category ? "text-teal-800" : "text-slate-500"}`}><span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${!filters.category ? "bg-teal-50 ring-2 ring-teal-600" : "bg-slate-50"}`}><Sparkles size={20} /></span><span className="mt-2 block text-[10px] font-black">All Tours</span></button>
          {categories.slice(0, 8).map((category) => <button key={category.id} type="button" onClick={() => setFilter("category", category.slug)} className={`min-w-20 text-center ${filters.category === category.slug ? "text-teal-800" : "text-slate-500"}`}><span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${filters.category === category.slug ? "bg-teal-50 ring-2 ring-teal-600" : "bg-slate-50"}`}><MapPin size={19} /></span><span className="mt-2 block truncate text-[10px] font-black">{category.category_name}</span></button>)}
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-7xl px-5 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-10">
          
          {/* Mobile Filter Toggle */}
          <div className="flex flex-col items-stretch gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] sm:flex-row sm:items-center sm:justify-between sm:p-5 lg:hidden">
            <span className="font-bold text-zinc-950">Filters & Search</span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 rounded-xl bg-teal-50 px-5 py-2.5 text-sm font-bold text-teal-600 transition-colors hover:bg-teal-100"
            >
              <SlidersHorizontal size={18} />
              {showFilters ? "Hide" : "Show"}
            </button>
          </div>

          {/* Sidebar */}
          <aside className={`w-full shrink-0 space-y-4 lg:sticky lg:top-24 ${showFilters ? "block" : "hidden lg:block"}`}>
            
            {/* Search Box */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-black text-zinc-950 mb-4 text-base">Search</h3>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Tour name..."
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50 py-3 pl-11 pr-10 text-sm font-medium text-zinc-950 placeholder-zinc-400 outline-none transition-all focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                />
                {searchInput && (
                  <button type="button" aria-label="Clear search" onClick={() => handleSearchChange("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-4">
                <h3 className="font-black text-zinc-950 text-base">Filters</h3>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors">
                    Clear all
                  </button>
                )}
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-zinc-500">Country</label>
                <select title="Filter by country" value={filters.country} onChange={(e) => setFilter("country", e.target.value)} className={SELECT_CLS}>
                  <option value="">All Countries</option>
                  {countries.map((c) => <option key={c.id} value={c.country_name}>{c.country_name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-zinc-500">Category</label>
                <select title="Filter by category" value={filters.category} onChange={(e) => setFilter("category", e.target.value)} className={SELECT_CLS}>
                  <option value="">All Categories</option>
                  {categories.map((c) => <option key={c.id} value={c.slug}>{c.category_name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-zinc-500">Duration (Days)</label>
                <div className="flex items-center gap-3">
                  <input type="number" min={1} value={filters.min_days} onChange={(e) => setFilter("min_days", e.target.value)} placeholder="Min" className={INPUT_CLS} />
                  <span className="text-zinc-300">-</span>
                  <input type="number" min={1} value={filters.max_days} onChange={(e) => setFilter("max_days", e.target.value)} placeholder="Max" className={INPUT_CLS} />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-zinc-500">Price Range</label>
                <div className="flex items-center gap-3">
                  <input type="number" min={0} value={filters.min_price} onChange={(e) => setFilter("min_price", e.target.value)} placeholder="Min" className={INPUT_CLS} />
                  <span className="text-zinc-300">-</span>
                  <input type="number" min={0} value={filters.max_price} onChange={(e) => setFilter("max_price", e.target.value)} placeholder="Max" className={INPUT_CLS} />
                </div>
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <div className="min-w-0">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm font-bold text-zinc-500">
                {loading ? "Finding tours…" : <><span className="text-zinc-950 text-base">{total.toLocaleString()}</span> tour{total !== 1 ? "s" : ""} found</>}
              </p>
              
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} title="Sort tours" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-teal-600">
                  <option value="popular">Sort: Popular</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="duration">Duration: Shortest</option>
                </select>
                <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-zinc-700"}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-zinc-700"}`}
                  aria-label="List view"
                >
                  <List size={18} />
                </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className={`grid gap-6 ${view === "grid" ? "sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`animate-pulse overflow-hidden rounded-3xl border border-slate-100 bg-white ${view === "list" ? "flex" : ""}`}>
                    <div className={`bg-zinc-100 ${view === "list" ? "w-64 h-full shrink-0" : "aspect-[3/2]"}`} />
                    <div className="p-6 flex-1 space-y-4">
                      <div className="h-5 w-3/4 rounded-full bg-zinc-100" />
                      <div className="h-4 w-1/2 rounded-full bg-zinc-100" />
                      <div className="mt-6 flex justify-between border-t border-slate-100 pt-5">
                        <div className="h-8 w-32 rounded-full bg-zinc-100" />
                        <div className="h-9 w-20 rounded-xl bg-zinc-100" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tours.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white py-32 text-center px-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-teal-500 mb-5">
                  <Search size={32} />
                </div>
                <h3 className="text-2xl font-black text-zinc-950">No tours found</h3>
                <p className="mt-3 max-w-sm text-base text-zinc-500 leading-relaxed">
                  We couldn&apos;t find any tours matching your criteria. Try adjusting your filters or searching for something else.
                </p>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="mt-8 rounded-xl bg-teal-600 px-8 py-3.5 text-sm font-bold text-white hover:bg-teal-700 transition-colors hover:shadow-lg">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className={`grid gap-6 ${view === "grid" ? "sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
                {displayedTours.map((tour, i) => <TourCard key={tour.id} tour={tour} index={i} view={view} bookingQuery={bookingQuery.toString()} />)}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-14 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                  className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-700 transition-all disabled:opacity-30 hover:border-zinc-300 hover:bg-slate-50 hover:shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>

                {pageNums.map((num, i) =>
                  num < 0 ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-zinc-400 font-bold">…</span>
                  ) : (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPage(num)}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                        num === page
                          ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                      }`}
                    >
                      {num}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                  className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-700 transition-all disabled:opacity-30 hover:border-zinc-300 hover:bg-slate-50 hover:shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        <section className="relative mt-14 overflow-hidden rounded-2xl bg-[#075b57] text-white">
          <img src={PLACEHOLDER} alt="Tropical island travel destination" className="absolute inset-y-0 right-0 hidden h-full w-2/5 object-cover opacity-90 md:block" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#075b57] via-[#075b57] to-transparent md:via-[#075b57]/90" />
          <div className="relative max-w-2xl p-8 md:p-10"><p className="text-xs font-black uppercase tracking-[0.2em] text-teal-200">Personalised planning</p><h2 className="mt-3 text-2xl font-black">Can&apos;t find what you&apos;re looking for?</h2><p className="mt-2 text-sm leading-6 text-white/75">Let our travel experts create a personalised itinerary just for you.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/contact" className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-black hover:bg-orange-600">Plan My Trip</Link><Link href="/contact" className="rounded-lg border border-white/60 px-6 py-3 text-sm font-black hover:bg-white hover:text-teal-900">Talk to an Expert</Link></div></div>
        </section>
      </div>
    </main>
  );
}
