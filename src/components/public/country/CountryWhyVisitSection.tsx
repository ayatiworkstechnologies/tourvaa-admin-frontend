"use client";

/* eslint-disable @next/next/no-img-element */

import React from "react";
import { LuSparkles as Sparkles } from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryWhyVisitSectionProps {
  info: CountryDestinationInfo;
}

export default function CountryWhyVisitSection({ info }: CountryWhyVisitSectionProps) {
  const reasons = info.why_visit?.reasons || [];
  const title = info.why_visit?.title || `Why Visit ${info.country_name}?`;
  const subtitle =
    info.why_visit?.subtitle ||
    `From world-wonder monuments to sacred rituals and rare wildlife, discover what makes ${info.country_name} a life-changing journey.`;

  return (
    <section id="section-why-visit" className="py-12 sm:py-16 bg-white border-b border-slate-100">
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
        {/* Section Header matching CMS Tab 3 */}
        <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#A83F12]">
            <Sparkles size={11} className="fill-[#A83F12]" />
            <span>Why Visit {info.country_name}</span>
          </div>

          <h2 className="mt-3.5 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-950">
            {title}
          </h2>

          <p className="mt-2.5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Reason Cards Grid matching CMS inputs */}
        {reasons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {reasons.map((reason, idx) => {
              const imgSrc = reason.image?.trim();

              return (
                <div
                  key={reason.id || idx}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-200 hover:shadow-md"
                >
                  <div>
                    {/* Visual Photo */}
                    <div className="relative h-48 w-full overflow-hidden rounded-xl bg-slate-100">
                      <img
                        src={imgSrc || "/images/tour-card-fallback.jpg"}
                        alt={reason.title}
                        onError={(event) => {
                          event.currentTarget.src = "/images/tour-card-fallback.jpg";
                        }}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      {reason.badge && (
                        <div className="absolute top-3 left-3">
                          <span className="inline-block rounded-full bg-slate-950/85 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                            {reason.badge}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-[#A83F12] transition">
                      {reason.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-700 font-normal leading-relaxed">
                      {reason.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
