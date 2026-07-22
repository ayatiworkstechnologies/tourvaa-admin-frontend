"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuArrowLeft as ArrowLeft,
  LuArrowRight as ArrowRight,
  LuCalendarDays as Calendar,
  LuClock3 as Clock,
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuHeart as Heart,
  LuMapPin as MapPin,
  LuMinus as Minus,
  LuPlus as Plus,
  LuQuote as Quote,
  LuSearch as Search,
  LuStar as Star,
  LuUsers as Users,
} from "react-icons/lu";
import {
  CmsBanner,
  CmsDestination,
  CmsReview,
  fetchCustomerReviews,
  fetchFeaturedTours,
  fetchHomepageBanners,
  fetchPopularDestinations,
  PublicTour,
} from "@/lib/api/publicClient";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import { publicTourUrl } from "@/lib/utils/tourUrl";

type Tour = {
  id?: number;
  title: string;
  place: string;
  image: string;
  price: string;
  days: string;
  reviews: string;
  features: string[];
  rawPrice?: number | null;
  currency?: string;
  slug?: string;
};

const trending: Tour[] = [
  { title: "New Zealand Explorer", place: "New Zealand", image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=900&q=85", price: "$1,182", days: "9D | 8N", reviews: "2,466", features: ["Auckland + Queenstown", "Age Range: 12–70", "Max Group Size: 24"] },
  { title: "Golden Triangle Escape", place: "India", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=900&q=85", price: "$839", days: "7D | 6N", reviews: "1,888", features: ["Delhi + Agra + Jaipur", "Age Range: 10–75", "Max Group Size: 20"] },
  { title: "Swiss Alpine Adventure", place: "Switzerland", image: "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=900&q=85", price: "$1,575", days: "8D | 7N", reviews: "3,692", features: ["Zurich + Lucerne", "Age Range: 15–70", "Max Group Size: 18"] },
  { title: "Cherry Blossom Japan", place: "Japan", image: "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=900&q=85", price: "$1,869", days: "10D | 9N", reviews: "2,989", features: ["Tokyo + Kyoto", "Age Range: 12–70", "Max Group Size: 16"] },
  { title: "Bali Island Escape", place: "Indonesia", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=85", price: "$969", days: "6D | 5N", reviews: "2,104", features: ["Ubud + Seminyak", "Age Range: 12–70", "Max Group Size: 20"] },
];

const handpicked: Tour[] = [
  { title: "South Island Explorer", place: "New Zealand", image: "https://images.unsplash.com/photo-1469521669194-babb45599def?auto=format&fit=crop&w=900&q=85", price: "$2,699", days: "10D | 9N", reviews: "2,466", features: ["Including Accommodation", "Milford Sound Cruise", "Airport pickup available"] },
  { title: "Golden Triangle Escape", place: "India", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=900&q=85", price: "$799", days: "7D | 6N", reviews: "2,466", features: ["Premium accommodation", "Guided heritage tour", "Daily breakfast included"] },
  { title: "Swiss Alps Escape", place: "Switzerland", image: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=900&q=85", price: "$780", days: "6D | 5N", reviews: "1,328", features: ["Mountain-view accommodation", "Scenic train experience", "Daily breakfast included"] },
  { title: "Paris & Provence", place: "France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=85", price: "$670", days: "7D | 6N", reviews: "2,466", features: ["Central hotel accommodation", "Guided city sightseeing", "Seine river cruise included"] },
  { title: "Amalfi Coast Dreams", place: "Italy", image: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=900&q=85", price: "$1,250", days: "8D | 7N", reviews: "1,806", features: ["Boutique accommodation", "Coastal boat tour", "Daily breakfast included"] },
];

const places = [
  { name: "New Zealand", count: "95 Packages", rating: "4.9", image: "https://images.unsplash.com/photo-1469521669194-babb45599def?auto=format&fit=crop&w=900&q=85" },
  { name: "India", count: "73 Packages", rating: "4.9", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=900&q=85" },
  { name: "Switzerland", count: "85 Packages", rating: "4.8", image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=900&q=85" },
  { name: "France", count: "62 Packages", rating: "4.8", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=85" },
  { name: "Greece", count: "48 Packages", rating: "4.9", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=85" },
];

const reviews = [
  { quote: "Booked a 7-day Rajasthan tour through Tourvaa. Everything was flawless — hotels, transport, guides. I didn’t have to think once.", name: "Priya Menon", city: "Kerala, India", initials: "PM" },
  { quote: "The Golden Triangle package was absolutely worth every dirham. The team was responsive and the itinerary was perfectly paced.", name: "Khalid Al-Rashid", city: "Dubai, UAE", initials: "KA" },
  { quote: "Discovered Tourvaa on Instagram and booked a Kerala houseboat trip on a whim. Genuinely the best holiday I’ve ever had.", name: "Anjali Sharma", city: "Bengaluru, India", initials: "AS" },
];

function mapPublicTour(tour: PublicTour, index: number): Tour {
  const fallback = trending[index % trending.length];
  let price = fallback.price;
  if (tour.price_start_per_person != null) {
    try {
      price = new Intl.NumberFormat("en-US", { style: "currency", currency: tour.currency || "USD", maximumFractionDigits: 0 }).format(tour.price_start_per_person);
    } catch { price = `${tour.currency || "$"} ${tour.price_start_per_person.toLocaleString()}`; }
  }
  return {
    id: tour.id,
    title: tour.title,
    place: tour.country_name || tour.city_name || "Worldwide",
    image: tour.banner_image || fallback.image,
    price,
    days: tour.number_of_days ? `${tour.number_of_days}D | ${Math.max(0, tour.number_of_days - 1)}N` : tour.number_of_hours ? `${tour.number_of_hours} Hours` : "Flexible",
    reviews: "Verified",
    features: [tour.city_name || tour.country_name || "Curated itinerary", tour.category_name || "Guided experience", tour.short_description || "Flexible booking available"],
    rawPrice: tour.price_start_per_person,
    currency: tour.currency || "USD",
    slug: tour.slug,
  };
}

function mapDestination(item: CmsDestination, index: number) {
  const fallback = places[index % places.length];
  return { name: item.title, count: item.description || "Explore packages", rating: "4.9", image: item.image || fallback.image };
}

function mapReview(item: CmsReview) {
  const initials = item.reviewer_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return { quote: item.review_text, name: item.reviewer_name, city: item.country || item.tour_name || "Verified traveller", initials, rating: Math.max(1, Math.min(5, item.rating || 5)) };
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

function HomeSearch() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<"destination" | "date" | "duration" | "passengers" | null>(null);
  const [destination, setDestination] = useState("India");
  const [travelDate, setTravelDate] = useState("02 Jul 2026");
  const [duration, setDuration] = useState("7 - 10 Days");
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
    const params = new URLSearchParams({ country: destination, travel_date: travelDate, duration, adults: String(adults), children: String(children) });
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

function DatePanel({ selected, onApply }: { selected: string; onApply: (value: string) => void }) {
  const [mode, setMode] = useState<"flexible" | "specific">("flexible");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState("Jul");
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
          <CalendarMonth month="July 2026" start={3} selected={selected} onSelect={onApply} />
          <CalendarMonth month="August 2026" start={6} selected={selected} onSelect={onApply} />
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

function CalendarMonth({ month, start, selected, onSelect }: { month: string; start: number; selected: string; onSelect: (value: string) => void }) {
  const days = month.startsWith("July") ? 31 : 31;
  const shortMonth = month.slice(0, 3);
  return <div><div className="mb-3 flex items-center justify-between"><b className="text-xs">{month}</b><span className="flex gap-1"><button type="button" className="h-6 w-6 rounded transition hover:-translate-x-0.5 hover:bg-slate-100">‹</button><button type="button" className="h-6 w-6 rounded transition hover:translate-x-0.5 hover:bg-slate-100">›</button></span></div><div className="grid grid-cols-7 text-center text-[9px] text-slate-400">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day} className="py-1">{day}</span>)}</div><div className="calendar-days grid grid-cols-7 gap-1 text-center text-[10px] font-semibold">{Array.from({ length: start }).map((_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: days }).map((_, i) => { const value = `${String(i + 1).padStart(2, "0")} ${shortMonth} 2026`; const active = selected === value; return <button type="button" key={value} onClick={() => onSelect(value)} className={`aspect-square rounded transition hover:bg-blue-100 hover:text-blue-700 ${active ? "is-selected bg-blue-600 text-white" : "text-slate-700"}`}>{String(i + 1).padStart(2, "0")}</button>; })}</div></div>;
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

function Stars({ reviews: count }: { reviews?: string }) {
  return <div className="mt-1 flex items-center gap-1 text-[10px]"><span className="flex text-amber-400">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className="fill-current" />)}</span><b className="text-slate-700">4.8</b>{count && <span className="text-slate-400">{count} reviews</span>}</div>;
}

function TourCard({ tour, discount }: { tour: Tour; discount?: boolean }) {
  const { isWishlisted, toggleWishlist } = useTravelStore();
  const fallbackId = -Math.abs(Array.from(tour.title).reduce((total, character) => total + character.charCodeAt(0), 0));
  const itemId = tour.id ?? fallbackId;
  const wishlisted = isWishlisted(itemId);
  const href = tour.id ? publicTourUrl(tour) : `/tours?search=${encodeURIComponent(tour.title)}`;
  const travelItem = { id: itemId, title: tour.title, place: tour.place, image: tour.image, price: tour.rawPrice ?? null, currency: tour.currency || "USD", duration: tour.days, href };
  return (
    <article className="group relative w-[275px] shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,.07)] transition duration-500 hover:-translate-y-2 hover:shadow-xl sm:w-[310px] lg:w-[calc((100vw-7rem)/4)] xl:w-[306px]">
      <button type="button" onClick={() => toggleWishlist(travelItem)} aria-label={wishlisted ? `Remove ${tour.title} from wishlist` : `Add ${tour.title} to wishlist`} className={`absolute right-5 top-5 z-20 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition hover:scale-110 ${wishlisted ? "bg-red-500 text-white" : "bg-black/15 text-white hover:bg-white hover:text-red-500"}`}><Heart size={17} className={wishlisted ? "fill-current" : ""} /></button>
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
          <div className="mt-3 flex items-end gap-2 border-t border-slate-100 pt-2 text-xs"><b>From</b><span className="text-[9px] text-slate-300 line-through">$1,599</span><strong className="text-lg text-slate-950">{tour.price}</strong><span className="text-[8px] text-slate-400">pp</span></div>
        </div>
      </Link>
    </article>
  );
}

function CarouselSection({ title, tours, discount }: { title: string; tours: Tour[]; discount?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => ref.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  return (
    <section className="py-10">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-950 sm:text-2xl">{title}</h2><div className="flex gap-2"><button aria-label="Previous tours" onClick={() => move(-1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white transition hover:border-blue-500 hover:text-blue-600"><ArrowLeft size={15} /></button><button aria-label="Next tours" onClick={() => move(1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white transition hover:border-blue-500 hover:text-blue-600"><ArrowRight size={15} /></button></div></div>
      <div ref={ref} className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-5">{tours.map((tour, index) => <div className="snap-start" key={`${tour.title}-${index}`}><TourCard tour={tour} discount={discount} /></div>)}</div>
    </section>
  );
}

export default function Home() {
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [trendingTours, setTrendingTours] = useState<Tour[]>(trending);
  const [handpickedTours, setHandpickedTours] = useState<Tour[]>(handpicked);
  const [dynamicPlaces, setDynamicPlaces] = useState(places);
  const [dynamicReviews, setDynamicReviews] = useState(reviews.map((item) => ({ ...item, rating: 5 })));

  useEffect(() => {
    let active = true;
    Promise.allSettled([fetchHomepageBanners(), fetchFeaturedTours(10), fetchPopularDestinations(), fetchCustomerReviews()]).then(([bannerResult, tourResult, destinationResult, reviewResult]) => {
      if (!active) return;
      if (bannerResult.status === "fulfilled" && bannerResult.value.length) setBanners(bannerResult.value);
      if (tourResult.status === "fulfilled" && tourResult.value.length) {
        const mapped = tourResult.value.map(mapPublicTour);
        setTrendingTours(mapped.slice(0, 5));
        setHandpickedTours((mapped.length > 5 ? mapped.slice(5, 10) : mapped).slice(0, 5));
      }
      if (destinationResult.status === "fulfilled" && destinationResult.value.length) setDynamicPlaces(destinationResult.value.slice(0, 10).map(mapDestination));
      if (reviewResult.status === "fulfilled" && reviewResult.value.length) setDynamicReviews(reviewResult.value.slice(0, 6).map(mapReview));
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setBannerIndex((index) => (index + 1) % banners.length), 7000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  const banner = banners[bannerIndex];
  const heroImage = banner?.image || "https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=2200&q=90";
  const heroTitle = banner?.title || "Endless destinations. One easy search.";

  return (
    <main className="overflow-x-clip bg-white text-slate-950">
      <section className="relative z-30 flex min-h-[550px] items-center justify-center overflow-visible pt-20 text-center text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img key={heroImage} src={heroImage} alt={banner?.title || "Dramatic green mountain landscape"} className="animate-hero-img h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/10 via-slate-900/5 to-slate-950/35" />
        </div>
        <div className="relative z-10 w-full px-4">
          <h1 key={heroTitle} className="animate-fade-up text-2xl font-semibold tracking-tight sm:text-3xl">{heroTitle}</h1>
          {banner?.subtitle && <p className="animate-fade-up delay-100 mx-auto mt-2 max-w-xl text-sm text-white/85">{banner.subtitle}</p>}
          <div className="animate-fade-up delay-200 mt-10"><HomeSearch /></div>
          <p className="animate-fade-up delay-400 relative z-0 mt-10 text-[11px] font-medium text-white/90">Tourvaa travellers rate us <b>Excellent</b> <span className="text-blue-400">★★★★★</span> 4.5 out of 5 based on 12,8k reviews on Ayatiworks</p>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-[1380px] px-5 sm:px-8 lg:px-12">
        <Reveal><CarouselSection title="Trending Tour Packages" tours={trendingTours} discount /></Reveal>
        <Reveal><CarouselSection title="Handpicked Tours for You" tours={handpickedTours} /></Reveal>

        <Reveal className="py-12 lg:px-16">
          <section className="grid overflow-hidden rounded-lg border border-slate-100 bg-white p-2 shadow-[0_8px_26px_rgba(15,23,42,.08)] md:grid-cols-2">
            <img src="https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=85" alt="Friends hiking through a mountain landscape" className="h-72 w-full rounded-md object-cover sm:h-96" />
            <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
              <h2 className="max-w-lg text-3xl font-bold leading-tight text-[#1478f2] sm:text-4xl">Travel stories, guides and inspiration for every journey</h2>
              <p className="mt-7 max-w-sm text-xs leading-relaxed text-slate-500">Explore travel guides, insider tips and inspiring stories from destinations around the world.</p>
              <Link href="/blogs" className="mt-6 rounded-lg bg-[#1478f2] px-10 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-1 hover:bg-blue-700">Read Stories</Link>
            </div>
          </section>
        </Reveal>

        <Reveal><PlacesCarousel places={dynamicPlaces} /></Reveal>
        <Reveal><Testimonials reviews={dynamicReviews} /></Reveal>
        <Reveal><DestinationDirectory /></Reveal>
      </div>
    </main>
  );
}

function PlacesCarousel({ places: items }: { places: { name: string; count: string; rating: string; image: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => ref.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  return (
    <section className="py-10">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold sm:text-2xl">Places Worth Exploring</h2><div className="flex gap-2"><button onClick={() => move(-1)} aria-label="Previous places" className="flex h-8 w-8 items-center justify-center rounded border border-slate-200"><ArrowLeft size={15} /></button><button onClick={() => move(1)} aria-label="Next places" className="flex h-8 w-8 items-center justify-center rounded border border-slate-200"><ArrowRight size={15} /></button></div></div>
      <div ref={ref} className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-5">{items.map((place) => <Link href={`/tours?country=${place.name}`} key={place.name} className="group w-[275px] shrink-0 snap-start rounded-xl border border-slate-100 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,.07)] transition hover:-translate-y-1"><div className="h-44 overflow-hidden rounded-lg"><img src={place.image} alt={place.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" /></div><div className="mt-3 flex items-center justify-between"><h3 className="font-bold">{place.name}</h3><span className="flex items-center gap-1 text-xs font-bold"><Star size={10} className="fill-amber-400 text-amber-400" />{place.rating}</span></div><p className="mt-1 text-[10px] text-slate-400">▣ {place.count}</p></Link>)}</div>
    </section>
  );
}

function Testimonials({ reviews: items }: { reviews: { quote: string; name: string; city: string; initials: string; rating: number }[] }) {
  return (
    <section className="py-12 text-center">
      <h2 className="text-2xl font-bold sm:text-3xl">What Tourvaa travellers are saying</h2>
      <div className="mt-10 grid gap-5 text-left md:grid-cols-3">{items.map((review) => <article key={review.name} className="rounded-2xl border border-slate-100 bg-white p-7 shadow-[0_8px_24px_rgba(15,23,42,.07)] transition hover:-translate-y-1"><Quote size={25} className="text-slate-200" /><p className="mt-4 min-h-24 text-xs leading-relaxed text-slate-700">“{review.quote}”</p><div className="mt-5 flex items-center border-t border-slate-100 pt-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">{review.initials}</span><div className="ml-3"><h3 className="text-[11px] font-bold">{review.name}</h3><p className="text-[9px] text-slate-400">{review.city}</p></div><span className="ml-auto flex text-amber-400">{Array.from({ length: review.rating }).map((_, i) => <Star key={i} size={11} className="fill-current" />)}</span></div></article>)}</div>
    </section>
  );
}

function DestinationDirectory() {
  const columns = [["New Zealand", "Prague", "Albufeira", "Seville"], ["Barcelona", "Marrakesh", "New York City", "Porto"], ["Krakow", "York", "Budapest", "Malaga"], ["Paris", "London", "Tokyo", "Lisbon"]];
  return (
    <section className="my-14 rounded-xl border border-slate-100 bg-white p-7 shadow-[0_8px_24px_rgba(15,23,42,.06)] sm:p-10">
      <div className="flex gap-8 border-b border-slate-200 pb-4 text-[11px] font-semibold"><button className="text-slate-950">Destinations</button><button className="text-slate-400">Top countries to visit</button><button className="hidden text-slate-400 sm:block">Top attraction categories</button></div>
      <div className="mt-7 grid grid-cols-2 gap-8 md:grid-cols-4">{columns.map((column, i) => <div key={i} className="space-y-5">{column.map((city, j) => <Link href={`/tours?search=${city}`} key={city} className="block"><b className="block text-xs">{city}</b><span className="mt-1 block text-[9px] text-slate-400">{978 + i * 214 + j * 233} tours &amp; activities</span></Link>)}</div>)}</div>
    </section>
  );
}
