"use client";

/* eslint-disable @next/next/no-img-element */

import React from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCalendar as Calendar,
  LuCar as Car,
  LuChevronRight as ChevronRight,
  LuClock as Clock,
  LuCoins as Coins,
  LuHouse as Home,
  LuLandmark as Landmark,
  LuLanguages as Languages,
  LuPhone as Phone,
  LuSparkles as Sparkles,
  LuZap as Zap,
} from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryDestinationHeroProps {
  info: CountryDestinationInfo;
  tourCount?: number;
}

export default function CountryDestinationHero({
  info,
  tourCount = 0,
}: CountryDestinationHeroProps) {
  const scrollToSection = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const quickFacts = [
    { label: "Capital City", value: info.quick_facts?.capital, icon: Landmark },
    { label: "Currency", value: info.quick_facts?.currency, icon: Coins },
    { label: "Languages", value: info.quick_facts?.languages, icon: Languages },
    { label: "Timezone", value: info.quick_facts?.timezone, icon: Clock },
    { label: "Ideal Duration", value: info.quick_facts?.ideal_duration, icon: Calendar },
    { label: "Plugs / Power", value: info.quick_facts?.plug_types, icon: Zap },
    { label: "Dialing Code", value: info.quick_facts?.dialing_code, icon: Phone },
    { label: "Driving Side", value: info.quick_facts?.driving_side, icon: Car },
  ].filter((item) => Boolean(item.value));

  const heroImageSrc = info.hero_image?.trim();

  return (
    <section className="bg-white pb-8 pt-4 text-slate-900 border-b border-slate-100">
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="inline-flex items-center gap-1 transition hover:text-slate-900">
            <Home size={13} className="text-slate-400" />
            <span>Home</span>
          </Link>
          <ChevronRight size={12} className="text-slate-300" />
          <Link href="/destinations" className="transition hover:text-slate-900">
            Destinations
          </Link>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="font-bold text-slate-900">{info.country_name}</span>
        </nav>

        {/* ── Split Hero Layout matching User Specification ── */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Title, Tagline, Narrative & CTAs */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Tagline / Eyebrow */}
            <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-orange-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-pub-accent">
              <Sparkles size={11} className="fill-pub-accent" />
              <span>{info.tagline || "AN INTRODUCTION"}</span>
            </div>

            {/* Main Destination Heading */}
            <h1 className="mt-3.5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              {info.hero_title || info.country_name}
            </h1>

            {/* Subtitle / Summary Narrative */}
            <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
              {info.hero_subtitle ||
                info.overview_narrative ||
                `Explore ${info.country_name} with confidence, context, and carefully planned journeys.`}
            </p>

            {/* Interactive CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#section-tours"
                onClick={scrollToSection("section-tours")}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-95"
              >
                <span>Explore Tours</span>
                <ArrowRight size={14} />
              </a>

              <a
                href="#section-when-to-go"
                onClick={scrollToSection("section-when-to-go")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
              >
                <span>Best time to visit</span>
              </a>

              {tourCount > 0 && (
                <span className="text-xs font-semibold text-slate-400 ml-1">
                  ({tourCount} experiences available)
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          {heroImageSrc && <div className="lg:col-span-5">
            <div className="relative h-[280px] sm:h-[360px] lg:h-[380px] w-full overflow-hidden rounded-[24px] bg-slate-100 shadow-sm border border-slate-100">
              <img
                src={heroImageSrc}
                alt={`${info.country_name} showcase`}
                className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>}
        </div>

        {/* ── Quick Facts Strip (Rendered at Base of Hero) ── */}
        {quickFacts.length > 0 && (
          <div className="mt-10 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Quick Facts Snapshot
              </p>
              <span className="text-[11px] font-semibold text-slate-400">
                {info.country_name} Travel Basics
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {quickFacts.map((fact) => {
                const Icon = fact.icon;
                return (
                  <div
                    key={fact.label}
                    className="flex flex-col justify-between rounded-xl bg-white p-3 border border-slate-100 shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Icon size={12} className="shrink-0 text-slate-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                        {fact.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-bold text-slate-900 line-clamp-2">
                      {fact.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
