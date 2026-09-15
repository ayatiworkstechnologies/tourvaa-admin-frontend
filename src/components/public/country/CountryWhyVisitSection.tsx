"use client";

/* eslint-disable @next/next/no-img-element */

import React from "react";
import { LuSparkles as Sparkles } from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryWhyVisitSectionProps {
  info: CountryDestinationInfo;
}

export default function CountryWhyVisitSection({ info }: CountryWhyVisitSectionProps) {
  return (
    <section id="section-why-visit" className="py-6 sm:py-8 bg-white">
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
        {/* Wide Panoramic Highlight Banner */}
        <div className="relative h-[240px] sm:h-[280px] w-full overflow-hidden rounded-[24px] bg-slate-950 flex items-center justify-center text-center p-6 sm:p-10 shadow-md">
          {/* Background image */}
          <img
            src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1800&q=80"
            alt="Scenic mountain highlight"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-45 scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />

          {/* Centered Content */}
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E4572E] px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
              <Sparkles size={11} className="fill-white" />
              <span>Must-See Highlight</span>
            </span>

            <h2 className="mt-3.5 text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              {info.tagline || "An Ancient Land of Contrasts & Wonder"}
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-white/85 font-medium leading-relaxed max-w-xl">
              {info.why_visit?.subtitle ||
                `Immerse yourself in centuries of living culture, dramatic scenery, and legendary hospitality across ${info.country_name}.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
