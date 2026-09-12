"use client";

import React, { useState } from "react";
import {
  LuCalendar as Calendar,
  LuCloudRain as CloudRain,
  LuSparkles as Sparkles,
  LuSun as Sun,
  LuThermometer as Thermometer,
  LuUsers as Users,
  LuZap as Zap,
} from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryWhenToGoSectionProps {
  info: CountryDestinationInfo;
}

export default function CountryWhenToGoSection({ info }: CountryWhenToGoSectionProps) {
  const [unit, setUnit] = useState<"C" | "F">("C");
  const { best_time_to_visit, monsoon_info, temperature_info } = info;
  const { peak_season, shoulder_season, low_season } = best_time_to_visit;
  const monthlyData = temperature_info.monthly_weather || [];

  return (
    <section id="section-best-time" className="py-12 sm:py-16 bg-white border-b border-slate-100">
      <div className="mx-auto max-w-[1380px] px-5">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#E4572E]">
            <Calendar size={12} className="fill-[#E4572E]" />
            <span>Climate & Timing Guide</span>
          </div>

          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight">
            Best Time to Visit {info.country_name}
          </h2>

          <p className="mt-2.5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            {best_time_to_visit.summary}
          </p>
        </div>

        {/* ── 1. The 3 Seasons Cards ── */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Peak Season */}
          <div className="flex flex-col justify-between rounded-[22px] border-2 border-emerald-500/30 bg-emerald-50/40 p-6 text-left shadow-xs transition hover:border-emerald-500 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                  <Sun size={12} /> {peak_season.label}
                </span>
                <span className="text-xs font-bold text-emerald-800">Ideal Climate</span>
              </div>

              <h3 className="mt-4 text-xl font-extrabold text-slate-950">
                {peak_season.months}
              </h3>

              <p className="mt-2 text-xs sm:text-sm font-semibold text-emerald-900 leading-snug">
                {peak_season.weather}
              </p>

              <p className="mt-3 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {peak_season.description}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-emerald-200/60 pt-4 text-xs">
              <span className="flex items-center gap-1 font-semibold text-slate-600">
                <Users size={13} className="text-emerald-700" /> Crowds: <strong className="text-slate-900">{peak_season.crowds}</strong>
              </span>
              <span className="font-semibold text-slate-600">
                Prices: <strong className="text-slate-900">{peak_season.price_level}</strong>
              </span>
            </div>
          </div>

          {/* Shoulder Season */}
          <div className="flex flex-col justify-between rounded-[22px] border-2 border-amber-500/30 bg-amber-50/40 p-6 text-left shadow-xs transition hover:border-amber-500 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                  <Sparkles size={12} /> {shoulder_season.label}
                </span>
                <span className="text-xs font-bold text-amber-800">Great Value</span>
              </div>

              <h3 className="mt-4 text-xl font-extrabold text-slate-950">
                {shoulder_season.months}
              </h3>

              <p className="mt-2 text-xs sm:text-sm font-semibold text-amber-900 leading-snug">
                {shoulder_season.weather}
              </p>

              <p className="mt-3 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {shoulder_season.description}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-amber-200/60 pt-4 text-xs">
              <span className="flex items-center gap-1 font-semibold text-slate-600">
                <Users size={13} className="text-amber-700" /> Crowds: <strong className="text-slate-900">{shoulder_season.crowds}</strong>
              </span>
              <span className="font-semibold text-slate-600">
                Prices: <strong className="text-slate-900">{shoulder_season.price_level}</strong>
              </span>
            </div>
          </div>

          {/* Low / Monsoon Season */}
          <div className="flex flex-col justify-between rounded-[22px] border-2 border-sky-500/30 bg-sky-50/40 p-6 text-left shadow-xs transition hover:border-sky-500 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                  <CloudRain size={12} /> {low_season.label}
                </span>
                <span className="text-xs font-bold text-sky-800">Low Crowds</span>
              </div>

              <h3 className="mt-4 text-xl font-extrabold text-slate-950">
                {low_season.months}
              </h3>

              <p className="mt-2 text-xs sm:text-sm font-semibold text-sky-900 leading-snug">
                {low_season.weather}
              </p>

              <p className="mt-3 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {low_season.description}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-sky-200/60 pt-4 text-xs">
              <span className="flex items-center gap-1 font-semibold text-slate-600">
                <Users size={13} className="text-sky-700" /> Crowds: <strong className="text-slate-900">{low_season.crowds}</strong>
              </span>
              <span className="font-semibold text-slate-600">
                Prices: <strong className="text-slate-900">{low_season.price_level}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. Monsoon & Climate Nuances Card ── */}
        <div className="mt-10 rounded-[22px] border border-slate-200/80 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 lg:p-10 text-white shadow-lg text-left">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-sky-300">
                <CloudRain size={13} />
                <span>Monsoon & Seasonal Insights</span>
              </div>

              <h3 className="mt-3 text-xl sm:text-2xl font-extrabold text-white">
                {monsoon_info.headline || `Monsoon & Rainfall Patterns`}
              </h3>

              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-300 font-medium">
                {monsoon_info.monsoon_overview}
              </p>

              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300/90 font-medium">
                {monsoon_info.rainfall_schedule}
              </p>

              {monsoon_info.cyclone_or_extreme_note && (
                <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200 leading-relaxed font-medium">
                  <strong>Traveler Advisory:</strong> {monsoon_info.cyclone_or_extreme_note}
                </div>
              )}
            </div>

            {/* Regional Variations Strip */}
            {monsoon_info.regional_variations && monsoon_info.regional_variations.length > 0 && (
              <div className="w-full md:w-80 shrink-0 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 backdrop-blur-md">
                <p className="text-xs font-black uppercase tracking-wider text-white/80">Regional Weather Nuances</p>
                <div className="divide-y divide-white/10">
                  {monsoon_info.regional_variations.map((reg, idx) => (
                    <div key={idx} className="py-2.5 first:pt-1 last:pb-0 text-left">
                      <strong className="block text-xs text-[#E4572E]">{reg.region}</strong>
                      <span className="mt-0.5 block text-[11px] text-white/80 leading-relaxed">{reg.climate_note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. 12-Month Interactive Climate Matrix ── */}
        {monthlyData.length > 0 && (
          <div className="mt-12 rounded-[22px] border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 text-left">
              <div>
                <div className="flex items-center gap-2">
                  <Thermometer size={18} className="text-[#E4572E]" />
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-950">
                    {temperature_info.headline || "Month-by-Month Temperature & Rainfall Guide"}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  {temperature_info.climate_overview}
                </p>
              </div>

              {/* Temperature Unit Switcher (°C / °F) */}
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setUnit("C")}
                  className={`rounded-lg px-3 py-1 text-xs font-black transition cursor-pointer ${
                    unit === "C" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  °C (Celsius)
                </button>
                <button
                  type="button"
                  onClick={() => setUnit("F")}
                  className={`rounded-lg px-3 py-1 text-xs font-black transition cursor-pointer ${
                    unit === "F" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  °F (Fahrenheit)
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="no-scrollbar mt-6 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-3">Month</th>
                    <th className="py-3 px-3">Avg High</th>
                    <th className="py-3 px-3">Avg Low</th>
                    <th className="py-3 px-3">Rainy Days</th>
                    <th className="py-3 px-3">Season Status</th>
                    <th className="py-3 px-3">Travel Highlight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {monthlyData.map((m) => {
                    const isPeak = m.recommendation === "Peak";
                    const isGood = m.recommendation === "Good";
                    const isShoulder = m.recommendation === "Shoulder";

                    const badgeColor = isPeak
                      ? "bg-emerald-100 text-emerald-800"
                      : isGood
                      ? "bg-teal-100 text-teal-800"
                      : isShoulder
                      ? "bg-amber-100 text-amber-800"
                      : "bg-sky-100 text-sky-800";

                    return (
                      <tr key={m.month} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {m.full_month} ({m.month})
                        </td>
                        <td className="py-3 px-3 font-black text-[#E4572E]">
                          {unit === "C" ? `${m.avg_high_c}°C` : `${m.avg_high_f}°F`}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-500">
                          {unit === "C" ? `${m.avg_low_c}°C` : `${m.avg_low_f}°F`}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <CloudRain size={12} className="text-sky-500" />
                            {m.rainfall_days} day{m.rainfall_days === 1 ? "" : "s"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black ${badgeColor}`}>
                            {m.recommendation}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                          {m.highlight}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
