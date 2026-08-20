"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LuCalendarDays as Calendar, LuChevronDown as ChevronDown, LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuCompass as Compass, LuFilter as Filter, LuGrid2X2 as Grid, LuList as List, LuMapPin as MapPin, LuSearch as Search, LuUsers as Users, LuX as X } from "react-icons/lu";
import { fetchPublicCategories, fetchPublicCountries, fetchPublicTours, PublicTour } from "@/lib/api/publicClient";
import { useCurrency } from "@/hooks/useCurrency";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { publicTourUrl, slugifyTourSegment } from "@/lib/utils/tourUrl";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import TourCard from "@/components/public/TourCard";

const FALLBACK = "/images/tour-card-fallback.jpg";
const HERO_FALLBACK = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80";
const PAGE_SIZE = 6;
const PRICE_BOUNDS: [number, number] = [0, 200000];

export default function CountryTourListing({ countrySlug }: { countrySlug?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCountry = searchParams.get("country") || "";
  const querySearch = searchParams.get("search") || "";
  const queryCategory = searchParams.get("category") || "";
  const queryMinDays = searchParams.get("min_days") || "";
  const queryMaxDays = searchParams.get("max_days") || "";
  const queryMinPrice = searchParams.get("min_price") || "";
  const queryMaxPrice = searchParams.get("max_price") || "";
  const queryDepartureMonth = searchParams.get("departure_month") || "";
  const querySort = searchParams.get("sort") || "newest";
  const { formatCompact } = useCurrency();
  const { isWishlisted, toggleWishlist } = useTravelStore();
  const [countryName, setCountryName] = useState("");
  const [tours, setTours] = useState<PublicTour[]>([]);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  // Cities can't be filtered server-side (no such API param) so this narrows
  // the already-fetched, already-filtered-by-everything-else tour list.
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set());

  // Sidebar filters are staged here and only committed to the URL (which
  // triggers a refetch) when "Apply filters" is clicked, matching the
  // reference design's staged-filter pattern instead of refetching on every
  // click/keystroke.
  const [draftSearch, setDraftSearch] = useState(querySearch);
  const [draftCountry, setDraftCountry] = useState(queryCountry);
  const [draftCategory, setDraftCategory] = useState(queryCategory);
  const [draftDeparture, setDraftDeparture] = useState(queryDepartureMonth);
  const [draftDurationTier, setDraftDurationTier] = useState(() => durationTierFor(queryMinDays, queryMaxDays));
  const [draftMinPrice, setDraftMinPrice] = useState(Number(queryMinPrice) || PRICE_BOUNDS[0]);
  const [draftMaxPrice, setDraftMaxPrice] = useState(Number(queryMaxPrice) || PRICE_BOUNDS[1]);

  useEffect(() => {
    setDraftSearch(querySearch);
    setDraftCountry(queryCountry);
    setDraftCategory(queryCategory);
    setDraftDeparture(queryDepartureMonth);
    setDraftDurationTier(durationTierFor(queryMinDays, queryMaxDays));
    setDraftMinPrice(Number(queryMinPrice) || PRICE_BOUNDS[0]);
    setDraftMaxPrice(Number(queryMaxPrice) || PRICE_BOUNDS[1]);
    setSelectedCities(new Set());
    setPage(1);
  }, [queryCountry, queryCategory, queryDepartureMonth, queryMaxDays, queryMaxPrice, queryMinDays, queryMinPrice, querySearch]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    Promise.all([fetchPublicCountries(), fetchPublicCategories()])
      .then(([countries, categories]) => {
        if (active) {
          setCountryOptions(countries.map((item) => item.country_name));
          setCategoryOptions(categories.map((item) => ({ label: item.category_name, value: item.slug })));
        }
        const selected = countrySlug
          ? countries.find((item) => slugifyTourSegment(item.country_name) === countrySlug)
          : countries.find((item) => item.country_name.toLowerCase() === queryCountry.toLowerCase());
        if (countrySlug && !selected) throw new Error("Country not found");
        const resolvedCountry = selected?.country_name || queryCountry;
        if (active) setCountryName(resolvedCountry);
        // available_only requires a TourCalendar departure row (future
        // date, open seats) -- there's no UI control to opt into that
        // filter, so it must not be forced on by default or every
        // published tour without a configured calendar silently vanishes
        // from the listing regardless of any other filter.
        const params: Record<string, string | number | boolean> = { limit: 100 };
        if (resolvedCountry) params.country = resolvedCountry;
        if (querySearch) params.search = querySearch;
        if (queryCategory) params.category = queryCategory;
        if (queryMinDays) params.min_days = queryMinDays;
        if (queryMaxDays) params.max_days = queryMaxDays;
        if (queryMinPrice) params.min_price = queryMinPrice;
        if (queryMaxPrice) params.max_price = queryMaxPrice;
        if (queryDepartureMonth) params.departure_month = queryDepartureMonth;
        if (querySort) params.sort = querySort;
        return fetchPublicTours(params);
      })
      .then((result) => { if (active) setTours(result.items); })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [countrySlug, queryCategory, queryCountry, queryDepartureMonth, queryMaxDays, queryMaxPrice, queryMinDays, queryMinPrice, querySearch, querySort]);

  const applyFilter = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key));
    router.push(`/tours${params.size ? `?${params}` : ""}`);
  };

  const applyDraftFilters = () => {
    const [durMin, durMax] = durationRangeFor(draftDurationTier);
    applyFilter({
      search: draftSearch,
      country: draftCountry,
      category: draftCategory,
      departure_month: draftDeparture,
      min_days: durMin,
      max_days: durMax,
      min_price: draftMinPrice > PRICE_BOUNDS[0] ? String(draftMinPrice) : "",
      max_price: draftMaxPrice < PRICE_BOUNDS[1] ? String(draftMaxPrice) : "",
    });
  };

  const clearFilters = () => {
    setSelectedCities(new Set());
    applyFilter({ min_price: "", max_price: "", min_days: "", max_days: "", country: "", category: "", departure_month: "", sort: "", search: "" });
  };

  const removeFilter = (key: string) => applyFilter({ [key]: "" });

  const cityFacets = useMemo(() => {
    const counts = new Map<string, number>();
    tours.forEach((tour) => { if (tour.city_name) counts.set(tour.city_name, (counts.get(tour.city_name) || 0) + 1); });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [tours]);

  const toggleCity = (city: string) => {
    setSelectedCities((prev) => {
      const next = new Set(prev);
      if (next.has(city)) next.delete(city); else next.add(city);
      return next;
    });
    setPage(1);
  };

  const filteredTours = useMemo(
    () => (selectedCities.size ? tours.filter((tour) => selectedCities.has(tour.city_name)) : tours),
    [tours, selectedCities]
  );

  const dayRange = useMemo(() => {
    const days = tours.map((tour) => tour.number_of_days).filter((value): value is number => Boolean(value));
    if (!days.length) return null;
    return { min: Math.min(...days), max: Math.max(...days) };
  }, [tours]);

  const totalPages = Math.max(1, Math.ceil(filteredTours.length / PAGE_SIZE));
  const pagedTours = filteredTours.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-white"><div className="h-11 w-11 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600" /></div>;
  if (notFound) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white"><MapPin size={42} className="text-slate-300" /><h1 className="text-2xl font-black">Destination not found</h1><Link href="/tours" className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white">Browse all tours</Link></div>;

  const heroBanner = tours.find((tour) => tour.banner_image)?.banner_image;
  const heroSrc = heroBanner ? mediaUrl(heroBanner) : HERO_FALLBACK;
  const eyebrow = countryName ? `Curated ${countryName} Tours` : "Curated Tours";
  const heroTitle = countryName ? `Explore ${countryName}, Your Way` : querySearch ? `Results for “${querySearch}”` : "Discover Your Next Adventure";
  const heroSubtitle = countryName ? "Handpicked journeys through iconic cities, mountains and coastlines." : "Handpicked tours across our destinations, from coastlines to mountain trails.";

  const activeChips = [
    queryCategory ? { key: "category", label: categoryOptions.find((c) => c.value === queryCategory)?.label || queryCategory } : null,
    (queryMinDays || queryMaxDays) ? { key: "min_days", label: durationLabelFor(queryMinDays, queryMaxDays) } : null,
    (queryMinPrice || queryMaxPrice) ? { key: "min_price", label: `${queryMinPrice ? formatCompact(Number(queryMinPrice)) : "Any"} – ${queryMaxPrice ? formatCompact(Number(queryMaxPrice)) : "Any"}` } : null,
    queryDepartureMonth ? { key: "departure_month", label: monthLabel(queryDepartureMonth) } : null,
    querySearch ? { key: "search", label: `“${querySearch}”` } : null,
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));

  return (
    <main className="min-h-screen bg-white pb-24 pt-16 text-slate-950">
      <section className="relative overflow-hidden">
        <div className="relative h-[320px] w-full overflow-hidden rounded-b-[28px] md:h-[380px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroSrc} alt={countryName || "Tourvaa"} className="h-full w-full scale-105 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-5 md:px-10 xl:px-16">
            <nav className="flex items-center gap-2 text-xs font-semibold text-white/70">
              <Link href="/" className="transition-colors hover:text-white">Home</Link><span className="text-white/30">/</span>
              <Link href="/tours" className="transition-colors hover:text-white">Tours</Link>
              {countryName && <><span className="text-white/30">/</span><span className="text-white">{countryName}</span></>}
            </nav>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-blue-300">{eyebrow}</p>
            <h1 className="mt-2 max-w-2xl text-3xl font-black tracking-tight text-white drop-shadow-sm md:text-5xl">{heroTitle}</h1>
            <p className="mt-3 max-w-xl text-sm font-semibold text-white/80">{heroSubtitle}</p>
            <Link href="/travel-advice" className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:border-white/60 hover:bg-white/20 hover:shadow-lg">View travel guide</Link>
          </div>
        </div>
        <div className="px-5 md:px-10 xl:px-16">
          <div className="relative z-10 -mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-slate-100 bg-white px-6 py-5 text-sm font-bold text-slate-700 shadow-[0_20px_48px_rgba(15,23,42,.14)]">
            <span className="flex items-center gap-2"><Compass size={16} className="text-blue-600" />{filteredTours.length} Tour{filteredTours.length === 1 ? "" : "s"}</span>
            {dayRange && <span className="flex items-center gap-2 border-l border-slate-100 pl-8"><Calendar size={16} className="text-blue-600" />{dayRange.min}–{dayRange.max} Days</span>}
            <span className="flex items-center gap-2 border-l border-slate-100 pl-8"><Users size={16} className="text-blue-600" />Group & Private</span>
            <span className="flex items-center gap-2 border-l border-slate-100 pl-8"><Calendar size={16} className="text-blue-600" />Flexible Dates</span>
          </div>
        </div>
      </section>

      <div className="w-full px-5 pt-10 md:px-10 xl:px-16">
        <div className="grid items-start gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,.05)] lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">Filters</h3>
              <button type="button" onClick={clearFilters} className="text-xs font-bold text-blue-600 transition-colors hover:text-blue-700 hover:underline">Clear all</button>
            </div>
            <label className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 transition-colors focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <Search size={14} className="text-slate-400" />
              <input value={draftSearch} onChange={(e) => setDraftSearch(e.target.value)} placeholder="Search tours" className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400" />
            </label>

            {(countryName ? cityFacets.length > 0 : countryOptions.length > 0) && (
              <FilterSection title="Destination" defaultOpen>
                <div className="space-y-2">
                  {countryName
                    ? cityFacets.map(([city, count]) => (
                      <label key={city} className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-2"><input type="checkbox" checked={selectedCities.has(city)} onChange={() => toggleCity(city)} className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600" />{city}</span>
                        <span className="text-slate-400">({count})</span>
                      </label>
                    ))
                    : countryOptions.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input type="checkbox" checked={draftCountry === option} onChange={() => setDraftCountry(draftCountry === option ? "" : option)} className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600" />{option}
                      </label>
                    ))}
                </div>
              </FilterSection>
            )}

            <FilterSection title="Departure month">
              <select value={draftDeparture} onChange={(e) => setDraftDeparture(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 outline-none">
                {departureMonths().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </FilterSection>

            <FilterSection title="Duration" defaultOpen>
              <div className="flex flex-wrap gap-2">
                {[{ label: "Any", value: "" }, { label: "1–3 days", value: "1-3" }, { label: "4–7 days", value: "4-7" }, { label: "8+ days", value: "8+" }].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDraftDurationTier(option.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${draftDurationTier === option.value ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-200" : "border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Price range" defaultOpen>
              <PriceRangeSlider min={draftMinPrice} max={draftMaxPrice} bounds={PRICE_BOUNDS} onChange={(lo, hi) => { setDraftMinPrice(lo); setDraftMaxPrice(hi); }} format={formatCompact} />
            </FilterSection>

            {categoryOptions.length > 0 && (
              <FilterSection title="Category">
                <div className="space-y-2">
                  {categoryOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input type="checkbox" checked={draftCategory === option.value} onChange={() => setDraftCategory(draftCategory === option.value ? "" : option.value)} className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600" />{option.label}
                    </label>
                  ))}
                </div>
              </FilterSection>
            )}

            <button type="button" onClick={applyDraftFilters} className="mt-6 w-full rounded-lg bg-blue-600 py-3 text-sm font-black text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-200">Apply filters</button>
          </aside>

          <div className="min-w-0">
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pb-6">
                {activeChips.map((chip) => (
                  <span key={chip.key} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:border-slate-300">
                    {chip.label}
                    <button type="button" aria-label={`Remove ${chip.label} filter`} onClick={() => removeFilter(chip.key)} className="text-slate-400 transition-colors hover:text-slate-700"><X size={12} /></button>
                  </span>
                ))}
                <button type="button" onClick={clearFilters} className="text-xs font-bold text-blue-600 hover:underline">Clear all</button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
              <FilterSelect
                label="Sort by"
                prefix="Sort by:"
                value={querySort}
                active={querySort !== "newest"}
                options={[{ label: "Recommended", value: "newest" }, { label: "Price: Low to high", value: "price_asc" }, { label: "Price: High to low", value: "price_desc" }, { label: "Shortest first", value: "duration_asc" }]}
                onChange={(value) => applyFilter({ sort: value })}
              />
              <div className="flex rounded-lg bg-slate-50 p-1"><button type="button" aria-label="Grid view" onClick={() => setView("grid")} className={`flex h-8 w-8 items-center justify-center rounded transition-all ${view === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}><Grid size={17} /></button><button type="button" aria-label="List view" onClick={() => setView("list")} className={`flex h-8 w-8 items-center justify-center rounded transition-all ${view === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}><List size={18} /></button></div>
            </div>

            {pagedTours.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-24 text-center"><Filter size={34} className="mx-auto text-slate-300" /><h2 className="mt-5 text-xl font-black">No tours match these filters</h2><p className="mt-1.5 text-sm font-semibold text-slate-500">Try widening your search or clearing a filter.</p><button type="button" onClick={clearFilters} className="mt-5 inline-flex rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-md">Clear filters</button></div>
            ) : (
              <div className={`grid items-start gap-8 ${view === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
                {pagedTours.map((tour) => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                    format={formatCompact}
                    variant="search"
                    view={view}
                    wishlisted={isWishlisted(tour.id)}
                    onWishlist={() => toggleWishlist({ id: tour.id, title: tour.title, place: tour.country_name, image: tour.banner_image ? mediaUrl(tour.banner_image) : FALLBACK, price: tour.price_start_per_person, currency: tour.currency || "USD", duration: tour.number_of_days ? `${tour.number_of_days} days` : "Flexible", href: publicTourUrl(tour) })}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-30"><ChevronLeft size={16} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button key={num} type="button" onClick={() => setPage(num)} className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold transition-all ${page === num ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-200" : "border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"}`}>{num}</button>
                ))}
                <button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function FilterSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-xs font-black uppercase tracking-wide text-slate-700 transition-colors hover:text-blue-600">
        {title}<ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function PriceRangeSlider({ min, max, bounds, onChange, format }: { min: number; max: number; bounds: [number, number]; onChange: (min: number, max: number) => void; format: (n: number) => string }) {
  const [lo, hi] = bounds;
  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const thumb = "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:pointer-events-auto";
  return (
    <div>
      <div className="relative h-1.5 rounded-full bg-slate-200">
        <div className="absolute h-1.5 rounded-full bg-blue-600" style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }} />
        <input type="range" min={lo} max={hi} step={1000} value={min} onChange={(e) => onChange(Math.min(Number(e.target.value), max), max)} className={`pointer-events-none absolute inset-0 z-10 w-full appearance-none bg-transparent ${thumb}`} />
        <input type="range" min={lo} max={hi} step={1000} value={max} onChange={(e) => onChange(min, Math.max(Number(e.target.value), min))} className={`pointer-events-none absolute inset-0 z-20 w-full appearance-none bg-transparent ${thumb}`} />
      </div>
      <div className="mt-3 flex justify-between text-xs font-semibold text-slate-500"><span>{format(min)}</span><span>{format(max)}{max >= hi ? "+" : ""}</span></div>
    </div>
  );
}

function FilterSelect({ label, value, active, options, onChange, prefix }: { label: string; value: string; active: boolean; options: { label: string; value: string }[]; onChange: (value: string) => void; prefix?: string }) {
  return (
    <label className={`relative flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-all ${active ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-200" : "border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600"}`}>
      {prefix && <span className={active ? "text-white/80" : "text-slate-400"}>{prefix}</span>}
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="cursor-pointer appearance-none bg-transparent py-0 pl-0 pr-5 text-xs font-semibold outline-none">
        <option value={value} disabled hidden>{options.find((option) => option.value === value)?.label || label}</option>
        {options.map((option) => <option key={`${label}-${option.value}`} value={option.value} className="bg-white text-slate-900">{option.label}</option>)}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2" />
    </label>
  );
}

function departureMonths() {
  const today = new Date();
  const options = [{ label: "Any departure month", value: "" }];
  for (let offset = 0; offset < 12; offset += 1) {
    const date = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    options.push({ label: new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date), value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` });
  }
  return options;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(year, (month || 1) - 1, 1));
}

function durationTierFor(minDays: string, maxDays: string) {
  if (minDays === "1" && maxDays === "3") return "1-3";
  if (minDays === "4" && maxDays === "7") return "4-7";
  if (minDays === "8" && !maxDays) return "8+";
  return "";
}

function durationRangeFor(tier: string): [string, string] {
  if (tier === "1-3") return ["1", "3"];
  if (tier === "4-7") return ["4", "7"];
  if (tier === "8+") return ["8", ""];
  return ["", ""];
}

function durationLabelFor(minDays: string, maxDays: string) {
  if (minDays && maxDays) return `${minDays}–${maxDays} Days`;
  if (minDays) return `${minDays}+ Days`;
  return `Up to ${maxDays} Days`;
}
