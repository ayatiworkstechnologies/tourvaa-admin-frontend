"use client";

/* eslint-disable @next/next/no-img-element */

import React from "react";
import { LuHeart as Heart } from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryWhyVisitSectionProps {
  info: CountryDestinationInfo;
}

export default function CountryWhyVisitSection({ info }: CountryWhyVisitSectionProps) {
  const { why_visit } = info;
  const reasons = why_visit.reasons || [];

  return (
    <section id="section-why-visit" className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200/70">
      <div className="mx-auto max-w-[1380px] px-5">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#E4572E]">
            <Heart size={12} className="fill-[#E4572E]" />
            <span>Highlights & Reasons</span>
          </div>

          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight">
            {why_visit.title || `Why Visit ${info.country_name}?`}
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            {why_visit.subtitle || `From iconic UNESCO World Heritage sites to unique local encounters.`}
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, idx) => (
            <article
              key={reason.id || reason.title || idx}
              className="group flex flex-col overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-xs transition-all duration-300 hover:border-slate-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Image Container */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
                <img
                  src={reason.image || info.hero_image || "/images/destination-alpine.jpg"}
                  alt={reason.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                {reason.badge && (
                  <span className="absolute left-3.5 top-3.5 z-10 rounded-full bg-slate-950/70 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                    {reason.badge}
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 text-left">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-950 group-hover:text-pub-secondary transition-colors leading-snug">
                    {reason.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
