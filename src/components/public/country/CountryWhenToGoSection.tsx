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
  LuChevronLeft,
  LuChevronRight,
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
        {/* ── 8. Panoramic Feature Showcase Banner matching Dubai reference ── */}
        <div className="relative min-h-[360px] sm:min-h-[440px] w-full overflow-hidden rounded-[28px] sm:rounded-[32px] bg-slate-950 p-6 sm:p-10 flex flex-col justify-between shadow-lg mb-14 sm:mb-20">
          {/* Panoramic Background Photo */}
          <img
            src={
              info.why_visit?.reasons?.[0]?.image ||
              info.hero_image ||
              "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=80"
            }
            alt={`${info.country_name} Showcase`}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-85 scale-102 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

          {/* Floating White Showcase Card in the Top Center */}
          <div className="relative z-10 w-full max-w-3xl rounded-[20px] border border-white/60 bg-white/95 backdrop-blur-md p-5 sm:p-6 shadow-xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 sm:gap-6 text-left">
              <h3 className="md:col-span-5 text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {info.why_visit?.reasons?.[0]?.title || info.tagline || `Iconic Wonders of ${info.country_name}`}
              </h3>
              <p className="md:col-span-7 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                {info.why_visit?.reasons?.[0]?.description ||
                  info.why_visit?.subtitle ||
                  `Step inside one of the world's most iconic landscapes and architectural wonders. Explore immersive cultural heritage, breathtaking natural vistas, and timeless traditions across ${info.country_name}.`}
              </p>
            </div>
          </div>

          {/* Carousel Left & Right Arrow Buttons */}
          <div className="relative z-10 flex items-center justify-between pointer-events-none px-2">
            <button
              type="button"
              aria-label="Previous showcase"
              className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-xs text-slate-800 shadow-md hover:bg-white transition"
            >
              <LuChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next showcase"
              className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-xs text-slate-800 shadow-md hover:bg-white transition"
            >
              <LuChevronRight size={16} />
            </button>
          </div>

          {/* Bottom Pagination Indicator Dashes */}
          <div className="relative z-10 flex items-center justify-center gap-1.5">
            <span className="h-1 w-8 rounded-full bg-white shadow-xs" />
            <span className="h-1 w-2 rounded-full bg-white/40" />
            <span className="h-1 w-2 rounded-full bg-white/40" />
          </div>
        </div>

        {/* ── 9. "When is the best time to visit {Country}?" Section ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div className="max-w-md">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              When is the best time to visit {info.country_name}?
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-xl text-left lg:text-right">
            {info.best_time_to_visit?.summary ||
              `Spring and autumn are generally the best seasons to explore ${info.country_name}, offering comfortable temperatures for sightseeing, cultural attractions, and outdoor experiences. Summer can be warm and vibrant, while winter offers crisp scenic beauty and fewer crowds.`}
          </p>
        </div>

        {/* 4 Quarterly Season Cards matching Figma layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Spring */}
          <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs transition-all duration-300 hover:border-slate-200 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Spring
                </span>
                <Leaf size={15} className="text-emerald-500" />
              </div>

              <div className="mt-3 relative h-28 sm:h-32 w-full overflow-hidden rounded-xl bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=800&q=80"
                  alt="Spring in destination"
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>

              <div className="mt-3.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Mar – May
                </h3>
                <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                  10°–24°C (50°–75°F)
                </p>
              </div>

              <p className="mt-2 text-xs text-slate-500 font-normal leading-relaxed line-clamp-3">
                Mild and pleasant, with blooming landscapes and comfortable sightseeing weather.
              </p>
            </div>

            <span className="mt-4 rounded-md bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white inline-block w-fit">
              Great time
            </span>
          </div>

          {/* Summer */}
          <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs transition-all duration-300 hover:border-slate-200 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#DF6951]">
                  <span className="h-2 w-2 rounded-full bg-[#DF6951]" />
                  Summer
                </span>
                <Sun size={15} className="text-[#DF6951]" />
              </div>

              <div className="mt-3 relative h-28 sm:h-32 w-full overflow-hidden rounded-xl bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=80"
                  alt="Summer in destination"
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>

              <div className="mt-3.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Jun – Aug
                </h3>
                <p className="text-xs font-semibold text-[#DF6951] mt-0.5">
                  22°–32°C (72°–90°F)
                </p>
              </div>

              <p className="mt-2 text-xs text-slate-500 font-normal leading-relaxed line-clamp-3">
                Hot and humid in many regions, with frequent rainfall and busy attractions.
              </p>
            </div>

            <span className="mt-4 rounded-md bg-[#DF6951] px-3 py-1 text-[11px] font-semibold text-white inline-block w-fit">
              Hot &amp; rainy
            </span>
          </div>

          {/* Autumn */}
          <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs transition-all duration-300 hover:border-slate-200 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800">
                  <span className="h-2 w-2 rounded-full bg-slate-800" />
                  Autumn
                </span>
                <Sparkles size={15} className="text-slate-700" />
              </div>

              <div className="mt-3 relative h-28 sm:h-32 w-full overflow-hidden rounded-xl bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80"
                  alt="Autumn in destination"
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>

              <div className="mt-3.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Sep – Nov
                </h3>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  10°–20°C (50°–68°F)
                </p>
              </div>

              <p className="mt-2 text-xs text-slate-500 font-normal leading-relaxed line-clamp-3">
                Pleasant temperatures, clearer skies, and colourful autumn scenery.
              </p>
            </div>

            <span className="mt-4 rounded-md bg-[#0B1F3A] px-3 py-1 text-[11px] font-semibold text-white inline-block w-fit">
              Best time
            </span>
          </div>

          {/* Winter */}
          <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs transition-all duration-300 hover:border-slate-200 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  Winter
                </span>
                <CloudSnow size={15} className="text-blue-500" />
              </div>

              <div className="mt-3 relative h-28 sm:h-32 w-full overflow-hidden rounded-xl bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80"
                  alt="Winter in destination"
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>

              <div className="mt-3.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Dec – Feb
                </h3>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">
                  -5°–10°C (23°–50°F)
                </p>
              </div>

              <p className="mt-2 text-xs text-slate-500 font-normal leading-relaxed line-clamp-3">
                Cold and dry in the north, with milder conditions across southern regions.
              </p>
            </div>

            <span className="mt-4 rounded-md bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white inline-block w-fit">
              Cold season
            </span>
          </div>
        </div>

        {/* Disclaimer Note Box matching Figma screenshot */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-xs text-slate-500 font-normal leading-relaxed">
          <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <p>
            Temperatures vary significantly across {info.country_name} because of its size. The ranges below are broad travel planning averages; northern cities are generally cooler, while southern destinations are warmer.
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
              <Thermometer size={13} className="text-[#E16B2D]" />
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
                          <td className="py-2.5 px-3 font-bold text-[#E16B2D]">
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
