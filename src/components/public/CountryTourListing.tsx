"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LuArrowRight as ArrowRight, LuCalendarDays as Calendar, LuChevronDown as ChevronDown, LuClock3 as Clock, LuFilter as Filter, LuGrid2X2 as Grid, LuHeart as Heart, LuHouse as Home, LuList as List, LuMapPin as MapPin, LuSearch as Search, LuSlidersHorizontal as Sliders, LuUserRound as User, LuUsers as Users } from "react-icons/lu";
import { fetchPublicCategories, fetchPublicCountries, fetchPublicTours, PublicTour } from "@/lib/api/publicClient";
import { useCurrency } from "@/hooks/useCurrency";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { publicTourUrl, slugifyTourSegment } from "@/lib/utils/tourUrl";
import { useTravelStore } from "@/providers/TravelStoreProvider";

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
  const { isWishlisted, toggleWishlist } = useTravelStore();
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
        const params: Record<string, string | number> = { limit: 100 };
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
        <form onSubmit={submit} className="mt-3 grid rounded-xl border border-slate-100 bg-white p-1.5 shadow-[0_14px_40px_rgba(15,23,42,.12)] md:grid-cols-[1.1fr_1fr_1fr_1.15fr_1fr]">
          <FilterField label="Where to?" value={destination} placeholder="Select country" icon={MapPin} onChange={setDestination} />
          <FilterField label="When?" placeholder="Select date" icon={Calendar} />
          <FilterField label="How Many Days?" placeholder="Choose Duration" icon={Clock} />
          <FilterField label="Who's going?" placeholder="2 Adults, 1 child" icon={Users} />
          <button className="m-1 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"><Search size={16} />Search</button>
        </form>

        <div className="animate-fade-up pt-32 md:pt-36">
          <nav className="flex items-center gap-3 text-sm font-semibold"><Home size={17} className="text-blue-600" /><Link href="/">Home</Link><span>›</span><MapPin size={17} className="text-blue-600" /><Link href="/tours">Tour</Link>{countryName && <><span>›</span><MapPin size={17} className="text-blue-600" /><span>{countryName}</span></>}</nav>
          <h1 className="mt-8 text-3xl font-black">{pageTitle}</h1>
          <p className="mt-5 text-sm"><b>{total} Tours Found</b> <span className="text-slate-500">{countLocation}</span></p>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-8">
            <button type="button" className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white"><Sliders size={14} />Filter <span className="rounded-full bg-white px-1 text-blue-600">01</span></button>
            <FilterSelect label="Budget" value={`${queryMinPrice}-${queryMaxPrice}`} active={Boolean(queryMinPrice || queryMaxPrice)} options={[{ label: "Any budget", value: "-" }, { label: "Under $1,000", value: "-1000" }, { label: "$1,000 – $2,000", value: "1000-2000" }, { label: "$2,000+", value: "2000-" }]} onChange={(value) => { const [min, max] = value.split("-"); applyFilter({ min_price: min, max_price: max }); }} />
            <FilterSelect label="Duration" value={`${queryMinDays}-${queryMaxDays}`} active={Boolean(queryMinDays || queryMaxDays)} options={[{ label: "Any duration", value: "-" }, { label: "2 – 6 Days", value: "2-6" }, { label: "7 – 10 Days", value: "7-10" }, { label: "11 – 14 Days", value: "11-14" }, { label: "15+ Days", value: "15-" }]} onChange={(value) => { const [min, max] = value.split("-"); applyFilter({ min_days: min, max_days: max }); }} />
            <FilterSelect label="Destination" value={queryCountry} active={Boolean(queryCountry)} options={[{ label: "All destinations", value: "" }, ...countryOptions.map((item) => ({ label: item, value: item }))]} onChange={(value) => applyFilter({ country: value })} />
            <FilterSelect label="Tour Type" value={queryCategory} active={Boolean(queryCategory)} options={[{ label: "All tour types", value: "" }, ...categoryOptions]} onChange={(value) => applyFilter({ category: value })} />
            <FilterSelect label="Departure Month" value={queryDepartureMonth} active={Boolean(queryDepartureMonth)} options={departureMonths()} onChange={(value) => applyFilter({ departure_month: value })} />
            <FilterSelect label="Sort" value={querySort} active={querySort !== "newest"} options={[{ label: "Newest", value: "newest" }, { label: "Price: Low to high", value: "price_asc" }, { label: "Price: High to low", value: "price_desc" }, { label: "Shortest first", value: "duration_asc" }]} onChange={(value) => applyFilter({ sort: value })} />
            <div className="ml-auto flex rounded-lg bg-slate-50 p-1"><button type="button" aria-label="Grid view" onClick={() => setView("grid")} className={`flex h-8 w-8 items-center justify-center rounded ${view === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"}`}><Grid size={17} /></button><button type="button" aria-label="List view" onClick={() => setView("list")} className={`flex h-8 w-8 items-center justify-center rounded ${view === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"}`}><List size={18} /></button></div>
          </div>

          {tours.length === 0 ? <div className="py-24 text-center"><Filter size={34} className="mx-auto text-slate-300" /><h2 className="mt-5 text-xl font-black">No published tours yet</h2><Link href="/tours" className="mt-5 inline-flex rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white">Explore all tours</Link></div> : <div className={`mt-9 grid gap-8 ${view === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>{tours.map((tour) => <TourResultCard key={tour.id} tour={tour} view={view} formatCompact={formatCompact} saved={isWishlisted(tour.id)} onWishlist={() => toggleWishlist({ id: tour.id, title: tour.title, place: tour.country_name, image: tour.banner_image ? mediaUrl(tour.banner_image) : FALLBACK, price: tour.price_start_per_person, currency: tour.currency || "USD", duration: tour.number_of_days ? `${tour.number_of_days} days` : "Flexible", href: publicTourUrl(tour) })} />)}</div>}
        </div>
      </div>
    </main>
  );
}

function TourResultCard({ tour, view, formatCompact, saved, onWishlist }: { tour: PublicTour; view: "grid" | "list"; formatCompact: (amount: number | string | null | undefined, currency?: string) => string; saved: boolean; onWishlist: () => void }) {
  const image = tour.banner_image ? mediaUrl(tour.banner_image) : FALLBACK;
  const base = Number(tour.price_start_per_person || 0);
  const days = tour.number_of_days || 6;
  const departures = tour.departures?.slice(0, 3) || [];
  return (
    <article className={`group relative rounded-xl border border-slate-100 bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,.09)] transition hover:-translate-y-1 hover:shadow-xl ${view === "list" ? "grid sm:grid-cols-[340px_1fr]" : ""}`}>
      <button type="button" onClick={onWishlist} className={`absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full ${saved ? "bg-red-500 text-white" : "bg-white/90 text-red-500"}`}><Heart size={17} className={saved ? "fill-current" : ""} /></button>
      <Link href={publicTourUrl(tour)} className="contents">
        <div className="relative h-48 overflow-hidden rounded-lg"><img src={image} alt={tour.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded-full bg-sky-400/80 px-3 py-1 text-[9px] font-bold text-white"><MapPin size={9} className="mr-1 inline" />{tour.country_name}</span></div>
        <div className="p-1 pt-4">
          <div className="flex items-center justify-between gap-3"><h2 className="truncate text-base font-black">{tour.title}</h2><span className="shrink-0 rounded border border-blue-300 px-1 text-[8px] font-bold text-blue-600">{days}D | {Math.max(1, days - 1)}N</span></div>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] text-slate-600"><span><Calendar size={10} className="mr-1 inline text-blue-500" />{days} Days</span><span><User size={10} className="mr-1 inline text-blue-500" />Minimum age: 18</span><span><MapPin size={10} className="mr-1 inline text-blue-500" />{tour.city_name || tour.country_name} to destination</span><span><User size={10} className="mr-1 inline text-blue-500" />Maximum age: 65</span><span><Users size={10} className="mr-1 inline text-blue-500" />Full Guided</span><span><MapPin size={10} className="mr-1 inline text-blue-500" />{tour.city_name || tour.country_name}</span><span><Users size={10} className="mr-1 inline text-blue-500" />Max Group Size: 24</span><span className="font-bold text-blue-600">+4 More</span></div>
          <div className="mt-5 grid grid-cols-4 gap-2">{departures.length ? departures.map((departure) => <span key={departure.id} className="rounded border border-slate-200 p-2 text-[9px]"><small>{shortDate(departure.date)}</small><b className="block text-xs">{base ? formatCompact(base, tour.currency || "USD") : "Request"}</b></span>) : <span className="col-span-3 rounded border border-slate-200 p-2 text-[9px] text-slate-500"><small>Dates on request</small><b className="block text-xs">Contact us</b></span>}<span className="flex items-center justify-center rounded border border-slate-200 text-xs font-black">+More</span></div>
          <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4"><span className="text-sm font-bold">From <small className="text-slate-300 line-through">$1,575</small> <b className="text-xl">{base ? formatCompact(base, tour.currency || "USD") : "On request"}</b><small>pp</small></span><span className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-xs font-bold text-white">View tour <ArrowRight size={14} /></span></div>
        </div>
      </Link>
    </article>
  );
}

function shortDate(value: string) { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "2-digit" }).format(date); }

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

function FilterField({ label, value = "", placeholder, icon: Icon, onChange }: { label: string; value?: string; placeholder: string; icon: typeof MapPin; onChange?: (value: string) => void }) {
  return <label className="flex min-h-14 items-center gap-2 border-b border-slate-100 px-3 md:border-b-0 md:border-r"><Icon size={15} className="text-blue-600" /><span className="min-w-0 flex-1"><b className="block text-[9px] text-blue-600">{label}</b><input value={value} readOnly={!onChange} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} className="w-full bg-transparent text-xs text-slate-500 outline-none placeholder:text-slate-400" /></span><ChevronDown size={12} className="text-slate-300" /></label>;
}
