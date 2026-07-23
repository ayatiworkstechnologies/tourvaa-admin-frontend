"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { LuBedDouble as Bed, LuBriefcase as Suitcase, LuBus as Bus, LuCalendarDays as Calendar, LuChevronDown as ChevronDown, LuHeart as Heart, LuHouse as House, LuMapPin as MapPin, LuMinus as Minus, LuPlus as Plus, LuStar as Star, LuUserRound as User, LuUsers as Users, LuUtensils as Utensils } from "react-icons/lu";
import { PublicTourDetail } from "@/lib/api/publicClient";
import { useCurrency } from "@/hooks/useCurrency";

const FALLBACK = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=85";

type Props = {
  tour: PublicTourDetail;
  images: string[];
  initialTravelDate: string;
  initialAdults: number;
  initialChildren: number;
  onBook: (selection: { travelDate: string; adults: number; children: number }) => void;
  onWishlist: () => void;
  wishlisted: boolean;
  modal?: React.ReactNode;
};

export default function TourDetailExperience({ tour, images, initialTravelDate, initialAdults, initialChildren, onBook, onWishlist, wishlisted, modal }: Props) {
  const { format } = useCurrency();
  const gallery = images.length ? images : [FALLBACK];
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const departures = useMemo(() => tour.calendar.filter((entry) => entry.status !== "cancelled").slice(0, 5), [tour.calendar]);
  const [selectedDate, setSelectedDate] = useState(initialTravelDate || departures[0]?.date || "");
  const unitPrice = Number(tour.price_start_per_person || 0);
  const total = unitPrice * Math.max(1, adults + children);
  const dayCount = tour.number_of_days || 9;
  const destination = tour.country_name || "Your destination";

  return (
    <main className="min-h-screen bg-white pb-24 pt-20 text-slate-950">
      {modal}
      <section className="relative h-[300px] overflow-hidden md:h-[380px]">
        <img src={gallery[0]} alt={destination} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
        <h1 className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white drop-shadow md:text-5xl">{destination}</h1>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <header className="animate-fade-up">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">{tour.title}</h2>
          <div className="mt-6 flex flex-wrap items-center gap-5 text-sm font-semibold">
            <span className="rounded-full bg-blue-600 px-5 py-2 text-white">Best Seller</span>
            <span className="flex items-center gap-2"><Star size={16} className="fill-amber-400 text-amber-400" /><b>4.8</b> (2,486 Reviews)</span>
            <span>Operated by: <b>Tourvaa Experiences</b></span>
          </div>
          <nav className="mt-7 flex flex-wrap gap-x-12 gap-y-3 text-sm font-semibold text-slate-700"><a href="#overview">Explore</a><a href="#essentials" className="flex items-center gap-2">Tour Categories <ChevronDown size={15} /></a><a href="#itinerary" className="flex items-center gap-2">Travel Guides <ChevronDown size={15} /></a><a href="#itinerary" className="flex items-center gap-2">Travel Guide <ChevronDown size={15} /></a></nav>
        </header>

        <div className="animate-fade-up delay-100 mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_350px]">
          <div className="min-w-0">
            <section className="grid h-[360px] grid-cols-2 gap-4 overflow-hidden md:h-[480px]">
              <img src={gallery[0]} alt={tour.title} className="h-full w-full rounded-xl object-cover" />
              <div className="grid min-h-0 grid-rows-2 gap-4"><img src={gallery[1] || gallery[0]} alt="Tour view" className="h-full min-h-0 w-full rounded-xl object-cover" /><div className="grid min-h-0 grid-cols-2 gap-4"><img src={gallery[2] || gallery[0]} alt="Tour view" className="h-full min-h-0 w-full rounded-xl object-cover" /><img src={gallery[3] || gallery[1] || gallery[0]} alt="Tour view" className="h-full min-h-0 w-full rounded-xl object-cover" /></div></div>
            </section>
            <p className="border-b border-slate-200 py-7 text-sm font-semibold leading-6">{tour.short_description || `Don't miss ${destination}'s breathtaking landscapes, iconic landmarks, and unforgettable adventures—all in one perfectly planned journey.`}</p>

            <section id="overview" className="mt-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-2xl font-black">{tour.title} <span className="text-xl">{flagFor(tour.country_name)}</span></h3>
              <span className="mt-3 inline-block rounded border border-blue-300 px-2 py-1 text-xs font-bold">{dayCount} Days | {Math.max(1, dayCount - 1)} Nights</span>
              <p className="mt-6 text-sm leading-6 text-slate-700">{tour.long_description || tour.short_description || `Embark on an unforgettable journey through ${destination}, with thoughtfully curated stays, local experiences and seamless transfers.`}</p>
            </section>

            <section id="essentials" className="mt-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="flex items-center gap-3 text-2xl font-black"><Suitcase className="text-blue-600" />Travel Essentials</h3>
              <div className="mt-7 grid gap-x-10 gap-y-7 sm:grid-cols-2">
                <Essential icon={<Calendar />} title="Duration" value={`${dayCount} Days / ${Math.max(1, dayCount - 1)} Nights`} />
                <Essential icon={<Users />} title="Tour Guide" value="Professional English Guide" />
                <Essential icon={<MapPin />} title="Starts From" value={tour.start_location || tour.city_name || destination} />
                <Essential icon={<House />} title="Accommodation" value="4-Star Hotels (or similar)" />
                <Essential icon={<MapPin />} title="Ends At" value={tour.finish_location || destination} />
                <Essential icon={<Utensils />} title="Meals" value={`${Math.max(1, dayCount - 1)} Breakfasts, 2 Dinners`} />
                <Essential icon={<User />} title="Minimum Age" value="18 Years" />
                <Essential icon={<Bus />} title="Transportation" value="Private Coach & Transfers" />
                <Essential icon={<Users />} title="Maximum Age" value="65 Years" />
                <Essential icon={<MapPin />} title="Destination" value={destination} />
              </div>
            </section>

            <div className="mt-5 flex gap-8 overflow-x-auto rounded-xl border border-slate-200 px-5 py-5 text-xs font-bold"><a href="#overview">What&apos;s Included</a><a href="#itinerary">Journey Plan</a><a href="#overview">Extras</a><a href="#overview">Where You&apos;ll Stay</a><a href="#booking">Availability & Pricing</a><a href="#itinerary">Discover More</a></div>

            <section id="itinerary" className="mt-5 space-y-5">
              {(tour.itineraries.length ? tour.itineraries : [{ day: 1, title: `Welcome to ${tour.city_name || destination}`, description: `Arrive and meet your Tourvaa representative. Transfer to your hotel, check in, and enjoy the rest of the day at leisure.`, accommodation: tour.city_name || destination, meals: "Breakfast" }]).map((item, index) => <article key={`${item.day}-${item.title}`} className="grid gap-8 rounded-2xl border border-slate-200 p-7 shadow-sm md:grid-cols-[1fr_.9fr]"><div><div className="flex items-center justify-between text-[10px] font-black uppercase text-blue-600"><span>Tourvaa / {destination}</span><span className="rounded bg-blue-50 px-3 py-1">Day {item.day}</span></div><h3 className="mt-7 text-3xl font-medium">{item.title}</h3><p className="mt-7 text-sm leading-7 text-slate-600">{item.description}</p><div className="mt-7 rounded-xl bg-slate-50 p-5 text-xs leading-6"><b>Please note</b><p>Airport pickup is included. Hotel check-in begins at 2:00 PM.</p></div><div className="mt-7 grid grid-cols-2 border-t pt-5 text-xs"><span><Bed size={15} className="mb-2" />Overnight<br /><b>{item.accommodation || destination}</b></span><span><Utensils size={15} className="mb-2" />Meals<br /><b>{item.meals || "Breakfast"}</b></span></div></div><div className="relative min-h-80 overflow-hidden rounded-2xl"><img src={gallery[(index + 1) % gallery.length]} alt={item.title} className="h-full w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20 text-white"><small>DESTINATIONS</small><p className="text-2xl">{item.accommodation || destination}</p></div></div></article>)}
            </section>
          </div>

          <aside id="booking" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,.12)] lg:sticky lg:top-24">
            <h3 className="text-lg font-black">Book Your {destination} Adventure</h3><p className="mt-1 text-xs text-slate-500">Secure your preferred departure in just a few steps.</p>
            <div className="mt-5 space-y-2">{(departures.length ? departures : [{ date: "2026-09-12", slots: 8, status: "available" }, { date: "2026-09-20", slots: 12, status: "available" }, { date: "2026-09-26", slots: 5, status: "available" }]).map((entry, index) => <button type="button" key={entry.date} onClick={() => setSelectedDate(entry.date)} className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${selectedDate === entry.date || (!selectedDate && index === 0) ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}><span><b className="block text-xs">{dateLabel(entry.date)}</b><small className={entry.slots <= 5 ? "font-bold text-amber-500" : "text-slate-500"}>{entry.slots} Seats Left</small></span><span className="text-right"><b className="block text-xs text-blue-600">{format(unitPrice + index * 28, tour.currency || "USD")}</b><small className="text-[9px] text-slate-400">per traveller</small></span></button>)}</div>
            <div className="mt-6 border-t pt-5"><h4 className="text-xs font-black uppercase">Who&apos;s travelling?</h4><Counter label="Adults" note="Ages 18 years and above" value={adults} setValue={setAdults} min={1} /><Counter label="Children" note="Ages 5–17" value={children} setValue={setChildren} min={0} /></div>
            <div className="mt-5 border-t pt-5 text-xs"><h4 className="font-black uppercase">Booking summary</h4><Summary label={`Tour Price (${adults + children} Guests)`} value={format(total, tour.currency || "USD")} /><Summary label="Taxes & Service Fees" value="Included" accent /><Summary label="Booking Fee" value="Free" accent /><div className="mt-4 flex items-end justify-between border-t pt-4"><span><b className="block">Total Amount</b><small className="text-slate-400">per booking</small></span><b className="text-xl">{format(total, tour.currency || "USD")}</b></div></div>
            <button type="button" onClick={() => onBook({ travelDate: selectedDate, adults, children })} className="mt-5 w-full rounded-lg bg-blue-600 py-3.5 text-sm font-black text-white transition hover:bg-blue-700">Book Now</button>
            <button type="button" onClick={onWishlist} className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-bold ${wishlisted ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200"}`}><Heart size={14} className={wishlisted ? "fill-current" : ""} />{wishlisted ? "Saved" : "Add to Wishlist"}</button>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Essential({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) { return <div className="flex gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-blue-600">{icon}</span><span><b className="block text-sm">{title}</b><small className="text-slate-500">{value}</small></span></div>; }
function Counter({ label, note, value, setValue, min }: { label: string; note: string; value: number; setValue: (value: number) => void; min: number }) { return <div className="mt-4 flex items-center justify-between"><span><b className="block text-xs">{label}</b><small className="text-[9px] text-slate-400">{note}</small></span><span className="flex items-center gap-3"><button type="button" onClick={() => setValue(Math.max(min, value - 1))} className="rounded border p-1"><Minus size={12} /></button><b className="w-5 text-center text-xs">{String(value).padStart(2, "0")}</b><button type="button" onClick={() => setValue(value + 1)} className="rounded border p-1"><Plus size={12} /></button></span></div>; }
function Summary({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className="mt-3 flex justify-between"><span>{label}</span><b className={accent ? "text-emerald-500" : ""}>{value}</b></div>; }
function dateLabel(value: string) { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", weekday: "long" }).format(date); }
function flagFor(country: string) { const key = country.trim().toLowerCase(); return key === "new zealand" ? "🇳🇿" : key === "india" ? "🇮🇳" : key === "switzerland" ? "🇨🇭" : "🌍"; }
