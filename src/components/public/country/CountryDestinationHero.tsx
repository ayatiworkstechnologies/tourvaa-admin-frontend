"use client";

/* eslint-disable @next/next/no-img-element */

import React from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCompass as Compass,
  LuHouse as Home,
  LuChevronRight as ChevronRight,
  LuSparkles as Sparkles,
} from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryDestinationHeroProps {
  info: CountryDestinationInfo;
  tourCount?: number;
}

export default function CountryDestinationHero({
  info,
  tourCount = 24,
}: CountryDestinationHeroProps) {
  const scrollToTours = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("section-tours");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToWhenToGo = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("section-when-to-go");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-white text-slate-900 pt-4 pb-8">
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
        {/* ── 1. Panoramic Scenic Hero Banner ── */}
        <div className="relative h-[320px] sm:h-[380px] w-full overflow-hidden rounded-[26px] bg-slate-950 shadow-md">
          <img
            src={
              info.hero_image ||
              "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1800&q=80"
            }
            alt={`${info.country_name} Tours`}
            className="h-full w-full object-cover object-center opacity-85 scale-102 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-black/20" />

          {/* Floating Dark Card in the Center/Left */}
          <div className="absolute inset-x-5 bottom-6 sm:bottom-10 sm:left-10 sm:right-auto max-w-lg rounded-[22px] border border-white/20 bg-black/60 p-6 sm:p-7 text-white backdrop-blur-md shadow-2xl">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {info.country_name} Tours
            </h1>
            <p className="mt-2.5 text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
              {info.hero_subtitle ||
                info.tagline ||
                `Discover ancient wonders, mist-shrouded peaks, futuristic skylines, and thousand-year traditions on unforgettable journeys across ${info.country_name}.`}
            </p>
            <div className="mt-4 pt-3 border-t border-white/15">
              <a
                href="#section-tours"
                onClick={scrollToTours}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-white transition group cursor-pointer"
              >
                <span>Browse all {tourCount || 24} tours in {info.country_name}</span>
                <ArrowRight size={13} className="transition group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>

        {/* ── 2. Breadcrumbs Navigation ── */}
        <nav
          aria-label="Breadcrumb"
          className="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-500"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-slate-900 transition"
          >
            <Home size={13} className="text-slate-400" />
            <span>Home</span>
          </Link>
          <ChevronRight size={12} className="text-slate-300" />
          <Link
            href="/destinations"
            className="hover:text-slate-900 transition"
          >
            Tours
          </Link>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="text-slate-900 font-bold">{info.country_name}</span>
        </nav>

        {/* ── 3. Country Title & Split Overview Card ── */}
        <div className="mt-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mb-4">
            {info.country_name}
          </h2>

          <div className="rounded-[24px] border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
              {/* Left Column: Narrative & Action Buttons */}
              <div className="text-left">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                  An Introduction
                </p>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  <p>{info.overview_narrative}</p>
                </div>

                {/* Two Action Buttons matching screenshot */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a
                    href="#section-tours"
                    onClick={scrollToTours}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0A1128] hover:bg-slate-850 text-white text-xs font-bold px-6 py-2.5 shadow-xs transition cursor-pointer"
                  >
                    <span>Explore Tours</span>
                    <ArrowRight size={13} />
                  </a>
                  <a
                    href="#section-when-to-go"
                    onClick={scrollToWhenToGo}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold px-6 py-2.5 shadow-2xs transition cursor-pointer"
                  >
                    <span>Best time to visit</span>
                  </a>
                </div>
              </div>

              {/* Right Column: High-Res Landscape Photograph */}
              <div className="overflow-hidden rounded-[20px] bg-slate-100 shadow-sm border border-slate-100">
                <img
                  src={
                    info.why_visit?.reasons?.[0]?.image ||
                    info.best_places_to_visit?.places?.[0]?.image ||
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80"
                  }
                  alt={`${info.country_name} Landscape`}
                  className="h-[250px] sm:h-[290px] w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
