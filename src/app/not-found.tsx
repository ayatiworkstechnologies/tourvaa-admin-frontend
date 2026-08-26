"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PublicLayout from "@/components/public/PublicLayout";
import {
  LuCompass as Compass,
  LuHouse as Home,
  LuSearch as Search,
  LuMapPin as MapPin,
  LuArrowRight as ArrowRight,
  LuHeadset as Headset,
  LuSparkles as Sparkles,
  LuGlobe as Globe,
  LuBookOpen as BookOpen,
  LuPlane as Plane,
  LuCloud as Cloud,
} from "react-icons/lu";

const POPULAR_DESTINATIONS = [
  { name: "Dubai", country: "UAE", href: "/tours?search=Dubai", tag: "Trending" },
  { name: "Kerala", country: "India", href: "/tours?search=Kerala", tag: "Popular" },
  { name: "Swiss Alps", country: "Switzerland", href: "/tours?search=Switzerland", tag: "Scenic" },
  { name: "Bali", country: "Indonesia", href: "/tours?search=Bali", tag: "Beach" },
  { name: "Rajasthan", country: "India", href: "/tours?search=Rajasthan", tag: "Heritage" },
  { name: "Japan", country: "Asia", href: "/tours?search=Japan", tag: "Culture" },
];

const HELPFUL_LINKS = [
  { title: "Browse All Tours", description: "Discover 500+ curated holiday packages and tours.", href: "/tours", icon: Compass },
  { title: "Travel Guides & Blogs", description: "Inspiration, itineraries, and insider tips.", href: "/blogs", icon: BookOpen },
  { title: "Destinations Directory", description: "Explore countries and iconic travel hotspots.", href: "/destinations", icon: Globe },
  { title: "Customer Support", description: "Talk to our 24/7 travel specialist team.", href: "/contact", icon: Headset },
];

export default function NotFound() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/tours?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/tours");
    }
  };

  return (
    <PublicLayout>
      <main className="relative min-h-[85vh] overflow-hidden bg-gradient-to-b from-slate-50 via-sky-50/30 to-orange-50/20 py-12 sm:py-16 lg:py-20">
        {/* Ambient Decorative Sky Background Elements */}
        <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#1478f2]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-28 h-96 w-96 rounded-full bg-[#d95d2c]/10 blur-3xl" />

        {/* Drifting Clouds Background */}
        <div className="pointer-events-none absolute inset-x-0 top-6 overflow-hidden select-none opacity-40">
          <div className="animate-cloud-slow flex items-center justify-between px-8 sm:px-20 text-slate-300/70">
            <Cloud size={64} className="blur-[0.5px]" />
            <Cloud size={48} className="translate-y-6" />
            <Cloud size={80} className="blur-[1px]" />
          </div>
          <div className="animate-cloud-fast flex items-center justify-around px-12 sm:px-32 text-slate-300/50 mt-8">
            <Cloud size={42} className="-translate-y-4" />
            <Cloud size={56} className="translate-y-8" />
            <Cloud size={46} />
          </div>
        </div>

        {/* Across-the-sky Timed Flight Animation */}
        <div className="pointer-events-none absolute inset-x-0 top-16 h-48 overflow-hidden">
          <div className="animate-plane-fly absolute left-0 top-1/2 flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#0b1e34] to-[#1a3d66] text-white shadow-xl ring-2 ring-white/80">
              <Plane size={24} className="text-[#d95d2c] -rotate-45" />
            </div>
            {/* Contrail trail */}
            <div className="h-0.5 w-36 bg-gradient-to-l from-orange-400/80 via-white to-transparent" />
          </div>
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Aviation Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/90 bg-white/90 px-4 py-1.5 text-xs font-black tracking-wider text-slate-800 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d95d2c] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#d95d2c]"></span>
              </span>
              <span className="text-[#d95d2c] font-black">FLIGHT TV-404</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">STATUS: DESTINATION REROUTING</span>
            </div>

            {/* Flight Trail & Dynamic 404 Centerpiece */}
            <div className="relative mx-auto mt-4 sm:mt-6 flex max-w-lg items-center justify-center py-6 sm:py-10">
              {/* Flight Vector Trail SVG */}
              <svg
                viewBox="0 0 500 200"
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                fill="none"
              >
                <path
                  d="M 20,160 C 120,190 180,40 260,70 C 340,100 420,10 480,50"
                  stroke="#d95d2c"
                  strokeWidth="2.5"
                  strokeDasharray="8 8"
                  className="animate-contrail opacity-75"
                />
                {/* Waypoint Beacon 1 */}
                <circle cx="20" cy="160" r="5" fill="#d95d2c" />
                <circle cx="260" cy="70" r="5" fill="#1478f2" />
                <circle cx="480" cy="50" r="5" fill="#d95d2c" />
              </svg>

              {/* Waypoint Location Tags */}
              <span className="absolute left-2 bottom-6 text-[10px] font-bold text-slate-400 bg-white/80 px-2 py-0.5 rounded-md shadow-xs border border-slate-100">
                DEP: ORIGIN
              </span>
              <span className="absolute right-2 top-2 text-[10px] font-bold text-[#d95d2c] bg-orange-50 px-2 py-0.5 rounded-md shadow-xs border border-orange-200">
                ARR: 404 NOT FOUND
              </span>

              {/* Large 404 Typography */}
              <div className="relative z-10 flex items-center justify-center">
                <span className="select-none text-8xl sm:text-9xl lg:text-[144px] font-black tracking-tighter text-slate-900/10 transition duration-500">
                  404
                </span>

                {/* Gliding Jet Centerpiece */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-plane-glide relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl border border-white/90 bg-gradient-to-tr from-white via-slate-50 to-orange-50/60 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-md">
                    {/* Pulsing Beacon Ring */}
                    <div className="animate-beacon absolute -inset-1 rounded-3xl opacity-30" />
                    <Plane className="h-12 w-12 sm:h-14 sm:w-14 text-[#d95d2c] drop-shadow-md -rotate-45 transition-transform hover:scale-110" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Headline & Message */}
            <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
              Looks like you’ve wandered off the map!
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-slate-600">
              The flight path you were following has drifted into unmapped skies. But don’t worry, your next real adventure is just a quick search away.
            </p>

            {/* Quick Destination Search Bar */}
            <form
              onSubmit={handleSearch}
              className="mx-auto mt-7 flex max-w-lg items-center rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.07)] transition focus-within:border-[#d95d2c] focus-within:ring-4 focus-within:ring-orange-100"
            >
              <div className="flex flex-1 items-center gap-2.5 pl-3.5">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search destinations, tours, or countries..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#d95d2c] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow transition hover:bg-[#c24f22] active:scale-95"
              >
                <span>Search</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Main CTAs */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0b1e34] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#163354] hover:shadow-lg hover:-translate-y-0.5"
              >
                <Home className="h-4 w-4 text-[#d95d2c]" />
                <span>Return to Homepage</span>
              </Link>
              <Link
                href="/tours"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-[#d95d2c] hover:bg-orange-50/50 hover:text-[#d95d2c] hover:-translate-y-0.5"
              >
                <Compass className="h-4 w-4" />
                <span>Explore All Tours</span>
              </Link>
            </div>
          </div>

          {/* Popular Destinations Quick Links */}
          <div className="mt-12 rounded-3xl border border-slate-100/90 bg-white/85 p-6 sm:p-8 shadow-[0_4px_24px_rgba(15,23,42,0.04)] backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#d95d2c]" />
                  <span>Popular Destinations You Might Love</span>
                </h2>
                <p className="text-xs text-slate-500">Pick an inspiring place and begin exploring right away.</p>
              </div>
              <Link
                href="/destinations"
                className="text-xs font-bold text-[#d95d2c] hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View all destinations</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {POPULAR_DESTINATIONS.map((dest) => (
                <Link
                  key={dest.name}
                  href={dest.href}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 text-left transition hover:border-orange-200 hover:bg-white hover:shadow-md hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-slate-400">{dest.country}</span>
                    <span className="rounded-full bg-orange-100/80 px-1.5 py-0.5 text-[9px] font-bold text-[#d95d2c]">
                      {dest.tag}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900 group-hover:text-[#d95d2c] transition-colors">
                      {dest.name}
                    </span>
                    <MapPin className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#d95d2c] transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Helpful Navigation Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HELPFUL_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.title}
                  href={link.href}
                  className="group flex items-start gap-3.5 rounded-2xl border border-slate-100/90 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#d95d2c] transition group-hover:bg-[#d95d2c] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#d95d2c] transition-colors">
                      {link.title}
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                      {link.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}
