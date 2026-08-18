"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LuCalendarDays as Calendar, LuChevronDown as ChevronDown, LuClock3 as Clock, LuFilter as Filter, LuGrid2X2 as Grid, LuHouse as Home, LuList as List, LuSearch as Search, LuSlidersHorizontal as Sliders, LuMapPin as MapPin } from "react-icons/lu";
import { fetchPublicCategories, fetchPublicCountries, fetchPublicTours, PublicTour } from "@/lib/api/publicClient";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/useToast";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { publicTourUrl, slugifyTourSegment } from "@/lib/utils/tourUrl";
import { MAX_COMPARE_ITEMS, useTravelStore } from "@/providers/TravelStoreProvider";
import TourCard from "@/components/public/TourCard";

const FALLBACK = "/images/tour-card-fallback.jpg";

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
  const { isWishlisted, toggleWishlist, isCompared, toggleCompare, compareCount } = useTravelStore();
  const toast = useToast();
  const [countryName, setCountryName] = useState("");
  const [destination, setDestination] = useState(queryCountry);
  const [tours, setTours] = useState<PublicTour[]>([]);
  const [total, setTotal] = useState(0);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

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
        if (active) {
          setCountryName(resolvedCountry);
          setDestination(resolvedCountry);
        }
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
      .then((result) => { if (active) { setTours(result.items); setTotal(result.total); } })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [countrySlug, queryCategory, queryCountry, queryDepartureMonth, queryMaxDays, queryMaxPrice, queryMinDays, queryMinPrice, querySearch, querySort]);

  const applyFilter = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key));
    router.push(`/tours${params.size ? `?${params}` : ""}`);
  };

  const activeFilterCount = [
    Boolean(queryMinPrice || queryMaxPrice),
    Boolean(queryMinDays || queryMaxDays),
    Boolean(queryCountry),
    Boolean(queryCategory),
    Boolean(queryDepartureMonth),
    querySort !== "newest",
  ].filter(Boolean).length;

  const clearFilters = () => applyFilter({ min_price: "", max_price: "", min_days: "", max_days: "", country: "", category: "", departure_month: "", sort: "" });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set("country", destination.trim());
    router.push(`/tours${params.size ? `?${params}` : ""}`);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-white"><div className="h-11 w-11 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600" /></div>;
  if (notFound) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white"><MapPin size={42} className="text-slate-300" /><h1 className="text-2xl font-black">Destination not found</h1><Link href="/tours" className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white">Browse all tours</Link></div>;

  const pageTitle = countryName || querySearch || "Discover Tours";
  const countLocation = countryName ? `in ${countryName}` : querySearch ? `for “${querySearch}”` : "across our destinations";

  return (
    <main className="min-h-screen bg-white pb-24 pt-24 text-slate-950">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <form onSubmit={submit} className="mt-3 grid rounded-xl border border-slate-100 bg-white p-1.5 shadow-[0_14px_40px_rgba(15,23,42,.12)] md:grid-cols-[1.15fr_1fr_1.15fr_1fr]">
          <FilterField label="Where to?" value={destination} placeholder="Select country" icon={MapPin} onChange={setDestination} />
          <FilterField label="When?" placeholder="Any month" icon={Calendar} value={queryDepartureMonth} onChange={(value) => applyFilter({ departure_month: value })} options={departureMonths().filter((option) => option.value)} />
          <FilterField label="How Many Days?" placeholder="Any duration" icon={Clock} value={queryMinDays || queryMaxDays ? `${queryMinDays}-${queryMaxDays}` : ""} onChange={(value) => { const [min, max] = value.split("-"); applyFilter({ min_days: min, max_days: max }); }} options={[{ label: "2 – 6 Days", value: "2-6" }, { label: "7 – 10 Days", value: "7-10" }, { label: "11 – 14 Days", value: "11-14" }, { label: "15+ Days", value: "15-" }]} />
          <button className="m-1 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"><Search size={16} />Search</button>
        </form>

        <div className="animate-fade-up pt-8 md:pt-10">
          <nav className="flex items-center gap-3 text-sm font-semibold"><Home size={17} className="text-blue-600" /><Link href="/">Home</Link><span>›</span><MapPin size={17} className="text-blue-600" /><Link href="/tours">Tour</Link>{countryName && <><span>›</span><MapPin size={17} className="text-blue-600" /><span>{countryName}</span></>}</nav>
          <h1 className="mt-8 text-3xl font-black">{pageTitle}</h1>
          <p className="mt-5 text-sm"><b>{total} Tours Found</b> <span className="text-slate-500">{countLocation}</span></p>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-8">
            <button
              type="button"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
              title={activeFilterCount ? "Clear all filters" : "No filters applied"}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${activeFilterCount ? "bg-blue-600 text-white hover:bg-blue-700" : "cursor-default bg-slate-100 text-slate-400"}`}
            >
              <Sliders size={14} />Filter{" "}
              <span className={`rounded-full px-1 ${activeFilterCount ? "bg-white text-blue-600" : "bg-white text-slate-400"}`}>
                {String(activeFilterCount).padStart(2, "0")}
              </span>
            </button>
            <FilterSelect label="Budget" value={`${queryMinPrice}-${queryMaxPrice}`} active={Boolean(queryMinPrice || queryMaxPrice)} options={[{ label: "Any budget", value: "-" }, { label: "Under $1,000", value: "-1000" }, { label: "$1,000 – $2,000", value: "1000-2000" }, { label: "$2,000+", value: "2000-" }]} onChange={(value) => { const [min, max] = value.split("-"); applyFilter({ min_price: min, max_price: max }); }} />
            <FilterSelect label="Duration" value={`${queryMinDays}-${queryMaxDays}`} active={Boolean(queryMinDays || queryMaxDays)} options={[{ label: "Any duration", value: "-" }, { label: "2 – 6 Days", value: "2-6" }, { label: "7 – 10 Days", value: "7-10" }, { label: "11 – 14 Days", value: "11-14" }, { label: "15+ Days", value: "15-" }]} onChange={(value) => { const [min, max] = value.split("-"); applyFilter({ min_days: min, max_days: max }); }} />
            <FilterSelect label="Destination" value={queryCountry} active={Boolean(queryCountry)} options={[{ label: "All destinations", value: "" }, ...countryOptions.map((item) => ({ label: item, value: item }))]} onChange={(value) => applyFilter({ country: value })} />
            <FilterSelect label="Tour Type" value={queryCategory} active={Boolean(queryCategory)} options={[{ label: "All tour types", value: "" }, ...categoryOptions]} onChange={(value) => applyFilter({ category: value })} />
            <FilterSelect label="Departure Month" value={queryDepartureMonth} active={Boolean(queryDepartureMonth)} options={departureMonths()} onChange={(value) => applyFilter({ departure_month: value })} />
            <FilterSelect label="Sort" value={querySort} active={querySort !== "newest"} options={[{ label: "Newest", value: "newest" }, { label: "Price: Low to high", value: "price_asc" }, { label: "Price: High to low", value: "price_desc" }, { label: "Shortest first", value: "duration_asc" }]} onChange={(value) => applyFilter({ sort: value })} />
            <div className="ml-auto flex rounded-lg bg-slate-50 p-1"><button type="button" aria-label="Grid view" onClick={() => setView("grid")} className={`flex h-8 w-8 items-center justify-center rounded ${view === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"}`}><Grid size={17} /></button><button type="button" aria-label="List view" onClick={() => setView("list")} className={`flex h-8 w-8 items-center justify-center rounded ${view === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"}`}><List size={18} /></button></div>
          </div>

          {tours.length === 0 ? <div className="py-24 text-center"><Filter size={34} className="mx-auto text-slate-300" /><h2 className="mt-5 text-xl font-black">No published tours yet</h2><Link href="/tours" className="mt-5 inline-flex rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white">Explore all tours</Link></div> : <div className={`mt-9 grid gap-8 ${view === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>{tours.map((tour) => {
            const travelItem = { id: tour.id, title: tour.title, place: tour.country_name, image: tour.banner_image ? mediaUrl(tour.banner_image) : FALLBACK, price: tour.price_start_per_person, currency: tour.currency || "USD", duration: tour.number_of_days ? `${tour.number_of_days} days` : "Flexible", href: publicTourUrl(tour) };
            return (
              <TourCard
                key={tour.id}
                tour={tour}
                format={formatCompact}
                variant="search"
                view={view}
                departures={tour.departures}
                wishlisted={isWishlisted(tour.id)}
                onWishlist={() => toggleWishlist(travelItem)}
                compared={isCompared(tour.id)}
                compareLimitReached={!isCompared(tour.id) && compareCount >= MAX_COMPARE_ITEMS}
                onCompare={() => {
                  const { limitReached } = toggleCompare(travelItem);
                  if (limitReached) toast.error(`You can compare up to ${MAX_COMPARE_ITEMS} tours at a time.`);
                }}
              />
            );
          })}</div>}
        </div>
      </div>
    </main>
  );
}

function FilterSelect({ label, value, active, options, onChange }: { label: string; value: string; active: boolean; options: { label: string; value: string }[]; onChange: (value: string) => void }) {
  return <label className={`relative flex items-center rounded-full border px-3 py-2 text-xs font-semibold transition ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600"}`}><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="cursor-pointer appearance-none bg-transparent py-0 pl-0 pr-5 text-xs font-semibold outline-none"><option value={value} disabled hidden>{options.find((option) => option.value === value)?.label || label}</option>{options.map((option) => <option key={`${label}-${option.value}`} value={option.value} className="bg-white text-slate-900">{option.label}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-2" /></label>;
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

function FilterField({ label, value = "", placeholder, icon: Icon, onChange, options }: { label: string; value?: string; placeholder: string; icon: typeof MapPin; onChange?: (value: string) => void; options?: { label: string; value: string }[] }) {
  if (options) {
    return (
      <label className="flex min-h-14 items-center gap-2 border-b border-slate-100 px-3 md:border-b-0 md:border-r">
        <Icon size={15} className="text-blue-600" />
        <span className="min-w-0 flex-1">
          <b className="block text-[9px] text-blue-600">{label}</b>
          <select aria-label={label} value={value} onChange={(event) => onChange?.(event.target.value)} className="w-full cursor-pointer appearance-none bg-transparent text-xs text-slate-500 outline-none">
            <option value="">{placeholder}</option>
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </span>
        <ChevronDown size={12} className="text-slate-300" />
      </label>
    );
  }
  return <label className="flex min-h-14 items-center gap-2 border-b border-slate-100 px-3 md:border-b-0 md:border-r"><Icon size={15} className="text-blue-600" /><span className="min-w-0 flex-1"><b className="block text-[9px] text-blue-600">{label}</b><input value={value} readOnly={!onChange} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} className="w-full bg-transparent text-xs text-slate-500 outline-none placeholder:text-slate-400" /></span><ChevronDown size={12} className="text-slate-300" /></label>;
}
