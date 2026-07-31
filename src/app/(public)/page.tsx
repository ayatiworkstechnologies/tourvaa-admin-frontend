"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuArrowLeft as ArrowLeft,
  LuArrowRight as ArrowRight,
  LuBadgeCheck as BadgeCheck,
  LuCalendarDays as Calendar,
  LuClock3 as Clock,
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuHeadset as Headset,
  LuHeart as Heart,
  LuMapPin as MapPin,
  LuMinus as Minus,
  LuPlus as Plus,
  LuQuote as Quote,
  LuScale as Scale,
  LuSearch as Search,
  LuShieldCheck as ShieldCheck,
  LuStar as Star,
  LuUsers as Users,
} from "react-icons/lu";
import { useToast } from "@/hooks/useToast";
import {
  CmsBanner,
  CmsDestination,
  CmsReview,
  fetchCustomerReviews,
  fetchFeaturedTours,
  fetchHomepageBanners,
  fetchPopularDestinations,
  fetchPublicCategories,
  fetchPublicCountries,
  fetchPublicTours,
  PublicCategory,
  PublicTour,
} from "@/lib/api/publicClient";
import { MAX_COMPARE_ITEMS, useTravelStore } from "@/providers/TravelStoreProvider";
import { publicTourUrl } from "@/lib/utils/tourUrl";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useCurrency } from "@/hooks/useCurrency";

type Tour = {
  id?: number;
  title: string;
  place: string;
  image: string;
  days: string;
  reviews: string;
  features: string[];
  rawPrice?: number | null;
  currency?: string;
  slug?: string;
};

const PLACEHOLDER_IMAGE = "/images/tour-card-fallback.jpg";

function stableHash(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 33) ^ value.charCodeAt(i);
  return hash >>> 0;
}

function mapPublicTour(tour: PublicTour): Tour {
  return {
    id: tour.id,
    title: tour.title,
    place: tour.country_name || tour.city_name || "Worldwide",
    image: tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER_IMAGE,
    days: tour.number_of_days ? `${tour.number_of_days}D | ${Math.max(0, tour.number_of_days - 1)}N` : tour.number_of_hours ? `${tour.number_of_hours} Hours` : "Flexible",
    reviews: "Verified",
    features: [tour.city_name || tour.country_name || "Curated itinerary", tour.category_name || "Guided experience", tour.short_description || "Flexible booking available"],
    rawPrice: tour.price_start_per_person,
    currency: tour.currency || "USD",
    slug: tour.slug,
  };
}

function mapDestination(item: CmsDestination, tourCounts: Map<string, number>) {
  const matchedCount = tourCounts.get(item.title.trim().toLowerCase());
  const count = matchedCount != null ? `${matchedCount} package${matchedCount === 1 ? "" : "s"}` : item.description || "Explore packages";
  return { name: item.title, count, rating: "4.9", image: item.image || PLACEHOLDER_IMAGE, price: null as number | null, currency: "USD" };
}

function mapReview(item: CmsReview) {
  const initials = item.reviewer_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return { quote: item.review_text, name: item.reviewer_name, city: item.country || "Verified traveller", tourName: item.tour_name || "", initials, rating: Math.max(1, Math.min(5, item.rating || 5)) };
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && node.classList.add("is-visible"), { threshold: 0.08 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`reveal-block ${className}`}>{children}</div>;
}

const MONTH_CODES: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };

function travelDateToMonth(value: string): string {
  const match = value.match(/([A-Za-z]{3})[a-z]*\s+(\d{4})/);
  if (!match) return "";
  const code = MONTH_CODES[match[1] as keyof typeof MONTH_CODES];
  return code ? `${match[2]}-${code}` : "";
}

function durationToRange(value: string): { min?: string; max?: string } {
  switch (value) {
    case "Day Tours": return { max: "1" };
    case "2 - 6 Days": return { min: "2", max: "6" };
    case "7 - 10 Days": return { min: "7", max: "10" };
    case "11 - 14 Days": return { min: "11", max: "14" };
    case "15+ Days": return { min: "15" };
    default: return {};
  }
}

function HomeSearch() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<"destination" | "date" | "duration" | "passengers" | null>(null);
  const [destination, setDestination] = useState("India");
  const [travelDate, setTravelDate] = useState("Anytime");
  const [duration, setDuration] = useState("Any Duration");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(1);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(null);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams({ country: destination });
    const departureMonth = travelDateToMonth(travelDate);
    if (departureMonth) params.set("departure_month", departureMonth);
    const { min, max } = durationToRange(duration);
    if (min) params.set("min_days", min);
    if (max) params.set("max_days", max);
    router.push(`/tours?${params.toString()}`);
    setOpen(null);
  };

  const fieldClass = (name: typeof open) => `hero-filter-field flex min-h-14 w-full items-center gap-3 px-4 text-left transition hover:bg-blue-50/70 ${open === name ? "is-active bg-blue-50" : "bg-white"}`;

  return (
    <div ref={wrapperRef} className="hero-filter-enter relative z-40 mx-auto w-full max-w-[1060px] text-slate-900">
      <form onSubmit={submit} className="hero-filter-bar grid overflow-visible rounded-xl border-4 border-white/90 bg-white shadow-[0_15px_45px_rgba(15,23,42,.28)] md:grid-cols-[1.15fr_1fr_1fr_1.15fr_1.05fr]">
        <div className="relative border-b border-slate-200 md:border-b-0 md:border-r">
          <button type="button" onClick={() => setOpen(open === "destination" ? null : "destination")} className={fieldClass("destination")} aria-expanded={open === "destination"}>
            <MapPin size={17} className="shrink-0 text-blue-600" /><span className="min-w-0 flex-1"><b className="block text-[10px] text-blue-600">Destination</b><span className="block truncate text-xs text-slate-500">{destination}</span></span><ChevronDown size={12} className="text-slate-300" />
          </button>
          {open === "destination" && <DestinationPanel selected={destination} onSelect={(value) => { setDestination(value); setOpen(null); }} />}
        </div>

        <div className="relative border-b border-slate-200 md:border-b-0 md:border-r">
          <button type="button" onClick={() => setOpen(open === "date" ? null : "date")} className={fieldClass("date")} aria-expanded={open === "date"}>
            <Calendar size={17} className="shrink-0 text-blue-600" /><span className="min-w-0 flex-1"><b className="block text-[10px] text-blue-600">Travel date</b><span className="block truncate text-xs text-slate-500">{travelDate}</span></span><ChevronDown size={12} className="text-slate-300" />
          </button>
          {open === "date" && <DatePanel selected={travelDate} onApply={(value) => { setTravelDate(value); setOpen(null); }} />}
        </div>

        <div className="relative border-b border-slate-200 md:border-b-0 md:border-r">
          <button type="button" onClick={() => setOpen(open === "duration" ? null : "duration")} className={fieldClass("duration")} aria-expanded={open === "duration"}>
            <Clock size={17} className="shrink-0 text-blue-600" /><span className="min-w-0 flex-1"><b className="block text-[10px] text-blue-600">Duration</b><span className="block truncate text-xs text-slate-500">{duration}</span></span><ChevronDown size={12} className="text-slate-300" />
          </button>
          {open === "duration" && <DurationPanel selected={duration} onSelect={setDuration} />}
        </div>

        <div className="relative border-b border-slate-200 md:border-b-0 md:border-r">
          <button type="button" onClick={() => setOpen(open === "passengers" ? null : "passengers")} className={fieldClass("passengers")} aria-expanded={open === "passengers"}>
            <Users size={17} className="shrink-0 text-blue-600" /><span className="min-w-0 flex-1"><b className="block text-[10px] text-blue-600">Passengers</b><span className="block truncate text-xs text-slate-500">{adults} Adult{adults !== 1 ? "s" : ""}, {children} Child{children !== 1 ? "ren" : ""}</span></span><ChevronDown size={12} className="text-slate-300" />
          </button>
          {open === "passengers" && <PassengerPanel adults={adults} childCount={children} setAdults={setAdults} setChildren={setChildren} onApply={() => setOpen(null)} />}
        </div>

        <button className="hero-search-button relative m-1.5 flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-lg bg-[#1478f2] px-8 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"><Search size={17} /> <span>Search</span></button>
      </form>
    </div>
  );
}

const panelClass = "hero-filter-panel absolute left-0 top-[calc(100%+10px)] z-50 w-full min-w-64 rounded-xl border border-slate-200 bg-white p-2 text-left shadow-[0_18px_45px_rgba(15,23,42,.28)] md:left-0";

function DestinationPanel({ selected, onSelect }: { selected: string; onSelect: (value: string) => void }) {
  const countries = [["🇮🇳", "India"], ["🇬🇧", "United Kingdom"], ["🇦🇪", "UAE"], ["🇹🇷", "Türkiye"]];
  return <div className={panelClass}><p className="rounded-md bg-slate-50 px-3 py-2 text-center text-[10px] font-semibold text-blue-600">Other popular destinations</p><div className="mt-2 space-y-1">{countries.map(([flag, name]) => <button key={name} type="button" onClick={() => onSelect(name)} className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-[11px] font-semibold transition ${selected === name ? "border-blue-400 bg-blue-50" : "border-transparent hover:bg-slate-50"}`}><span className="text-base">{flag}</span>{name}</button>)}</div></div>;
}

function monthMeta(monthsAhead: number) {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth() + monthsAhead, 1);
  return {
    label: new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(first),
    shortMonth: new Intl.DateTimeFormat("en", { month: "short" }).format(first),
    year: first.getFullYear(),
    start: first.getDay(),
    days: new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(),
  };
}

function DatePanel({ selected, onApply }: { selected: string; onApply: (value: string) => void }) {
  const [mode, setMode] = useState<"flexible" | "specific">("flexible");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(new Intl.DateTimeFormat("en", { month: "short" }).format(now));
  const [anytime, setAnytime] = useState(false);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className={`${panelClass} min-w-[min(92vw,620px)] p-3 md:-left-36`}>
      <div className="mb-3 grid grid-cols-2 rounded-md bg-slate-50 p-1 text-[10px] font-semibold">
        <button type="button" onClick={() => setMode("flexible")} className={`rounded py-2 transition ${mode === "flexible" ? "bg-white text-blue-600 shadow-sm" : "hover:text-blue-600"}`}>Flexible Dates</button>
        <button type="button" onClick={() => setMode("specific")} className={`rounded py-2 transition ${mode === "specific" ? "bg-white text-blue-600 shadow-sm" : "hover:text-blue-600"}`}>Specific Date</button>
      </div>

      {mode === "flexible" ? (
        <div key="flexible" className="date-panel-content grid gap-4 sm:grid-cols-2">
          <CalendarMonth {...monthMeta(0)} selected={selected} onSelect={onApply} />
          <CalendarMonth {...monthMeta(1)} selected={selected} onSelect={onApply} />
        </div>
      ) : (
        <div key="specific" className="date-panel-content">
          <div className="mb-3 flex items-center justify-between">
            <div><p className="text-[11px] font-bold">When do you want to go?</p><p className="text-[8px] text-slate-400">Choose a month or stay flexible</p></div>
            <div className="flex items-center rounded border border-slate-200"><button type="button" aria-label="Previous year" onClick={() => setYear((value) => value - 1)} className="flex h-7 w-8 items-center justify-center hover:bg-slate-50">‹</button><span className="border-x border-slate-200 px-2 text-[10px] font-bold">{year}</span><button type="button" aria-label="Next year" onClick={() => setYear((value) => value + 1)} className="flex h-7 w-8 items-center justify-center hover:bg-slate-50">›</button></div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {months.map((item) => <button key={item} type="button" onClick={() => { setMonth(item); setAnytime(false); }} className={`rounded-md border py-2 text-center transition ${!anytime && month === item ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-blue-300"}`}><b className="block text-[9px]">{item}</b><span className="text-[7px] text-slate-400">{year}</span></button>)}
          </div>
          <p className="mt-4 text-[11px] font-bold">I’m flexible</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setAnytime(true)} className={`rounded-md border px-8 py-2 text-[10px] font-semibold transition ${anytime ? "border-blue-500 bg-blue-50 text-blue-700" : "border-blue-300 hover:bg-blue-50"}`}>Anytime</button>
            <button type="button" onClick={() => onApply(anytime ? "Anytime" : `${month} ${year}`)} className="rounded-md bg-blue-600 px-8 py-2 text-[10px] font-bold text-white shadow-md transition hover:bg-blue-700">Select date</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarMonth({ label, shortMonth, year, start, days, selected, onSelect }: { label: string; shortMonth: string; year: number; start: number; days: number; selected: string; onSelect: (value: string) => void }) {
  return <div><div className="mb-3 flex items-center justify-between"><b className="text-xs">{label}</b><span className="flex gap-1"><button type="button" className="h-6 w-6 rounded transition hover:-translate-x-0.5 hover:bg-slate-100">‹</button><button type="button" className="h-6 w-6 rounded transition hover:translate-x-0.5 hover:bg-slate-100">›</button></span></div><div className="grid grid-cols-7 text-center text-[9px] text-slate-400">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day} className="py-1">{day}</span>)}</div><div className="calendar-days grid grid-cols-7 gap-1 text-center text-[10px] font-semibold">{Array.from({ length: start }).map((_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: days }).map((_, i) => { const value = `${String(i + 1).padStart(2, "0")} ${shortMonth} ${year}`; const active = selected === value; return <button type="button" key={value} onClick={() => onSelect(value)} className={`aspect-square rounded transition hover:bg-blue-100 hover:text-blue-700 ${active ? "is-selected bg-blue-600 text-white" : "text-slate-700"}`}>{String(i + 1).padStart(2, "0")}</button>; })}</div></div>;
}

function DurationPanel({ selected, onSelect }: { selected: string; onSelect: (value: string) => void }) {
  const options = ["Day Tours", "2 - 6 Days", "7 - 10 Days", "11 - 14 Days", "15+ Days", "Any Duration"];
  return <div className={`${panelClass} min-w-72`}><p className="rounded-md bg-slate-50 px-3 py-2 text-center text-[10px] font-semibold text-blue-600">Duration</p><div className="mt-2 grid grid-cols-2 gap-1">{options.map((option) => <button type="button" key={option} onClick={() => onSelect(option)} className={`flex items-center gap-2 rounded px-2 py-2.5 text-[10px] font-semibold transition ${selected === option ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"}`}><Calendar size={12} className="text-sky-500" />{option}</button>)}</div><p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-center text-[10px] font-semibold text-blue-600">Custom Range</p><div className="px-2 py-3"><div className="flex justify-between text-[9px] font-semibold"><span>7 Days</span><span>10 Days</span></div><input aria-label="Custom duration" type="range" min="1" max="30" defaultValue="10" className="mt-2 w-full accent-blue-600" /></div></div>;
}

function PassengerPanel({ adults, childCount, setAdults, setChildren, onApply }: { adults: number; childCount: number; setAdults: (value: number) => void; setChildren: (value: number) => void; onApply: () => void }) {
  return <div className={`${panelClass} right-0 left-auto min-w-64`}><p className="rounded-md bg-slate-50 px-3 py-2 text-center text-[10px] font-semibold text-blue-600">Passengers</p><div className="space-y-4 px-2 py-4"><Counter label="Adult" value={adults} min={1} onChange={setAdults} /><Counter label="Children" note="0 - 17 Years Old" value={childCount} min={0} onChange={setChildren} /></div><button type="button" onClick={onApply} className="w-full rounded-md bg-blue-600 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700">Apply</button></div>;
}

function Counter({ label, note, value, min, onChange }: { label: string; note?: string; value: number; min: number; onChange: (value: number) => void }) {
  return <div className="flex items-center justify-between"><span><b className="block text-[11px]">{label}</b>{note && <small className="text-[8px] text-slate-400">{note}</small>}</span><div className="flex items-center gap-2"><button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(min, value - 1))} className="counter-motion flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100"><Minus size={11} /></button><b key={value} className="counter-value w-4 text-center text-[11px]">{String(value).padStart(2, "0")}</b><button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(Math.min(20, value + 1))} className="counter-motion flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100"><Plus size={11} /></button></div></div>;
}

function TrustBadge({ icon: Icon, title, note }: { icon: React.ElementType; title: string; note: string }) {
  return (
    <span className="flex items-center gap-2">
      <Icon size={16} className="shrink-0 text-blue-300" />
      <span className="text-left leading-tight">
        <b className="block">{title}</b>
        <span className="block text-white/70">{note}</span>
      </span>
    </span>
  );
}

function Stars({ reviews: count }: { reviews?: string }) {
  return <div className="mt-1 flex items-center gap-1 text-[10px]"><span className="flex text-amber-400">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className="fill-current" />)}</span><b className="text-slate-700">4.8</b>{count && <span className="text-slate-400">{count} reviews</span>}</div>;
}

function TourCard({ tour, discount }: { tour: Tour; discount?: boolean }) {
  const { isWishlisted, toggleWishlist, isCompared, toggleCompare } = useTravelStore();
  const { format } = useCurrency();
  const toast = useToast();
  const itemId = tour.id ?? stableHash(tour.slug || tour.title);
  const wishlisted = isWishlisted(itemId);
  const compared = tour.id != null && isCompared(tour.id);
  const href = tour.id ? publicTourUrl(tour) : `/tours?search=${encodeURIComponent(tour.title)}`;
  const travelItem = { id: itemId, title: tour.title, place: tour.place, image: tour.image, price: tour.rawPrice ?? null, currency: tour.currency || "USD", duration: tour.days, href };
  const onToggleCompare = () => {
    if (tour.id == null) return;
    const { limitReached } = toggleCompare(travelItem);
    if (limitReached) toast.error(`You can compare up to ${MAX_COMPARE_ITEMS} tours at a time.`);
  };
  return (
    <article className="group relative w-[275px] shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,.07)] transition duration-500 hover:-translate-y-2 hover:shadow-xl sm:w-[310px] lg:w-[calc((100vw-7rem)/4)] xl:w-[306px]">
      <div className="absolute right-5 top-5 z-20 flex flex-col gap-2">
        <button type="button" onClick={() => toggleWishlist(travelItem)} aria-label={wishlisted ? `Remove ${tour.title} from wishlist` : `Add ${tour.title} to wishlist`} className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition hover:scale-110 ${wishlisted ? "bg-red-500 text-white" : "bg-black/15 text-white hover:bg-white hover:text-red-500"}`}><Heart size={17} className={wishlisted ? "fill-current" : ""} /></button>
        {tour.id != null && (
          <button type="button" onClick={onToggleCompare} aria-label={compared ? `Remove ${tour.title} from comparison` : `Add ${tour.title} to comparison`} className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition hover:scale-110 ${compared ? "bg-blue-600 text-white" : "bg-black/15 text-white hover:bg-white hover:text-blue-600"}`}><Scale size={16} /></button>
        )}
      </div>
      <Link href={href} aria-label={`View ${tour.title}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <div className="relative h-44 overflow-hidden rounded-lg">
          <img src={tour.image} alt={tour.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
          <span className="absolute left-2 top-2 rounded-full bg-sky-400/80 px-2 py-1 text-[9px] font-semibold text-white">⌾ {tour.place}</span>
          {discount && <span className="absolute bottom-0 right-0 rounded-tl-md bg-[#1478f2] px-2.5 py-1.5 text-[10px] font-bold text-white">Save 25%</span>}
        </div>
        <div className="pt-3">
          <div className="flex items-start justify-between gap-2"><h3 className="truncate text-sm font-bold text-slate-900 transition group-hover:text-blue-600">{tour.title}</h3><span className="shrink-0 rounded border border-blue-300 px-1 text-[8px] font-bold text-blue-600">{tour.days}</span></div>
          <Stars reviews={tour.reviews} />
          <div className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-[9px] text-slate-500">{tour.features.map((feature) => <p key={feature} className="flex items-center gap-1.5"><Check size={10} className="text-blue-500" />{feature}</p>)}</div>
          <div className="mt-3 flex items-end gap-2 border-t border-slate-100 pt-2 text-xs"><b>From</b><strong className="text-lg text-slate-950">{tour.rawPrice != null ? format(tour.rawPrice, tour.currency || "USD") : "Price on request"}</strong><span className="text-[8px] text-slate-400">pp</span></div>
        </div>
      </Link>
      <span className="mt-3 block w-full rounded-lg bg-[#1478f2] py-2.5 text-center text-xs font-bold text-white transition group-hover:bg-blue-700">View Tour</span>
    </article>
  );
}

function TourCardSkeleton() {
  return (
    <div className="w-[275px] shrink-0 animate-pulse overflow-hidden rounded-xl border border-slate-100 bg-white p-3 sm:w-[310px] lg:w-[calc((100vw-7rem)/4)] xl:w-[306px]">
      <div className="h-44 rounded-lg bg-slate-100" />
      <div className="pt-3">
        <div className="h-4 w-3/4 rounded-full bg-slate-100" />
        <div className="mt-3 h-3 w-1/2 rounded-full bg-slate-100" />
        <div className="mt-4 h-8 w-2/3 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function CarouselSection({ title, tours, discount, loading }: { title: string; tours: Tour[]; discount?: boolean; loading?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => ref.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  if (!loading && tours.length === 0) return null;
  return (
    <section className="py-10">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-950 sm:text-2xl">{title}</h2><div className="flex gap-2"><button aria-label="Previous tours" onClick={() => move(-1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white transition hover:border-blue-500 hover:text-blue-600"><ArrowLeft size={15} /></button><button aria-label="Next tours" onClick={() => move(1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white transition hover:border-blue-500 hover:text-blue-600"><ArrowRight size={15} /></button></div></div>
      <div ref={ref} className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-5">
        {loading
          ? Array.from({ length: 5 }).map((_, index) => <div className="snap-start" key={index}><TourCardSkeleton /></div>)
          : tours.map((tour, index) => <div className="snap-start" key={`${tour.title}-${index}`}><TourCard tour={tour} discount={discount} /></div>)}
      </div>
    </section>
  );
}

export default function Home() {
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [loadingHome, setLoadingHome] = useState(true);
  const [trendingTours, setTrendingTours] = useState<Tour[]>([]);
  const [handpickedTours, setHandpickedTours] = useState<Tour[]>([]);
  const [dynamicPlaces, setDynamicPlaces] = useState<{ name: string; count: string; rating: string; image: string; price: number | null; currency: string }[]>([]);
  const [dynamicReviews, setDynamicReviews] = useState<{ quote: string; name: string; city: string; tourName: string; initials: string; rating: number }[]>([]);
  const [styleCategories, setStyleCategories] = useState<PublicCategory[]>([]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([fetchHomepageBanners(), fetchFeaturedTours(10), fetchPopularDestinations(), fetchCustomerReviews(), fetchPublicCountries(), fetchPublicCategories()]).then(([bannerResult, tourResult, destinationResult, reviewResult, countryResult, categoryResult]) => {
      if (!active) return;
      if (bannerResult.status === "fulfilled" && bannerResult.value.length) setBanners(bannerResult.value);
      if (tourResult.status === "fulfilled" && tourResult.value.length) {
        const mapped = tourResult.value.map(mapPublicTour);
        setTrendingTours(mapped.slice(0, 5));
        setHandpickedTours((mapped.length > 5 ? mapped.slice(5, 10) : mapped).slice(0, 5));
      }
      if (destinationResult.status === "fulfilled" && destinationResult.value.length) {
        const tourCounts = new Map<string, number>();
        if (countryResult.status === "fulfilled") {
          countryResult.value.forEach((country) => tourCounts.set(country.country_name.trim().toLowerCase(), country.tour_count || 0));
        }
        const places = destinationResult.value.slice(0, 5).map((item) => mapDestination(item, tourCounts));
        setDynamicPlaces(places);
        Promise.allSettled(places.map((place) => fetchPublicTours({ country: place.name, sort: "price_asc", limit: 1, available_only: true }))).then((priceResults) => {
          if (!active) return;
          setDynamicPlaces((current) => current.map((place, index) => {
            const result = priceResults[index];
            if (result.status !== "fulfilled" || !result.value.items.length) return place;
            const cheapest = result.value.items[0];
            return { ...place, price: cheapest.price_start_per_person, currency: cheapest.currency || "USD" };
          }));
        });
      }
      if (reviewResult.status === "fulfilled" && reviewResult.value.length) setDynamicReviews(reviewResult.value.slice(0, 6).map(mapReview));
      if (categoryResult.status === "fulfilled") setStyleCategories(categoryResult.value);
      setLoadingHome(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setBannerIndex((index) => (index + 1) % banners.length), 7000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  const banner = banners[bannerIndex];
  const heroImage = banner?.image || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2200&q=90";
  const heroTitle = banner?.title || "Endless destinations. One easy search.";

  return (
    <main className="overflow-x-clip bg-white text-slate-950">
      <section className="relative z-30 flex min-h-screen items-center justify-center overflow-visible pt-20 text-center text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img key={heroImage} src={heroImage} alt={banner?.title || "Dramatic green mountain landscape"} className="animate-hero-img h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-900/25 to-slate-950/60" />
        </div>
        <div className="relative z-10 w-full px-4">
          <span className="animate-fade-up mx-auto inline-flex items-center gap-1.5 rounded-full bg-white/15 px-5 py-2 text-xs font-semibold text-white backdrop-blur">◔ Discover the world with confidence</span>
          <h1 key={heroTitle} className="animate-fade-up mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{heroTitle}</h1>
          {banner?.subtitle && <p className="animate-fade-up delay-100 mx-auto mt-4 max-w-xl text-base text-white/85">{banner.subtitle}</p>}
          <div className="animate-fade-up delay-200 mt-12"><HomeSearch /></div>
          <div className="animate-fade-up delay-400 relative z-0 mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-medium text-white/90">
            <TrustBadge icon={Star} title="4.8/5 Traveller Rating" note="from 20,000+ reviews" />
            <TrustBadge icon={ShieldCheck} title="Secure Payments" note="100% secure & protected" />
            <TrustBadge icon={BadgeCheck} title="Verified Tour Partners" note="Handpicked experts" />
            <TrustBadge icon={Headset} title="24/7 Travel Assistance" note="We're here for you" />
          </div>
        </div>
        <span className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 animate-bounce text-white/70 sm:block">
          <ChevronDown size={22} />
        </span>
      </section>

      <div className="relative z-10 mx-auto max-w-[1380px] px-5 sm:px-8 lg:px-12">
        <Reveal><CarouselSection title="Trending Tour Packages" tours={trendingTours} discount loading={loadingHome} /></Reveal>

        <Reveal><WhyTourvaa /></Reveal>

        <Reveal><PlacesCarousel places={dynamicPlaces} loading={loadingHome} /></Reveal>

        <Reveal><TravelStylesSection categories={styleCategories} loading={loadingHome} /></Reveal>

        <Reveal><CarouselSection title="Handpicked Tours for You" tours={handpickedTours} loading={loadingHome} /></Reveal>

        <Reveal className="py-12 lg:px-16">
          <section className="grid overflow-hidden rounded-2xl bg-[#0f3f8f] md:grid-cols-2">
            <div className="order-2 flex flex-col items-start justify-center px-8 py-12 text-left md:order-1">
              <h2 className="max-w-lg text-3xl font-bold leading-tight text-white sm:text-4xl">Stories that inspire your next journey</h2>
              <p className="mt-5 max-w-sm text-xs leading-relaxed text-blue-100">Explore destination guides, practical travel tips and first-hand stories created to help you travel better.</p>
              <Link href="/blogs" className="mt-7 rounded-lg bg-white px-8 py-3 text-sm font-bold text-[#0f3f8f] shadow-lg transition hover:-translate-y-1 hover:bg-blue-50">Explore Travel Stories</Link>
            </div>
            <img src="https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=85" alt="Traveller sitting on a cliff edge watching hot air balloons" className="order-1 h-72 w-full object-cover sm:h-96 md:order-2" />
          </section>
        </Reveal>

        <Reveal><Testimonials reviews={dynamicReviews} loading={loadingHome} /></Reveal>
      </div>
    </main>
  );
}

function WhyTourvaa() {
  const items = [
    { icon: ShieldCheck, color: "bg-blue-100 text-blue-600", title: "Verified Experiences", note: "Every tour is carefully reviewed and quality-checked before being published." },
    { icon: BadgeCheck, color: "bg-emerald-100 text-emerald-600", title: "Transparent Pricing", note: "Clear package pricing with no hidden charges or unexpected costs." },
    { icon: Headset, color: "bg-violet-100 text-violet-600", title: "Flexible Support", note: "Get assistance before, during and after your trip from our travel experts." },
    { icon: Users, color: "bg-orange-100 text-orange-600", title: "Trusted Local Partners", note: "Travel with verified destination specialists and reliable local partners." },
  ];
  return (
    <section className="rounded-2xl bg-slate-50 py-10 sm:px-10">
      <h2 className="text-center text-xl font-bold sm:text-2xl">Why travel with Tourvaa?</h2>
      <div className="mt-8 grid gap-6 px-5 sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
        {items.map(({ icon: Icon, color, title, note }) => (
          <div key={title} className="text-center">
            <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${color}`}><Icon size={22} /></span>
            <h3 className="mt-4 text-sm font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlacesCarousel({ places: items, loading }: { places: { name: string; count: string; rating: string; image: string; price: number | null; currency: string }[]; loading?: boolean }) {
  const { format } = useCurrency();
  if (!loading && items.length === 0) return null;
  return (
    <section className="py-10">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold sm:text-2xl">Explore Popular Destinations</h2><Link href="/destinations" className="text-xs font-bold text-blue-600 hover:underline">View all destinations →</Link></div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-xl bg-slate-100" />)
          : items.map((place) => (
              <Link href={`/tours?country=${place.name}`} key={place.name} className="group relative h-44 overflow-hidden rounded-xl">
                <img src={place.image} alt={place.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <h3 className="text-sm font-bold">{place.name}</h3>
                  {place.price != null && <p className="text-[10px] font-semibold text-white/90">From {format(place.price, place.currency)}</p>}
                  <p className="text-[9px] text-white/70">{place.count}</p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}

const styleIcons: Record<string, React.ElementType> = {
  adventure: MapPin,
  family: Users,
  honeymoon: Heart,
  wildlife: ShieldCheck,
  cultural: BadgeCheck,
};

function TravelStylesSection({ categories, loading: parentLoading }: { categories: PublicCategory[]; loading?: boolean }) {
  const [active, setActive] = useState<PublicCategory | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categories.length && !active) setActive(categories[0]);
  }, [categories, active]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);
    fetchPublicTours({ category: active.slug, sort: "newest", limit: 4, available_only: true })
      .then((result) => { if (!cancelled) setTours(result.items.map(mapPublicTour)); })
      .catch(() => { if (!cancelled) setTours([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [active]);

  if (!parentLoading && categories.length === 0) return null;

  return (
    <section className="py-10">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold sm:text-2xl">Tours Travellers Love</h2><Link href="/tours" className="text-xs font-bold text-blue-600 hover:underline">View all tours →</Link></div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => {
          const Icon = styleIcons[category.slug.split("-")[0]] || MapPin;
          const isActive = active?.id === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActive(category)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition ${isActive ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-600 hover:border-blue-300"}`}
            >
              <Icon size={13} /> {category.category_name}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-2">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <div className="snap-start" key={index}><TourCardSkeleton /></div>)
          : tours.map((tour, index) => <div className="snap-start" key={`${tour.title}-${index}`}><TourCard tour={tour} /></div>)}
        {!loading && tours.length === 0 && <p className="py-6 text-xs text-slate-400">No tours found for this travel style yet.</p>}
      </div>
    </section>
  );
}

function Testimonials({ reviews: items, loading }: { reviews: { quote: string; name: string; city: string; tourName: string; initials: string; rating: number }[]; loading?: boolean }) {
  if (!loading && items.length === 0) return null;
  return (
    <section className="py-12 text-center">
      <h2 className="text-2xl font-bold sm:text-3xl">Loved by Travellers Worldwide</h2>
      <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-7">
                <div className="h-4 w-full rounded-full bg-slate-100" />
                <div className="mt-2 h-4 w-2/3 rounded-full bg-slate-100" />
                <div className="mt-6 flex items-center border-t border-slate-100 pt-4"><div className="h-10 w-10 rounded-full bg-slate-100" /><div className="ml-3 space-y-2"><div className="h-3 w-20 rounded-full bg-slate-100" /><div className="h-3 w-14 rounded-full bg-slate-100" /></div></div>
              </div>
            ))
          : items.map((review) => <article key={review.name} className="rounded-2xl border border-slate-100 bg-white p-7 shadow-[0_8px_24px_rgba(15,23,42,.07)] transition hover:-translate-y-1"><Quote size={25} className="text-slate-200" /><p className="mt-4 min-h-24 text-xs leading-relaxed text-slate-700">“{review.quote}”</p><div className="mt-5 flex items-center border-t border-slate-100 pt-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">{review.initials}</span><div className="ml-3"><h3 className="text-[11px] font-bold">{review.name}</h3><p className="text-[9px] text-slate-400">{review.city}{review.city && review.tourName ? " · Verified Traveller" : ""}</p>{review.tourName && <p className="text-[9px] text-slate-400">Booked: {review.tourName}</p>}</div><span className="ml-auto flex text-amber-400">{Array.from({ length: review.rating }).map((_, i) => <Star key={i} size={11} className="fill-current" />)}</span></div></article>)}
      </div>
    </section>
  );
}
