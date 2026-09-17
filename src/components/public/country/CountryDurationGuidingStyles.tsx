"use client";

import React from "react";
import Link from "next/link";
import {
  LuClock as Clock,
  LuCompass as Compass,
  LuCalendar as Calendar,
  LuGlobe as Globe,
  LuUsers as Users,
  LuShieldCheck as ShieldCheck,
  LuHeartHandshake as HeartHandshake,
  LuCheck as Check,
  LuArrowRight as ArrowRight,
} from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryDurationGuidingStylesProps {
  info: CountryDestinationInfo;
  onSelectDuration?: (durationTag: "short" | "medium" | "long" | "epic") => void;
}

export default function CountryDurationGuidingStyles({
  info,
  onSelectDuration,
}: CountryDurationGuidingStylesProps) {
  const handleDurationClick = (
    e: React.MouseEvent,
    tag: "short" | "medium" | "long" | "epic",
  ) => {
    e.preventDefault();
    onSelectDuration?.(tag);
    const el = document.getElementById("section-tours");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTours = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("section-tours");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-white text-slate-900">
      {/* ── Section 1: Find your perfect duration ── */}
      <section className="py-12 sm:py-16 border-b border-slate-100">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
          <div className="text-left mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Find your perfect duration
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Expertly planned itineraries help you make the most of every day.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: 2-6 Days (Blue) */}
            <div className="group flex flex-col justify-between overflow-hidden rounded-2xl shadow-2xs transition hover:-translate-y-1 hover:shadow-md">
              <div className="rounded-t-2xl bg-[#4387F6] p-5 text-white flex flex-col justify-between h-[155px]">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    Quick Escape
                  </span>
                  <span className="rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    100 trips
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <span className="block text-[11px] font-medium text-white/80">2-6 Days</span>
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white">2-6</span>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white">
                    <Clock size={18} />
                  </div>
                </div>
              </div>

              <div className="rounded-b-2xl bg-white p-5 border border-t-0 border-slate-100 shadow-xs flex flex-col justify-between min-h-[115px]">
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  See the highlights of {info.country_name} in one week
                </p>
                <a
                  href="#section-tours"
                  onClick={(e) => handleDurationClick(e, "short")}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#132c50] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition w-fit cursor-pointer"
                >
                  <span>Explore</span>
                  <ArrowRight size={12} />
                </a>
              </div>
            </div>

            {/* Card 2: 7-10 Days (Mint Green) */}
            <div className="group flex flex-col justify-between overflow-hidden rounded-2xl shadow-2xs transition hover:-translate-y-1 hover:shadow-md">
              <div className="rounded-t-2xl bg-[#7FE1C3] p-5 text-slate-900 flex flex-col justify-between h-[155px]">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-black/10 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-semibold text-slate-900">
                    Classic Journey
                  </span>
                  <span className="rounded-full bg-black/10 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-semibold text-slate-900">
                    167 trips
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <span className="block text-[11px] font-medium text-slate-800/80">7-10 Days</span>
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">7-10</span>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/10 text-slate-900">
                    <Compass size={18} />
                  </div>
                </div>
              </div>

              <div className="rounded-b-2xl bg-white p-5 border border-t-0 border-slate-100 shadow-xs flex flex-col justify-between min-h-[115px]">
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Discover {info.country_name} in 7-10 days
                </p>
                <a
                  href="#section-tours"
                  onClick={(e) => handleDurationClick(e, "medium")}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#132c50] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition w-fit cursor-pointer"
                >
                  <span>Explore</span>
                  <ArrowRight size={12} />
                </a>
              </div>
            </div>

            {/* Card 3: 11-14 Days (Yellow) */}
            <div className="group flex flex-col justify-between overflow-hidden rounded-2xl shadow-2xs transition hover:-translate-y-1 hover:shadow-md">
              <div className="rounded-t-2xl bg-[#FEE387] p-5 text-slate-900 flex flex-col justify-between h-[155px]">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-black/10 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-semibold text-slate-900">
                    Grand Trips
                  </span>
                  <span className="rounded-full bg-black/10 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-semibold text-slate-900">
                    61 trips
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <span className="block text-[11px] font-medium text-slate-800/80">11-14 Days</span>
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">11-14</span>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/10 text-slate-900">
                    <Calendar size={18} />
                  </div>
                </div>
              </div>

              <div className="rounded-b-2xl bg-white p-5 border border-t-0 border-slate-100 shadow-xs flex flex-col justify-between min-h-[115px]">
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Do more and see more of {info.country_name}
                </p>
                <a
                  href="#section-tours"
                  onClick={(e) => handleDurationClick(e, "long")}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#132c50] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition w-fit cursor-pointer"
                >
                  <span>Explore</span>
                  <ArrowRight size={12} />
                </a>
              </div>
            </div>

            {/* Card 4: 15+ Days (Coral/Orange) */}
            <div className="group flex flex-col justify-between overflow-hidden rounded-2xl shadow-2xs transition hover:-translate-y-1 hover:shadow-md">
              <div className="rounded-t-2xl bg-[#FFA884] p-5 text-white flex flex-col justify-between h-[155px]">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    Epic Adventure
                  </span>
                  <span className="rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    60 trips
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <span className="block text-[11px] font-medium text-white/80">15+ Days</span>
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white">15+</span>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white">
                    <Globe size={18} />
                  </div>
                </div>
              </div>

              <div className="rounded-b-2xl bg-white p-5 border border-t-0 border-slate-100 shadow-xs flex flex-col justify-between min-h-[115px]">
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Epic {info.country_name} adventures to remember
                </p>
                <a
                  href="#section-tours"
                  onClick={(e) => handleDurationClick(e, "epic")}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#132c50] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition w-fit cursor-pointer"
                >
                  <span>Explore</span>
                  <ArrowRight size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Choose your guiding style ── */}
      <section className="py-12 sm:py-16 border-b border-slate-100">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Choose your guiding style
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              From intimate small groups to bespoke private adventures in {info.country_name}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Style 1: Classic Group Tours */}
            <div className="flex flex-col justify-between rounded-[22px] border border-slate-200/90 bg-white p-6 shadow-2xs transition hover:border-slate-300 hover:shadow-md">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                  <Users size={20} />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-950">
                  Classic Group Tours
                </h3>
                <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed">
                  Sociable tours with like-minded travellers covering iconic highlights with unbeatable value.
                </p>

                <ul className="mt-4 space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-sky-600 shrink-0" />
                    <span>Fixed guaranteed departures</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-sky-600 shrink-0" />
                    <span>Dedicated licensed tour leader</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-sky-600 shrink-0" />
                    <span>Best value group pricing</span>
                  </li>
                </ul>
              </div>

              <a
                href="#section-tours"
                onClick={scrollToTours}
                className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 py-2.5 text-xs font-bold text-slate-800 transition cursor-pointer"
              >
                <span>View tours</span>
                <ArrowRight size={12} />
              </a>
            </div>

            {/* Style 2: Small Group Adventures */}
            <div className="flex flex-col justify-between rounded-[22px] border border-slate-200/90 bg-white p-6 shadow-2xs transition hover:border-slate-300 hover:shadow-md">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Compass size={20} />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-950">
                  Small Group Adventures
                </h3>
                <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed">
                  Intimate groups of 12-16 people exploring off-the-beaten-path trails and secret viewpoints.
                </p>

                <ul className="mt-4 space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-emerald-600 shrink-0" />
                    <span>Max 16 travellers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-emerald-600 shrink-0" />
                    <span>More authentic local encounters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-emerald-600 shrink-0" />
                    <span>Flexible pace &amp; hidden gems</span>
                  </li>
                </ul>
              </div>

              <a
                href="#section-tours"
                onClick={scrollToTours}
                className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 py-2.5 text-xs font-bold text-slate-800 transition cursor-pointer"
              >
                <span>View tours</span>
                <ArrowRight size={12} />
              </a>
            </div>

            {/* Style 3: Private Guided Tours */}
            <div className="flex flex-col justify-between rounded-[22px] border border-slate-200/90 bg-white p-6 shadow-2xs transition hover:border-slate-300 hover:shadow-md">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-950">
                  Private Guided Tours
                </h3>
                <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed">
                  Travel exclusively with your party and a dedicated vehicle, private driver, and local guide.
                </p>

                <ul className="mt-4 space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-indigo-600 shrink-0" />
                    <span>Your own private vehicle &amp; guide</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-indigo-600 shrink-0" />
                    <span>Customizable daily schedule</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-indigo-600 shrink-0" />
                    <span>Ideal for families &amp; couples</span>
                  </li>
                </ul>
              </div>

              <a
                href="#section-tours"
                onClick={scrollToTours}
                className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 py-2.5 text-xs font-bold text-slate-800 transition cursor-pointer"
              >
                <span>View tours</span>
                <ArrowRight size={12} />
              </a>
            </div>

            {/* Style 4: Tailor-Made Holidays */}
            <div className="flex flex-col justify-between rounded-[22px] border border-slate-200/90 bg-white p-6 shadow-2xs transition hover:border-slate-300 hover:shadow-md">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#E16B2D]">
                  <HeartHandshake size={20} />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-950">
                  Tailor-Made Holidays
                </h3>
                <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed">
                  A fully bespoke itinerary crafted from scratch around your dream destinations and luxury level.
                </p>

                <ul className="mt-4 space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#E16B2D] shrink-0" />
                    <span>100% bespoke to your schedule</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#E16B2D] shrink-0" />
                    <span>Choose your boutique hotels</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#E16B2D] shrink-0" />
                    <span>Dedicated trip designer</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/contact"
                className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0A1128] hover:bg-slate-850 py-2.5 text-xs font-bold text-white transition shadow-xs"
              >
                <span>Request quote</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
