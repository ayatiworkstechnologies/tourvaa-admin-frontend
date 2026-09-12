"use client";

/* eslint-disable @next/next/no-img-element */

import React from "react";
import {
  LuCompass as Compass,
  LuGlobe as Globe,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
} from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryOverviewSectionProps {
  info: CountryDestinationInfo;
}

export default function CountryOverviewSection({ info }: CountryOverviewSectionProps) {
  return (
    <section id="section-overview" className="py-12 sm:py-16 bg-white border-b border-slate-100">
      <div className="mx-auto max-w-[1380px] px-5">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          {/* Left: Narrative & Highlights */}
          <div className="text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#E4572E]">
              <Sparkles size={12} className="fill-[#E4572E]" />
              <span>Destination Overview</span>
            </div>

            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Discover the Essence of {info.country_name}
            </h2>

            <div className="mt-4 space-y-4 text-sm sm:text-base leading-relaxed text-slate-600 font-medium">
              <p>{info.overview_narrative}</p>
            </div>

            {/* Travel Value Highlights */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 transition-all hover:bg-white hover:shadow-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-[#E4572E] mb-3">
                  <Globe size={18} />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Curated Itineraries</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Handcrafted routes balancing iconic highlights and off-the-beaten-track gems.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 transition-all hover:bg-white hover:shadow-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 mb-3">
                  <ShieldCheck size={18} />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Trusted Local Guides</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Vetted resident tour leaders providing deep cultural insights and safety.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 transition-all hover:bg-white hover:shadow-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 mb-3">
                  <Compass size={18} />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Seamless Logistics</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Air-conditioned transport, handpicked accommodation, and pre-booked entries.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Visual Showcase Card */}
          <div className="relative">
            <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-slate-100 shadow-xl">
              <img
                src={info.hero_image || "/images/destination-alpine.jpg"}
                alt={info.country_name}
                className="h-[340px] sm:h-[400px] w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            {/* Overlay Badge */}
            <div className="absolute -bottom-5 right-6 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl backdrop-blur-md max-w-xs text-left">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#E4572E]">Best Way to Travel</p>
              <p className="mt-1 text-xs font-semibold text-slate-700 leading-snug">
                Join our small group tours or book private tailor-made itineraries across {info.country_name}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
