"use client";

/* eslint-disable @next/next/no-img-element */

import React from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight, LuChevronRight as ChevronRight, LuHouse as Home } from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryDestinationHeroProps {
  info: CountryDestinationInfo;
  tourCount?: number;
}

export default function CountryDestinationHero({
  info,
  tourCount = 24,
}: CountryDestinationHeroProps) {
  const scrollToTours = (event: React.MouseEvent) => {
    event.preventDefault();
    document.getElementById("section-tours")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-white pb-7 pt-4 text-slate-900">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="relative min-h-[460px] overflow-hidden rounded-[26px] bg-slate-950 shadow-md sm:min-h-[500px]">
          <img
            src={info.hero_image || "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1800&q=80"}
            alt={`${info.country_name} Tours`}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-black/15" />
          <div className="absolute inset-x-5 bottom-6 max-w-xl text-white sm:bottom-10 sm:left-10 sm:right-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200">Destination guide</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {info.hero_title || `${info.country_name} Tours`}
            </h1>
            <p className="mt-3 text-sm font-medium leading-relaxed text-white/90 sm:text-base">
              {info.hero_subtitle || info.tagline || `Explore ${info.country_name} with confidence, context, and carefully planned journeys.`}
            </p>
            <a
              href="#section-tours"
              onClick={scrollToTours}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-sky-100"
            >
              Browse {tourCount || 24} tours
              <ArrowRight size={14} />
            </a>
          </div>
        </div>

        <nav aria-label="Breadcrumb" className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="inline-flex items-center gap-1 transition hover:text-slate-900">
            <Home size={13} className="text-slate-400" />
            <span>Home</span>
          </Link>
          <ChevronRight size={12} className="text-slate-300" />
          <Link href="/destinations" className="transition hover:text-slate-900">Destinations</Link>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="font-bold text-slate-900">{info.country_name}</span>
        </nav>
      </div>
    </section>
  );
}
