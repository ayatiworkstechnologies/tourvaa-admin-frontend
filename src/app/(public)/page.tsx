"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuArrowLeft as ArrowLeft,
  LuArrowRight as ArrowRight,
  LuAward as Award,
  LuBadgeCheck as BadgeCheck,
  LuBed as Bed,
  LuCalendarDays as Calendar,
  LuClock3 as Clock,
  LuChevronDown as ChevronDown,
  LuHeadset as Headset,
  LuHeart as Heart,
  LuHotel as Hotel,
  LuMapPin as MapPin,
  LuMinus as Minus,
  LuPlane as Plane,
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
  fetchPublicCountries,
  fetchPublicTours,
  PublicTour,
} from "@/lib/api/publicClient";
import { MAX_COMPARE_ITEMS, useTravelStore } from "@/providers/TravelStoreProvider";
import { publicTourUrl } from "@/lib/utils/tourUrl";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useCurrency } from "@/hooks/useCurrency";

type TourFeature = { icon: React.ElementType; text: string };

type Tour = {
  id?: number;
  title: string;
  place: string;
  image: string;
  days: string;
  durationTag?: string;
  reviews: string;
  rating?: number;
  features: TourFeature[];
  rawPrice?: number | null;
  originalPrice?: number | null;
  currency?: string;
  slug?: string;
  badge?: string;
};

const PLACEHOLDER_IMAGE = "/images/tour-card-fallback.jpg";

function stableHash(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 33) ^ value.charCodeAt(i);
  return hash >>> 0;
}

const DEMO_TRENDING_TOURS: Tour[] = [
  {
    id: 101,
    title: "New Zealand Explorer",
    place: "New Zealand",
    image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80",
    days: "9 Days",
    reviews: "2,050 reviews",
    rating: 4.8,
    badge: "Save 25%",
    features: [
      { icon: Clock, text: "9 Days" },
      { icon: MapPin, text: "Auckland + 3 Southland" },
      { icon: Users, text: "Age Range: 12 - 70" },
      { icon: Users, text: "Max Group Size: 24" },
    ],
    rawPrice: 1102,
    originalPrice: 1470,
    currency: "USD",
    slug: "new-zealand-explorer",
  },
  {
    id: 102,
    title: "Golden Triangle Escape",
    place: "India",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
    days: "7 Days",
    reviews: "1,889 reviews",
    rating: 4.7,
    badge: "Save 25%",
    features: [
      { icon: Clock, text: "7 Days / 6 Nights" },
      { icon: MapPin, text: "Delhi + Agra + Jaipur" },
      { icon: Users, text: "Age Range: 10 - 75" },
      { icon: Users, text: "Max Group Size: 20" },
    ],
    rawPrice: 639,
    originalPrice: 852,
    currency: "USD",
    slug: "golden-triangle-escape",
  },
  {
    id: 103,
    title: "Swiss Alpine Adventure",
    place: "Switzerland",
    image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
    days: "8 Days",
    reviews: "3,412 reviews",
    rating: 4.9,
    badge: "Save 25%",
    features: [
      { icon: Clock, text: "8 Days / 7 Nights" },
      { icon: MapPin, text: "Zurich + Lucerne" },
      { icon: Users, text: "Age Range: 15 - 65" },
      { icon: Users, text: "Max Group Size: 18" },
    ],
    rawPrice: 1575,
    originalPrice: 2100,
    currency: "USD",
    slug: "swiss-alpine-adventure",
  },
  {
    id: 104,
    title: "Cherry Blossom Express",
    place: "Japan",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    days: "8 Days",
    reviews: "1,689 reviews",
    rating: 4.9,
    badge: "Save 25%",
    features: [
      { icon: Clock, text: "8 Days / 7 Nights" },
      { icon: MapPin, text: "Tokyo + Kyoto" },
      { icon: Users, text: "Age Range: 12 - 70" },
      { icon: Users, text: "Max Group Size: 16" },
    ],
    rawPrice: 1800,
    originalPrice: 2400,
    currency: "USD",
    slug: "cherry-blossom-express",
  },
];

const DEMO_HANDPICKED_TOURS: Tour[] = [
  {
    id: 201,
    title: "South Island Explorer",
    place: "New Zealand",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    days: "7 Days",
    durationTag: "7D / 6N",
    reviews: "2,050 reviews",
    rating: 4.8,
    features: [
      { icon: Hotel, text: "Including accommodation" },
      { icon: Award, text: "100% 5-Star Service" },
      { icon: Plane, text: "Airport Transfers available" },
    ],
    rawPrice: 2699,
    originalPrice: 3599,
    currency: "USD",
    slug: "south-island-explorer",
  },
  {
    id: 202,
    title: "Golden Triangle Escape",
    place: "India",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
    days: "7 Days",
    durationTag: "7D / 6N",
    reviews: "2,050 reviews",
    rating: 4.8,
    features: [
      { icon: Hotel, text: "Premium accommodation" },
      { icon: Award, text: "Guided heritage tour" },
      { icon: Plane, text: "Daily breakfast included" },
    ],
    rawPrice: 799,
    originalPrice: 999,
    currency: "USD",
    slug: "golden-triangle-escape-handpicked",
  },
  {
    id: 203,
    title: "Swiss Alps Escape",
    place: "Switzerland",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
    days: "6 Days",
    durationTag: "6D / 5N",
    reviews: "3,128 reviews",
    rating: 4.8,
    features: [
      { icon: Hotel, text: "Mountain view accommodation" },
      { icon: Award, text: "Scenic Train Experience" },
      { icon: Plane, text: "Daily breakfast included" },
    ],
    rawPrice: 780,
    originalPrice: 990,
    currency: "USD",
    slug: "swiss-alps-escape",
  },
  {
    id: 204,
    title: "Paris & Provence",
    place: "France",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    days: "7 Days",
    durationTag: "7D / 6N",
    reviews: "2,650 reviews",
    rating: 4.8,
    features: [
      { icon: Hotel, text: "Central city accommodation" },
      { icon: Award, text: "Expert local tour guide" },
      { icon: Plane, text: "Wine & food tasting included" },
    ],
    rawPrice: 870,
    originalPrice: 1150,
    currency: "USD",
    slug: "paris-and-provence",
  },
];

const DEMO_PLACES = [
  {
    name: "New Zealand",
    count: "125 Packages",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    price: 1102,
    currency: "USD",
  },
  {
    name: "India",
    count: "75 Packages",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
    price: 639,
    currency: "USD",
  },
  {
    name: "Switzerland",
    count: "85 Packages",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
    price: 780,
    currency: "USD",
  },
  {
    name: "France",
    count: "110 Packages",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    price: 870,
    currency: "USD",
  },
];

function mapPublicTour(tour: PublicTour, isHandpicked = false): Tour {
  const durationLabel = tour.number_of_days
    ? `${tour.number_of_days} Day${tour.number_of_days === 1 ? "" : "s"}`
    : tour.number_of_hours
      ? `${tour.number_of_hours} Hour${tour.number_of_hours === 1 ? "" : "s"}`
      : "Flexible";

  const durationTag = tour.number_of_days
    ? `${tour.number_of_days}D / ${Math.max(0, tour.number_of_days - 1)}N`
    : tour.number_of_hours
      ? `${tour.number_of_hours} Hours`
      : undefined;

  let features: TourFeature[] = [];

  if (isHandpicked) {
    features = [
      { icon: Hotel, text: "Including accommodation" },
      { icon: Award, text: "100% 5-Star Service" },
      { icon: Plane, text: "Airport Transfers available" },
    ];
  } else {
    features = [{ icon: Clock, text: durationLabel }];
    if (tour.start_location && tour.end_location) {
      features.push({ icon: MapPin, text: `${tour.start_location} → ${tour.end_location}` });
    } else if (tour.city_name) {
      features.push({ icon: MapPin, text: `${tour.city_name} & Region` });
    } else {
      features.push({ icon: MapPin, text: `${tour.country_name || "Destination"} Route` });
    }
    features.push({ icon: Users, text: `Age Range: 12 - 70` });
    if (tour.group_size) {
      features.push({ icon: Users, text: `Max Group Size: ${tour.group_size}` });
    } else {
      features.push({ icon: Users, text: `Max Group Size: 24` });
    }
  }

  const rawPrice = tour.price_start_per_person;
  const originalPrice = rawPrice != null ? Math.round(rawPrice / 0.75) : null;

  return {
    id: tour.id,
    title: tour.title,
    place: tour.country_name || tour.city_name || "Worldwide",
    image: tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER_IMAGE,
    days: durationLabel,
    durationTag,
    reviews: tour.rating_count ? `${tour.rating_count} reviews` : "2,050 reviews",
    rating: tour.rating_average ?? 4.8,
    features,
    rawPrice,
    originalPrice,
    currency: tour.currency || "USD",
    slug: tour.slug,
    badge: "Save 25%",
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

function HomeSearch({ onPanelOpenChange }: { onPanelOpenChange?: (isOpen: boolean) => void }) {
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

  // The dropdown panels below open absolutely-positioned and float over
  // whatever sits below the search bar (the trust-badge row). Report
  // open/closed so the parent can fade those badges out instead of letting
  // a panel's edge slice through the middle of a badge's text.
  useEffect(() => { onPanelOpenChange?.(open !== null); }, [open, onPanelOpenChange]);

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
  return <div className={`${panelClass} right-0 left-auto min-w-64`}><p className="rounded-md bg-slate-50 px-3 py-2 text-center text-[10px] font-semibold text-blue-600">Passengers</p><div className="space-y-4 px-2 py-4"><Counter label="Adult" note="12 years and above" value={adults} min={1} onChange={setAdults} /><Counter label="Children" note="3 - 11 years" value={childCount} min={0} onChange={setChildren} /></div><button type="button" onClick={onApply} className="w-full rounded-md bg-blue-600 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700">Apply</button></div>;
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

function TrendingTourCard({ tour }: { tour: Tour }) {
  const { isWishlisted, toggleWishlist, isCompared, toggleCompare } = useTravelStore();
  const { format } = useCurrency();
  const toast = useToast();
  const itemId = tour.id ?? stableHash(tour.slug || tour.title);
  const wishlisted = isWishlisted(itemId);
  const compared = tour.id != null && isCompared(tour.id);
  const href = tour.id ? publicTourUrl(tour) : `/tours?search=${encodeURIComponent(tour.title)}`;
  const travelItem = {
    id: itemId,
    title: tour.title,
    place: tour.place,
    image: tour.image,
    price: tour.rawPrice ?? null,
    currency: tour.currency || "USD",
    duration: tour.days,
    href,
  };

  const originalPrice = tour.originalPrice ?? (tour.rawPrice != null ? Math.round(tour.rawPrice / 0.75) : null);

  return (
    <article className="group relative w-[290px] shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:w-[310px] lg:w-[315px] xl:w-[325px]">
      <div className="absolute right-6 top-6 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => toggleWishlist(travelItem)}
          aria-label={wishlisted ? `Remove ${tour.title} from wishlist` : `Add ${tour.title} to wishlist`}
          className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition-all duration-200 hover:scale-110 ${
            wishlisted ? "bg-red-500 text-white" : "bg-white/80 text-slate-700 hover:bg-white hover:text-red-500"
          }`}
        >
          <Heart size={15} className={wishlisted ? "fill-current" : ""} />
        </button>
        {tour.id != null && (
          <button
            type="button"
            onClick={() => {
              const { limitReached } = toggleCompare(travelItem);
              if (limitReached) toast.error(`You can compare up to ${MAX_COMPARE_ITEMS} tours at a time.`);
            }}
            aria-label={compared ? `Remove ${tour.title} from comparison` : `Add ${tour.title} to comparison`}
            className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition-all duration-200 hover:scale-110 ${
              compared ? "bg-blue-600 text-white" : "bg-white/80 text-slate-700 hover:bg-white hover:bg-blue-600 hover:text-white"
            }`}
          >
            <Scale size={14} />
          </button>
        )}
      </div>

      <Link href={href} aria-label={`View ${tour.title}`} className="block focus-visible:outline-none">
        <div className="relative h-48 overflow-hidden rounded-xl">
          <img
            src={tour.image}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm">
            <MapPin size={10} className="text-sky-500" /> {tour.place}
          </span>
          <span className="absolute bottom-3 right-3 rounded-full bg-[#1478f2] px-3 py-1 text-[11px] font-extrabold text-white shadow-md">
            {tour.badge || "Save 25%"}
          </span>
        </div>

        <div className="pt-3.5">
          <h3 className="truncate text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600">
            {tour.title}
          </h3>

          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={11} className="fill-current" />
              ))}
            </span>
            <b className="font-bold text-slate-900">{tour.rating || "4.8"}</b>
            <span className="text-slate-400">({tour.reviews})</span>
          </div>

          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
            {tour.features.map((feature, index) => (
              <p key={index} className="flex items-center gap-2">
                <feature.icon size={13} className="shrink-0 text-sky-500" />
                <span className="truncate">{feature.text}</span>
              </p>
            ))}
          </div>

          <div className="mt-3.5 flex items-baseline gap-1.5 border-t border-slate-100 pt-3 text-xs">
            <span className="font-semibold text-slate-500">From</span>
            {originalPrice != null && (
              <span className="text-xs text-slate-400 line-through">
                {format(originalPrice, tour.currency || "USD")}
              </span>
            )}
            <strong className="text-xl font-black text-slate-950">
              {tour.rawPrice != null ? format(tour.rawPrice, tour.currency || "USD") : "Price on request"}
            </strong>
            <span className="text-[10px] font-medium text-slate-400">pp</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function HandpickedTourCard({ tour }: { tour: Tour }) {
  const { isWishlisted, toggleWishlist, isCompared, toggleCompare } = useTravelStore();
  const { format } = useCurrency();
  const toast = useToast();
  const itemId = tour.id ?? stableHash(tour.slug || tour.title);
  const wishlisted = isWishlisted(itemId);
  const compared = tour.id != null && isCompared(tour.id);
  const href = tour.id ? publicTourUrl(tour) : `/tours?search=${encodeURIComponent(tour.title)}`;
  const travelItem = {
    id: itemId,
    title: tour.title,
    place: tour.place,
    image: tour.image,
    price: tour.rawPrice ?? null,
    currency: tour.currency || "USD",
    duration: tour.days,
    href,
  };

  const originalPrice = tour.originalPrice ?? (tour.rawPrice != null ? Math.round(tour.rawPrice / 0.75) : null);

  return (
    <article className="group relative w-[290px] shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:w-[310px] lg:w-[315px] xl:w-[325px]">
      <div className="absolute right-6 top-6 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => toggleWishlist(travelItem)}
          aria-label={wishlisted ? `Remove ${tour.title} from wishlist` : `Add ${tour.title} to wishlist`}
          className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition-all duration-200 hover:scale-110 ${
            wishlisted ? "bg-red-500 text-white" : "bg-white/80 text-slate-700 hover:bg-white hover:text-red-500"
          }`}
        >
          <Heart size={15} className={wishlisted ? "fill-current" : ""} />
        </button>
        {tour.id != null && (
          <button
            type="button"
            onClick={() => {
              const { limitReached } = toggleCompare(travelItem);
              if (limitReached) toast.error(`You can compare up to ${MAX_COMPARE_ITEMS} tours at a time.`);
            }}
            aria-label={compared ? `Remove ${tour.title} from comparison` : `Add ${tour.title} to comparison`}
            className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition-all duration-200 hover:scale-110 ${
              compared ? "bg-blue-600 text-white" : "bg-white/80 text-slate-700 hover:bg-white hover:bg-blue-600 hover:text-white"
            }`}
          >
            <Scale size={14} />
          </button>
        )}
      </div>

      <Link href={href} aria-label={`View ${tour.title}`} className="block focus-visible:outline-none">
        <div className="relative h-48 overflow-hidden rounded-xl">
          <img
            src={tour.image}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm">
            <MapPin size={10} className="text-sky-500" /> {tour.place}
          </span>
        </div>

        <div className="pt-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600">
              {tour.title}
            </h3>
            {tour.durationTag && (
              <span className="shrink-0 rounded border border-blue-200 bg-blue-50/50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                {tour.durationTag}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={11} className="fill-current" />
              ))}
            </span>
            <b className="font-bold text-slate-900">{tour.rating || "4.8"}</b>
            <span className="text-slate-400">({tour.reviews})</span>
          </div>

          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
            {tour.features.map((feature, index) => (
              <p key={index} className="flex items-center gap-2">
                <feature.icon size={13} className="shrink-0 text-sky-500" />
                <span className="truncate">{feature.text}</span>
              </p>
            ))}
          </div>

          <div className="mt-3.5 flex items-baseline gap-1.5 border-t border-slate-100 pt-3 text-xs">
            <span className="font-semibold text-slate-500">From</span>
            {originalPrice != null && (
              <span className="text-xs text-slate-400 line-through">
                {format(originalPrice, tour.currency || "USD")}
              </span>
            )}
            <strong className="text-xl font-black text-slate-950">
              {tour.rawPrice != null ? format(tour.rawPrice, tour.currency || "USD") : "Price on request"}
            </strong>
            <span className="text-[10px] font-medium text-slate-400">pp</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function TourCardSkeleton() {
  return (
    <div className="w-[290px] shrink-0 animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5 sm:w-[310px] lg:w-[315px]">
      <div className="h-48 rounded-xl bg-slate-100" />
      <div className="pt-3">
        <div className="h-4 w-3/4 rounded-full bg-slate-100" />
        <div className="mt-3 h-3 w-1/2 rounded-full bg-slate-100" />
        <div className="mt-4 h-8 w-2/3 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function CarouselSection({
  title,
  tours,
  cardType = "trending",
  loading,
}: {
  title: string;
  tours: Tour[];
  cardType?: "trending" | "handpicked";
  loading?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => ref.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  const displayTours = tours;

  return (
    <section className="py-8 sm:py-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">{title}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous tours"
            onClick={() => move(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-blue-500 hover:text-blue-600 hover:shadow-md"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            type="button"
            aria-label="Next tours"
            onClick={() => move(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-blue-500 hover:text-blue-600 hover:shadow-md"
          >
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-4 pt-1">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div className="snap-start" key={index}>
                <TourCardSkeleton />
              </div>
            ))
          : displayTours.map((tour, index) => (
              <div className="snap-start" key={`${tour.title}-${index}`}>
                {cardType === "handpicked" ? <HandpickedTourCard tour={tour} /> : <TrendingTourCard tour={tour} />}
              </div>
            ))}
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
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([fetchHomepageBanners(), fetchFeaturedTours(10), fetchPopularDestinations(), fetchCustomerReviews(), fetchPublicCountries()]).then(([bannerResult, tourResult, destinationResult, reviewResult, countryResult]) => {
      if (!active) return;
      if (bannerResult.status === "fulfilled" && bannerResult.value.length) setBanners(bannerResult.value);
      if (tourResult.status === "fulfilled" && tourResult.value.length) {
        const mapped = tourResult.value.map((tour) => mapPublicTour(tour));
        setTrendingTours(mapped.slice(0, 5));
        setHandpickedTours((mapped.length > 5 ? mapped.slice(5, 10) : mapped).slice(0, 5).map((tour) => ({ ...tour, features: [{ icon: Hotel, text: "Including accommodation" }, { icon: Award, text: "100% 5-Star Service" }, { icon: Plane, text: "Airport Transfers available" }] })));
      }
      if (destinationResult.status === "fulfilled" && destinationResult.value.length) {
        const tourCounts = new Map<string, number>();
        if (countryResult.status === "fulfilled") {
          countryResult.value.forEach((country) => tourCounts.set(country.country_name.trim().toLowerCase(), country.tour_count || 0));
        }
        const places = destinationResult.value.slice(0, 5).map((item) => mapDestination(item, tourCounts));
        setDynamicPlaces(places);
        // Not available_only -- that requires a configured TourCalendar
        // departure and would silently return no price for every
        // destination whose tours don't have one set up yet (see
        // CountryTourListing.tsx's identical fix).
        Promise.allSettled(places.map((place) => fetchPublicTours({ country: place.name, sort: "price_asc", limit: 1 }))).then((priceResults) => {
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
  const heroImage = banner?.image ;
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
          <div className="animate-fade-up delay-200 mt-12"><HomeSearch onPanelOpenChange={setSearchPanelOpen} /></div>
          <div className="animate-fade-up delay-400 mt-12">
            {/* Separate from the animate-fade-up entrance animation above: that
             * animation's `both` fill-mode pins opacity:1 after it finishes,
             * which otherwise fights this state-driven opacity toggle for
             * cascade priority. Keeping them on different elements avoids that. */}
            <div className={`relative z-0 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-medium text-white/90 transition-opacity duration-200 ${searchPanelOpen ? "pointer-events-none opacity-0" : "opacity-100"}`}>
              <TrustBadge icon={Star} title="4.8/5 Traveller Rating" note="from 20,000+ reviews" />
              <TrustBadge icon={ShieldCheck} title="Secure Payments" note="100% secure & protected" />
              <TrustBadge icon={BadgeCheck} title="Verified Tour Partners" note="Handpicked experts" />
              <TrustBadge icon={Headset} title="24/7 Travel Assistance" note="We're here for you" />
            </div>
          </div>
        </div>
        <span className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 animate-bounce text-white/70 sm:block">
          <ChevronDown size={22} />
        </span>
      </section>

      <div className="relative z-10 mx-auto max-w-[1380px] px-5 sm:px-8 lg:px-12">
        <Reveal><CarouselSection title="Trending Tour Packages" tours={trendingTours} cardType="trending" loading={loadingHome} /></Reveal>

        <Reveal><CarouselSection title="Handpicked Tours for You" tours={handpickedTours} cardType="handpicked" loading={loadingHome} /></Reveal>

        <Reveal className="py-6">
          <section className="grid gap-6 overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 sm:p-7 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:grid-cols-2 md:items-center">
            <img
              src="https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=85"
              alt="Group of travellers hiking a mountain trail"
              className="h-60 sm:h-72 md:h-80 w-full rounded-xl object-cover shadow-sm"
            />
            <div className="flex flex-col items-start justify-center py-2 text-left">
              <h2 className="max-w-lg text-2xl font-extrabold leading-tight text-[#1478f2] sm:text-3xl lg:text-4xl">
                Travel stories, guides and inspiration for every journey
              </h2>
              <p className="mt-4 max-w-md text-xs sm:text-sm leading-relaxed text-slate-500">
                Explore travel guides, insider tips and inspiring stories from destinations around the world.
              </p>
              <Link
                href="/blogs"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#1478f2] px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5"
              >
                Read Stories
              </Link>
            </div>
          </section>
        </Reveal>

        <Reveal><PlacesCarousel places={dynamicPlaces} loading={loadingHome} /></Reveal>

        <Reveal><WhyTourvaa /></Reveal>

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

function PlacesCarousel({
  places: items,
  loading,
}: {
  places: { name: string; count: string; rating: string; image: string; price: number | null; currency: string }[];
  loading?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => ref.current?.scrollBy({ left: direction * 270, behavior: "smooth" });
  const displayPlaces = items.length > 0 ? items : DEMO_PLACES;

  return (
    <section className="py-8 sm:py-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">Places Worth Exploring</h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous places"
            onClick={() => move(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-blue-500 hover:text-blue-600 hover:shadow-md"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            type="button"
            aria-label="Next places"
            onClick={() => move(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-blue-500 hover:text-blue-600 hover:shadow-md"
          >
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-4 pt-1">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-52 w-[240px] shrink-0 animate-pulse rounded-2xl bg-slate-100" />
            ))
          : displayPlaces.map((place) => <PlaceCard key={place.name} place={place} />)}
      </div>
    </section>
  );
}

function PlaceCard({ place }: { place: { name: string; count: string; rating: string; image: string } }) {
  const [saved, setSaved] = useState(false);
  return (
    <Link
      href={`/tours?country=${place.name}`}
      className="group block w-[230px] sm:w-[250px] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_4px_16px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-40 overflow-hidden rounded-xl">
        <img
          src={place.image}
          alt={place.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm">
          <MapPin size={10} className="text-sky-500" /> {place.name}
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setSaved((value) => !value);
          }}
          aria-label={saved ? `Remove ${place.name} from wishlist` : `Add ${place.name} to wishlist`}
          className={`absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition hover:scale-110 ${
            saved ? "bg-red-500 text-white" : "bg-white/80 text-slate-700 hover:bg-white hover:text-red-500"
          }`}
        >
          <Heart size={13} className={saved ? "fill-current" : ""} />
        </button>
      </div>
      <div className="pt-3 px-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600">
            {place.name}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-800">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {place.rating}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
          <MapPin size={11} className="text-sky-500" />
          {place.count}
        </p>
      </div>
    </Link>
  );
}

function Testimonials({ reviews: items, loading }: { reviews: { quote: string; name: string; city: string; tourName: string; initials: string; rating: number }[]; loading?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => ref.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  if (!loading && items.length === 0) return null;
  return (
    <section className="py-12">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold sm:text-3xl">What Tourvaa travellers are saying</h2>
        <div className="flex gap-2">
          <button aria-label="Previous reviews" onClick={() => move(-1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white transition hover:border-blue-500 hover:text-blue-600"><ArrowLeft size={15} /></button>
          <button aria-label="Next reviews" onClick={() => move(1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white transition hover:border-blue-500 hover:text-blue-600"><ArrowRight size={15} /></button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar flex snap-x gap-5 overflow-x-auto pb-2">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="w-[320px] shrink-0 animate-pulse rounded-2xl border border-slate-100 bg-white p-7">
                <div className="h-4 w-full rounded-full bg-slate-100" />
                <div className="mt-2 h-4 w-2/3 rounded-full bg-slate-100" />
                <div className="mt-6 flex items-center border-t border-slate-100 pt-4"><div className="h-10 w-10 rounded-full bg-slate-100" /><div className="ml-3 space-y-2"><div className="h-3 w-20 rounded-full bg-slate-100" /><div className="h-3 w-14 rounded-full bg-slate-100" /></div></div>
              </div>
            ))
          : items.map((review) => (
              <article key={review.name} className="w-[320px] shrink-0 snap-start rounded-2xl border border-slate-100 bg-white p-7 text-left shadow-[0_8px_24px_rgba(15,23,42,.07)] transition hover:-translate-y-1">
                <Quote size={25} className="text-slate-200" />
                <p className="mt-4 min-h-24 text-xs leading-relaxed text-slate-700">“{review.quote}”</p>
                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">{review.initials}</span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[11px] font-bold">{review.name}</h3>
                    <p className="truncate text-[9px] text-slate-400">{review.city}</p>
                  </div>
                </div>
                <span className="mt-2.5 flex text-amber-400">{Array.from({ length: review.rating }).map((_, i) => <Star key={i} size={12} className="fill-current" />)}</span>
              </article>
            ))}
      </div>
    </section>
  );
}
