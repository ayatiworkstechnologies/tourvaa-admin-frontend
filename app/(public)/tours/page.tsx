"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight, LuClock as Clock, LuMapPin as MapPin, LuSearch as Search, LuSlidersHorizontal as SlidersHorizontal, LuSparkles as Sparkles, LuX as X, LuLayoutGrid as LayoutGrid, LuList as List } from "react-icons/lu";
import { fetchPublicCategories, fetchPublicCountries, fetchPublicTours, PublicCategory, PublicCountry, PublicTour } from "@/lib/publicApi";
import { mediaUrl } from "@/lib/media-url";

const PLACEHOLDER = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=75";

function TourCard({ tour, index, view = "grid" }: { tour: PublicTour; index: number; view?: "grid" | "list" }) {
  const isList = view === "list";
  return (
    <Link
      href={`/tours/${tour.id}`}
      className={`tour-card group flex overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] ${isList ? "flex-col sm:flex-row" : "flex-col"}`}
      style={{ animationDelay: `${(index % 6) * 60}ms` }}
    >
      {/* Image */}
      <div className={`relative overflow-hidden bg-zinc-100 ${isList ? "aspect-[3/2] sm:aspect-auto sm:w-72 shrink-0" : "aspect-[3/2]"}`}>
        <img
          src={tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER}
          alt={tour.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {tour.category_name && (
            <span className="rounded-xl bg-indigo-600/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-sm">
              {tour.category_name}
            </span>
          )}
        </div>

        {/* Duration badge */}
        {tour.number_of_days && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-xl bg-black/40 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-sm">
            <Clock size={12} />
            {tour.number_of_days}D
          </span>
        )}

        {/* Location overlay */}
        {(tour.city_name || tour.country_name) && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs font-semibold text-white/90 drop-shadow-md">
            <MapPin size={12} className="shrink-0 text-indigo-400" />
            {[tour.city_name, tour.country_name].filter(Boolean).join(", ")}
          </div>
        )}
      </div>

      {/* Body */}
      <div className={`flex flex-1 flex-col ${isList ? "p-6 sm:p-8" : "p-6"}`}>
        <h3 className={`font-black leading-snug text-zinc-950 transition-colors group-hover:text-indigo-600 ${isList ? "text-xl line-clamp-2" : "text-lg line-clamp-2"}`}>
          {tour.title}
        </h3>
        {tour.short_description && (
          <p className={`mt-3 text-sm leading-relaxed text-zinc-500 ${isList ? "line-clamp-3" : "line-clamp-2"}`}>
            {tour.short_description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-5 mt-6">
          {tour.price_start_per_person ? (
            <div>
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
          <span className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600 transition-all group-hover:bg-indigo-600 group-hover:text-white">
            View <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-zinc-100 bg-white">
      <div className="aspect-[3/2] bg-zinc-100" />
      <div className="p-6 space-y-4">
        <div className="h-5 w-3/4 rounded-full bg-zinc-100" />
        <div className="h-4 w-1/2 rounded-full bg-zinc-100" />
        <div className="mt-6 flex justify-between border-t border-zinc-100 pt-5">
          <div className="h-8 w-32 rounded-full bg-zinc-100" />
          <div className="h-9 w-20 rounded-xl bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}

const SELECT_CLS = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";
const INPUT_CLS = SELECT_CLS;

export default function ToursPage() {
  const [tours, setTours] = useState<PublicTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const [filters, setFilters] = useState({
    search: "", country: "", category: "",
    min_days: "", max_days: "", min_price: "", max_price: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchPublicCategories().then(setCategories).catch(() => {});
    fetchPublicCountries().then(setCountries).catch(() => {});
  }, []);

  const load = useCallback(async (f: typeof filters, p: number) => {
    setLoading(true);
    try {
      const result = await fetchPublicTours({ ...f, page: p, limit: 12 });
      setTours(result.items);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    } catch {
      setTours([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filters, page); }, [filters, page, load]);

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
    setFilters({ search: "", country: "", category: "", min_days: "", max_days: "", min_price: "", max_price: "" });
    setSearchInput("");
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const activeCount = Object.values(filters).filter(Boolean).length;

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
    <main className="min-h-screen bg-zinc-50 pb-24">

      {/* hero */}
      <section className="relative overflow-hidden bg-zinc-950 py-20 md:py-24">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1800&q=60"
            alt=""
            className="h-full w-full object-cover opacity-20 scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/50" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-indigo-400 backdrop-blur-md shadow-lg">
            <Sparkles size={14} />
            Explore Tours
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight text-white md:text-5xl">
            Find your perfect<br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">adventure</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-400">
            Curated travel experiences across India and the Middle East. Filter by destination, duration, or budget.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 md:px-8 mt-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex justify-between items-center bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-zinc-100">
            <span className="font-bold text-zinc-950">Filters & Search</span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors hover:bg-indigo-100"
            >
              <SlidersHorizontal size={18} />
              {showFilters ? "Hide" : "Show"}
            </button>
          </div>

          {/* Sidebar */}
          <aside className={`w-full lg:w-72 shrink-0 space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}>
            
            {/* Search Box */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="font-black text-zinc-950 mb-4 text-base">Search</h3>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Tour name..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-10 text-sm font-medium text-zinc-950 placeholder-zinc-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
                {searchInput && (
                  <button type="button" aria-label="Clear search" onClick={() => handleSearchChange("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-100 pb-4">
                <h3 className="font-black text-zinc-950 text-base">Filters</h3>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
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
          <div className="flex-1">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm font-bold text-zinc-500">
                {loading ? "Finding tours…" : <><span className="text-zinc-950 text-base">{total.toLocaleString()}</span> tour{total !== 1 ? "s" : ""} found</>}
              </p>
              
              <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-zinc-100 shadow-sm self-start sm:self-auto">
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

            {loading ? (
              <div className={`grid gap-6 ${view === "grid" ? "sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`animate-pulse overflow-hidden rounded-3xl border border-zinc-100 bg-white ${view === "list" ? "flex" : ""}`}>
                    <div className={`bg-zinc-100 ${view === "list" ? "w-64 h-full shrink-0" : "aspect-[3/2]"}`} />
                    <div className="p-6 flex-1 space-y-4">
                      <div className="h-5 w-3/4 rounded-full bg-zinc-100" />
                      <div className="h-4 w-1/2 rounded-full bg-zinc-100" />
                      <div className="mt-6 flex justify-between border-t border-zinc-100 pt-5">
                        <div className="h-8 w-32 rounded-full bg-zinc-100" />
                        <div className="h-9 w-20 rounded-xl bg-zinc-100" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tours.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white py-32 text-center px-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-500 mb-5">
                  <Search size={32} />
                </div>
                <h3 className="text-2xl font-black text-zinc-950">No tours found</h3>
                <p className="mt-3 max-w-sm text-base text-zinc-500 leading-relaxed">
                  We couldn't find any tours matching your criteria. Try adjusting your filters or searching for something else.
                </p>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="mt-8 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors hover:shadow-lg">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className={`grid gap-6 ${view === "grid" ? "sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
                {tours.map((tour, i) => <TourCard key={tour.id} tour={tour} index={i} view={view} />)}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-14 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-700 transition-all disabled:opacity-30 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm"
                >
                  ←
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
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
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
                  className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-700 transition-all disabled:opacity-30 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
