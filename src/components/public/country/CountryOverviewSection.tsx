"use client";

import React from "react";
import { LuSparkles as Sparkles } from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryOverviewSectionProps {
  info: CountryDestinationInfo;
}

export default function CountryOverviewSection({ info }: CountryOverviewSectionProps) {
  if (!info.overview_narrative) return null;

  const paragraphs = info.overview_narrative
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section id="section-overview" className="border-b border-slate-100 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-[1180px] px-5">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-pub-accent">
            <Sparkles size={11} className="fill-pub-accent" />
            <span>Overview &amp; Narrative</span>
          </div>

          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-950">
            Discover {info.country_name}
          </h2>

          {info.tagline && (
            <p className="mt-2 text-sm sm:text-base font-semibold text-slate-500">
              {info.tagline}
            </p>
          )}
        </div>

        <div className="mt-8 mx-auto max-w-3xl space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 font-normal">
          {paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
