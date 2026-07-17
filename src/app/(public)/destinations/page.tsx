"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCompass as Compass,
  LuGlobe as Globe2,
  LuMapPin as MapPin,
  LuSearch as Search,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuX as X,
} from "react-icons/lu";
import { fetchPublicCountries, PublicCountry } from "@/lib/api/publicClient";

/* eslint-disable @next/next/no-img-element */

const TROPICAL_IMAGE = "/images/tour-card-fallback.jpg";
const ALPINE_IMAGE = "/images/destination-alpine.jpg";
const DESERT_IMAGE = "/images/destination-desert.jpg";

function destinationImage(countryCode: string) {
  if (["CA", "GB", "NZ"].includes(countryCode)) return ALPINE_IMAGE;
  if (["AE", "QA"].includes(countryCode)) return DESERT_IMAGE;
  return TROPICAL_IMAGE;
}

export default function DestinationsPage() {
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPublicCountries()
      .then(setCountries)
      .catch(() => setCountries([]))
      .finally(() => setLoading(false));
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredCountries = countries.filter((country) =>
    `${country.country_name} ${country.country_code}`.toLowerCase().includes(normalizedSearch),
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <section className="relative overflow-hidden bg-[#063c42] pb-24 pt-32 text-white md:pb-28 md:pt-40">
        <img src={TROPICAL_IMAGE} alt="Tropical destination" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#043d42]/95 via-[#043d42]/78 to-[#043d42]/25" />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-teal-300/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 md:px-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-teal-50 backdrop-blur-md">
              <Globe2 size={14} /> Explore the world
            </div>
            <h1 className="mt-5 max-w-3xl font-heading text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Your next story starts <span className="text-orange-400">somewhere beautiful.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
              Discover handpicked destinations, trusted local experiences, and holidays designed around the way you love to travel.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md lg:block">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">Why explore with Tourvaa?</p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-800"><Sparkles size={18} /></span><span><strong className="block text-sm">Curated destinations</strong><small className="text-white/65">Selected by travel specialists</small></span></div>
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-800"><ShieldCheck size={18} /></span><span><strong className="block text-sm">Trusted partners</strong><small className="text-white/65">Verified stays and experiences</small></span></div>
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-800"><Compass size={18} /></span><span><strong className="block text-sm">Personal planning</strong><small className="text-white/65">Support for every journey</small></span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-8 max-w-4xl px-5 md:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-700" size={20} />
            <input
              type="search"
              aria-label="Search destinations"
              placeholder="Search by country or country code..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-14 w-full rounded-xl bg-slate-50 py-4 pl-12 pr-24 text-sm font-bold text-slate-950 outline-none transition focus:bg-white focus:ring-2 focus:ring-teal-600/20"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-7xl px-5 md:px-8">
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Choose your escape</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Explore our destinations</h2>
            <p className="mt-2 text-sm text-slate-500">Find tours built around places you&apos;ll never forget.</p>
          </div>
          {!loading && <p className="text-sm font-bold text-slate-500"><span className="text-teal-800">{filteredCountries.length}</span> destination{filteredCountries.length === 1 ? "" : "s"}</p>}
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-200" />)}
          </div>
        ) : filteredCountries.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCountries.map((country, index) => {
              const image = destinationImage(country.country_code);
              return (
                <Link
                  key={country.id}
                  href={`/tours?country=${encodeURIComponent(country.country_name)}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-[#063c42] shadow-sm ring-1 ring-slate-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  style={{ animationDelay: `${(index % 6) * 60}ms` }}
                >
                  <img src={image} alt={country.country_name} onError={(event) => { event.currentTarget.src = TROPICAL_IMAGE; }} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#032f33]/95 via-[#032f33]/15 to-black/10" />
                  <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-slate-800 shadow-sm backdrop-blur">
                    <Globe2 size={14} className="text-teal-700" /> {country.country_code}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <div className="flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-teal-200"><MapPin size={12} /> Destination</p>
                        <h3 className="truncate text-2xl font-black text-white">{country.country_name}</h3>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition group-hover:translate-x-1 group-hover:bg-orange-600"><ArrowRight size={17} /></span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><MapPin size={28} /></span>
            <h3 className="mt-5 text-xl font-black text-slate-950">No destinations found</h3>
            <p className="mt-2 text-sm text-slate-500">We couldn&apos;t find a destination matching &ldquo;{search}&rdquo;.</p>
            <button type="button" onClick={() => setSearch("")} className="mt-6 rounded-xl bg-teal-700 px-6 py-3 text-sm font-black text-white transition hover:bg-teal-800">View all destinations</button>
          </div>
        )}
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-5 md:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-[#075b57] p-7 text-white sm:p-10">
          <img src={DESERT_IMAGE} alt="Desert travel destination" className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-90 md:block" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#075b57] via-[#075b57] to-transparent md:via-[#075b57]/95" />
          <div className="relative max-w-xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">Need inspiration?</p>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">Tell us where you want to go next.</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">Our travel experts can turn a destination idea into a complete, personalised itinerary.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-black transition hover:bg-orange-600">Plan My Trip</Link>
              <Link href="/tours" className="rounded-xl border border-white/50 px-6 py-3 text-sm font-black transition hover:bg-white hover:text-teal-900">Browse all tours</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
