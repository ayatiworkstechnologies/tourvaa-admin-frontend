"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import {
  LuSun as Sun,
  LuLeaf as Leaf,
  LuCloudSnow as CloudSnow,
  LuSparkles as Sparkles,
  LuInfo as Info,
  LuThermometer as Thermometer,
} from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryWhenToGoSectionProps {
  info: CountryDestinationInfo;
  onSelectSeason?: (season: string) => void;
}

export default function CountryWhenToGoSection({
  info,
  onSelectSeason,
}: CountryWhenToGoSectionProps) {
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [showMonthlyMatrix, setShowMonthlyMatrix] = useState<boolean>(false);

  const scrollToTours = (e: React.MouseEvent, seasonName: string) => {
    e.preventDefault();
    onSelectSeason?.(seasonName);
    const el = document.getElementById("section-tours");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const seasonsData = [
    {
      id: "spring",
      name: "Spring",
      months: "Mar - May",
      tempC: "12°C - 22°C",
      tempF: "54°F - 72°F",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: Leaf,
      image:
        "https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=800&q=80",
      description:
        "Pleasant temperatures, blooming flora, and ideal conditions for walking ancient pathways, river cruises, and garden tours.",
    },
    {
      id: "summer",
      name: "Summer",
      months: "Jun - Aug",
      tempC: "24°C - 33°C",
      tempF: "75°F - 91°F",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Sun,
      image:
        "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=80",
      description:
        "Warm, vibrant, and lush. Perfect for highland plateaus and western regions, though lowland city days can be warm and humid.",
    },
    {
      id: "autumn",
      name: "Autumn",
      months: "Sep - Nov",
      tempC: "14°C - 24°C",
      tempF: "57°F - 75°F",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      icon: Sparkles,
      image:
        "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80",
      description:
        "Widely considered the golden travel season with clear crisp skies, comfortable weather, and spectacular autumn foliage across valleys.",
    },
    {
      id: "winter",
      name: "Winter",
      months: "Dec - Feb",
      tempC: "-5°C - 8°C",
      tempF: "23°F - 46°F",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon: CloudSnow,
      image:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
      description:
        "Crisp days in the north featuring magical ice festivals, while the south stays comfortably mild. Fewest tourist crowds and superior value.",
    },
  ];

  const monthlyData = info.temperature_info?.monthly_weather || [];

  return (
    <section id="section-when-to-go" className="bg-white text-slate-900 py-10 sm:py-16">
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
        {/* ── 8. Panoramic Feature Banner with Floating White Card ── */}
        <div className="relative min-h-[380px] sm:min-h-[440px] w-full overflow-hidden rounded-[26px] bg-slate-950 p-6 sm:p-12 flex items-center justify-center shadow-lg mb-14 sm:mb-20">
          {/* Panoramic Background Photo */}
          <img
            src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=80"
            alt="Futuristic Skyline and Landmark"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-70 scale-102 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

          {/* Centered Floating White Card matching screenshot */}
          <div className="relative z-10 w-full max-w-2xl rounded-[24px] border border-white/40 bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-2xl text-center">
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              When is the best time to visit {info.country_name}?
            </h3>

            <p className="mt-2.5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xl mx-auto">
              {info.best_time_to_visit?.summary ||
                `The best time to visit ${info.country_name} is during spring (April to May) and autumn (September to October) when pleasant temperatures and dry, clear skies prevail across most regions. Summer brings warmer days and lush landscapes, while winter offers crisp scenic beauty and fewer crowds.`}
            </p>

            {/* Inset Landmark Visual Framing inside Card */}
            <div className="mt-5 overflow-hidden rounded-[18px] border border-slate-100 bg-slate-100 shadow-inner">
              <img
                src="https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1000&q=80"
                alt="Iconic Landmark Architecture"
                className="h-44 sm:h-52 w-full object-cover object-center transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* ── 9. "When to travel to {Country}" Section ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div className="max-w-md">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              When to travel to {info.country_name}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-xl text-left lg:text-right">
            From the golden hues of autumn to the blooming cherry blossoms of spring, {info.country_name}&apos;s vast landscapes offer distinct wonders throughout each season. Plan your adventure around these seasonal highlights.
          </p>
        </div>

        {/* 4 Quarterly Season Cards in 1 Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {seasonsData.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className="flex flex-col justify-between overflow-hidden rounded-[22px] border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-300 hover:border-slate-300 hover:shadow-md hover:-translate-y-1"
              >
                <div>
                  {/* Photo with rounded-[14px] */}
                  <div className="relative h-36 w-full overflow-hidden rounded-[14px] bg-slate-100">
                    <img
                      src={s.image}
                      alt={s.name}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-106"
                    />
                    <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-slate-900 shadow-2xs">
                      <Icon size={11} className="text-[#E4572E]" />
                      <span>{s.months}</span>
                    </div>
                  </div>

                  {/* Season Name & Temperature Range */}
                  <div className="mt-3.5 flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {s.name}
                    </h3>
                    <span className="text-xs font-black text-[#E4572E]">
                      {unit === "C" ? s.tempC : s.tempF}
                    </span>
                  </div>

                  {/* Season Description */}
                  <p className="mt-1.5 text-xs text-slate-500 font-medium leading-relaxed">
                    {s.description}
                  </p>
                </div>

                {/* Pill Button matching screenshot */}
                <a
                  href="#section-tours"
                  onClick={(e) => scrollToTours(e, s.name)}
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-[#0A1128] hover:bg-slate-850 px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                >
                  <span>View tours</span>
                </a>
              </div>
            );
          })}
        </div>

        {/* Tip Callout Bar matching screenshot */}
        <div className="mt-6 flex items-start sm:items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-3.5 text-slate-700">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#E4572E]">
            <Info size={15} />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
            <strong className="text-slate-900 font-bold">Tip:</strong> For the best balance of comfortable weather and vibrant scenery, plan your visit during Spring (April–May) or Autumn (September–October).
          </p>
        </div>

        {/* Optional Toggle for Month-by-Month Matrix */}
        {monthlyData.length > 0 && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShowMonthlyMatrix(!showMonthlyMatrix)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition shadow-2xs"
            >
              <Thermometer size={13} className="text-[#E4572E]" />
              <span>{showMonthlyMatrix ? "Hide Month-by-Month Guide" : "View Complete Month-by-Month Weather Guide"}</span>
            </button>

            {showMonthlyMatrix && (
              <div className="mt-6 rounded-[22px] border border-slate-200 bg-white p-6 shadow-xs text-left">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700">
                    Average monthly temperature &amp; precipitation
                  </span>
                  <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setUnit("C")}
                      className={`rounded-lg px-2.5 py-0.5 text-xs font-bold ${unit === "C" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"}`}
                    >
                      °C
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit("F")}
                      className={`rounded-lg px-2.5 py-0.5 text-xs font-bold ${unit === "F" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"}`}
                    >
                      °F
                    </button>
                  </div>
                </div>

                <div className="no-scrollbar mt-4 overflow-x-auto">
                  <table className="w-full min-w-[650px] text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                        <th className="py-2.5 px-3">Month</th>
                        <th className="py-2.5 px-3">High</th>
                        <th className="py-2.5 px-3">Low</th>
                        <th className="py-2.5 px-3">Rainy Days</th>
                        <th className="py-2.5 px-3">Highlight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {monthlyData.map((m) => (
                        <tr key={m.month} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{m.full_month}</td>
                          <td className="py-2.5 px-3 font-bold text-[#E4572E]">
                            {unit === "C" ? `${m.avg_high_c}°C` : `${m.avg_high_f}°F`}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {unit === "C" ? `${m.avg_low_c}°C` : `${m.avg_low_f}°F`}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{m.rainfall_days} days</td>
                          <td className="py-2.5 px-3 text-slate-600">{m.highlight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
