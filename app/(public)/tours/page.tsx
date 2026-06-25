"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { fetchPublicCategories, fetchPublicCountries, fetchPublicTours, PublicCategory, PublicCountry, PublicTour } from "@/lib/publicApi";
import { mediaUrl } from "@/lib/media-url";

const PLACEHOLDER = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=75";

function TourCard({ tour, index }: { tour: PublicTour; index: number }) {
  return (
    <Link
      href={`/tours/${tour.id}`}
      className="tour-card group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 transition-all duration-400 hover:-translate-y-1.5 hover:shadow-2xl"
      style={{ animationDelay: `${(index % 6) * 60}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
        <img
          src={tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER}
          alt={tour.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {tour.category_name && (
            <span className="rounded-lg bg-sky-500/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
              {tour.category_name}
            </span>
          )}
        </div>

        {/* Duration badge */}
        {tour.number_of_days && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            <Clock size={11} />
            {tour.number_of_days}D
          </span>
        )}

        {/* Location overlay */}
        {(tour.city_name || tour.country_name) && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-semibold text-white/90">
            <MapPin size={11} className="shrink-0" />
            {[tour.city_name, tour.country_name].filter(Boolean).join(", ")}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-[#0F172A] transition-colors group-hover:text-sky-600">
          {tour.title}
        </h3>
        {tour.short_description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
            {tour.short_description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
          {tour.price_start_per_person ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From</p>
              <p className="text-base font-black text-[#0F172A]">
                {tour.currency || "AED"}{" "}
                <span className="text-lg">{Number(tour.price_start_per_person).toLocaleString()}</span>
                <span className="text-xs font-normal text-slate-400"> /person</span>
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-500">Price on request</p>
          )}
          <span className="flex items-center gap-1 rounded-xl bg-[#0A0F1E] px-3.5 py-2 text-xs font-bold text-white transition-all group-hover:bg-sky-500 group-hover:gap-2">
            View <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <div className="aspect-[3/2] bg-slate-100" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-3/4 rounded-full bg-slate-100" />
        <div className="h-3 w-1/2 rounded-full bg-slate-100" />
        <div className="mt-4 flex justify-between border-t border-slate-100 pt-4">
          <div className="h-6 w-28 rounded-full bg-slate-100" />
          <div className="h-8 w-16 rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

const SELECT_CLS = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-100";
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
    <main className="min-h-screen bg-[#F5F8FC] pb-24">

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-[#0A0F1E] py-20 md:py-24">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1800&q=60"
            alt=""
            className="h-full w-full object-cover opacity-15"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F1E] via-[#0A0F1E]/90 to-[#0A0F1E]/60" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-sky-400 backdrop-blur-sm">
            <Sparkles size={12} />
            Explore Tours
          </div>
          <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-white md:text-5xl">
            Find your perfect<br />
            <span className="text-sky-400">adventure</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/50">
            Curated travel experiences across India and the Middle East. Filter by destination, duration, or budget.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 md:px-8">

        {/* ─── Search bar ─── */}
        <div className="relative -mt-7 z-20">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl shadow-slate-200/60">
            <div className="flex gap-2.5">
              {/* Search input */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search tours by name or destination…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-9 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
                {searchInput && (
                  <button type="button" aria-label="Clear search" onClick={() => handleSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter toggle */}
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                  showFilters || hasActiveFilters
                    ? "bg-[#0A0F1E] text-white shadow-md"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                    {activeCount}
                  </span>
                )}
              </button>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div className="mt-3.5 grid gap-3 border-t border-slate-100 pt-3.5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Country</label>
                  <select title="Filter by country" value={filters.country} onChange={(e) => setFilter("country", e.target.value)} className={SELECT_CLS}>
                    <option value="">All Countries</option>
                    {countries.map((c) => <option key={c.id} value={c.country_name}>{c.country_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
                  <select title="Filter by category" value={filters.category} onChange={(e) => setFilter("category", e.target.value)} className={SELECT_CLS}>
                    <option value="">All Categories</option>
                    {categories.map((c) => <option key={c.id} value={c.slug}>{c.category_name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Min Days</label>
                    <input type="number" min={1} value={filters.min_days} onChange={(e) => setFilter("min_days", e.target.value)} placeholder="3" className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Days</label>
                    <input type="number" min={1} value={filters.max_days} onChange={(e) => setFilter("max_days", e.target.value)} placeholder="14" className={INPUT_CLS} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Min Price</label>
                    <input type="number" min={0} value={filters.min_price} onChange={(e) => setFilter("min_price", e.target.value)} placeholder="500" className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Price</label>
                    <input type="number" min={0} value={filters.max_price} onChange={(e) => setFilter("max_price", e.target.value)} placeholder="5000" className={INPUT_CLS} />
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="flex items-end sm:col-span-2 lg:col-span-4">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-500 transition-all hover:bg-red-100"
                    >
                      <X size={14} /> Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Results ─── */}
        <div className="py-8">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">
              {loading ? "Finding tours…" : `${total.toLocaleString()} tour${total !== 1 ? "s" : ""} found`}
            </p>
            {hasActiveFilters && !loading && (
              <button type="button" onClick={clearFilters} className="text-xs font-bold text-sky-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : tours.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <MapPin size={28} className="text-slate-400" />
              </div>
              <p className="mt-4 text-lg font-bold text-[#0F172A]">No tours found</p>
              <p className="mt-2 max-w-xs text-sm text-slate-500">Try adjusting your filters or search terms.</p>
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="mt-5 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600 transition-colors">
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tours.map((tour, i) => <TourCard key={tour.id} tour={tour} index={i} />)}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all disabled:opacity-30 hover:border-slate-300 hover:shadow-sm"
              >
                ←
              </button>

              {pageNums.map((num, i) =>
                num < 0 ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-slate-400">…</span>
                ) : (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPage(num)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                      num === page
                        ? "bg-[#0A0F1E] text-white shadow-md"
                        : "text-slate-500 hover:bg-slate-100"
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
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all disabled:opacity-30 hover:border-slate-300 hover:shadow-sm"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
