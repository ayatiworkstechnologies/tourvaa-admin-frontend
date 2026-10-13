"use client";

import React from "react";
import { LuSparkles as Sparkles } from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryOverviewSectionProps {
  info: CountryDestinationInfo;
}

export default function CountryOverviewSection({ info }: CountryOverviewSectionProps) {
  const quickFacts = [
    ["Capital", info.quick_facts.capital],
    ["Currency", info.quick_facts.currency],
    ["Languages", info.quick_facts.languages],
    ["Time zone", info.quick_facts.timezone],
    ["Ideal trip", info.quick_facts.ideal_duration],
    ["Dialling code", info.quick_facts.dialing_code],
  ].filter(([, value]) => Boolean(value));

  return (
    <section id="section-overview" className="border-b border-slate-100 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-[1180px] px-5">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-pub-accent">
              <Sparkles size={12} className="fill-pub-accent" />
              <span>About this destination</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Discover {info.country_name}
            </h2>
            <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
              {info.overview_narrative}
            </p>
          </div>

          {quickFacts.length > 0 && (
            <dl className="grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 sm:grid-cols-2">
              {quickFacts.map(([label, value]) => (
                <div key={label} className="border-b border-slate-200 p-4 sm:border-r">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
