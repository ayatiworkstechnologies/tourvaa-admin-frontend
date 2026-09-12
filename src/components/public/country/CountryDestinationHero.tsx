"use client";

/* eslint-disable @next/next/no-img-element */

import React from "react";
import Link from "next/link";
import {
  LuClock as Clock,
  LuCoins as Coins,
  LuCompass as Compass,
  LuGlobe as Globe,
  LuHouse as Home,
  LuLanguages as Languages,
  LuMapPin as MapPin,
  LuPlug as Plug,
  LuStar as Star,
} from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryDestinationHeroProps {
  info: CountryDestinationInfo;
  tourCount?: number;
}

export default function CountryDestinationHero({ info, tourCount = 0 }: CountryDestinationHeroProps) {
  const { quick_facts } = info;

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      {/* Background Image with Cinematic Overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={info.hero_image || "/images/hero-1.jpg"}
          alt={`${info.country_name} landscape`}
          className="h-full w-full object-cover object-center opacity-45 scale-105 transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/40" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1380px] px-5 pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-white/70">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-white transition">
            <Home size={12} className="text-[#E4572E]" />
            Home
          </Link>
          <span className="text-white/30">/</span>
          <Link href="/destinations" className="hover:text-white transition">
            Destinations
          </Link>
          <span className="text-white/30">/</span>
          <span className="text-[#E4572E] font-bold">{info.country_name}</span>
        </nav>

        {/* Hero Header Content */}
        <div className="max-w-3xl text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-md">
            <Globe size={13} className="text-[#E4572E]" />
            <span>Destination Guide</span>
            {tourCount > 0 && (
              <>
                <span className="h-1 w-1 rounded-full bg-white/40" />
                <span className="text-amber-400 font-bold">{tourCount} Tour Packages</span>
              </>
            )}
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {info.hero_title || `${info.country_name} Tours & Travel Guide`}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-white/85 font-medium leading-relaxed max-w-2xl">
            {info.hero_subtitle || info.tagline}
          </p>

          {/* Social Proof Badges */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-white/90">
            <span className="flex items-center gap-1.5">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="font-bold text-white">4.9 / 5</span>
              <span className="text-white/70 font-normal">from 1,200+ verified travellers</span>
            </span>
            <span className="flex items-center gap-1 text-white/80">
              <Compass size={14} className="text-[#E4572E]" />
              Expert Local Tour Guides
            </span>
          </div>
        </div>

        {/* Quick Facts Strip (On The Go Tours Style) */}
        <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-5 backdrop-blur-md shadow-xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-6 divide-y sm:divide-y-0 divide-white/10">
            <div className="flex items-center gap-3 pt-2 sm:pt-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                <MapPin size={16} className="text-amber-400" />
              </span>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-white/60">Capital</span>
                <span className="block text-xs sm:text-sm font-bold text-white truncate">{quick_facts.capital}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 sm:pt-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                <Coins size={16} className="text-emerald-400" />
              </span>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-white/60">Currency</span>
                <span className="block text-xs sm:text-sm font-bold text-white truncate">{quick_facts.currency}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 sm:pt-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                <Languages size={16} className="text-sky-400" />
              </span>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-white/60">Languages</span>
                <span className="block text-xs sm:text-sm font-bold text-white truncate">{quick_facts.languages}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 sm:pt-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                <Clock size={16} className="text-orange-400" />
              </span>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-white/60">Timezone</span>
                <span className="block text-xs sm:text-sm font-bold text-white truncate">{quick_facts.timezone}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 sm:pt-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                <Compass size={16} className="text-pink-400" />
              </span>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-white/60">Ideal Trip</span>
                <span className="block text-xs sm:text-sm font-bold text-white truncate">{quick_facts.ideal_duration}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 sm:pt-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                <Plug size={16} className="text-indigo-400" />
              </span>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-white/60">Plugs</span>
                <span className="block text-xs sm:text-sm font-bold text-white truncate">{quick_facts.plug_types}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
