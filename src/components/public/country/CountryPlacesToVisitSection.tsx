"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  LuMapPin as MapPin,
  LuSparkles as Sparkles,
  LuCheck as Check,
  LuCompass as Compass,
  LuArrowRight as ArrowRight,
  LuEye as Eye,
} from "react-icons/lu";
import { CountryDestinationInfo, PlaceToVisit } from "@/lib/types/countryDestination";

export interface CountryPlacesToVisitSectionProps {
  info: CountryDestinationInfo;
  onSelectPlaceFilter?: (placeName: string) => void;
}

export default function CountryPlacesToVisitSection({
  info,
  onSelectPlaceFilter,
}: CountryPlacesToVisitSectionProps) {
  const { best_places_to_visit } = info;
  const places = best_places_to_visit.places || [];
  const [activeModalPlace, setActiveModalPlace] = useState<PlaceToVisit | null>(null);

  if (!places.length) return null;

  return (
    <section id="section-places" className="py-14 sm:py-20 bg-slate-50/70 border-b border-slate-100">
      <div className="mx-auto max-w-[1380px] px-5">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#E4572E]">
            <Compass size={12} className="text-[#E4572E]" />
            <span>Top Highlights & Iconic Regions</span>
          </div>

          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight">
            {best_places_to_visit.headline || `Best Places to Visit in ${info.country_name}`}
          </h2>

          <p className="mt-2.5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            {best_places_to_visit.subtitle ||
              `Discover the most celebrated destinations, heritage landmarks, and breathtaking landscapes across ${info.country_name}.`}
          </p>
        </div>

        {/* Places Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place, idx) => {
            const fallbackImg =
              "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80";
            const imgSrc = place.image && place.image.trim().length > 0 ? place.image : fallbackImg;

            return (
              <div
                key={place.id || place.name || idx}
                className="group flex flex-col justify-between overflow-hidden rounded-[22px] border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                    <Image
                      src={imgSrc}
                      alt={place.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      unoptimized={imgSrc.startsWith("http")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                    {/* Tag badge */}
                    {place.tag && (
                      <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
                        <MapPin size={11} className="text-[#E4572E]" />
                        <span>{place.tag}</span>
                      </div>
                    )}

                    {/* Best For pill */}
                    {place.best_for && (
                      <div className="absolute top-3.5 right-3.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-800 shadow-xs backdrop-blur-md">
                        {place.best_for}
                      </div>
                    )}

                    {/* Place Name over gradient */}
                    <div className="absolute bottom-3.5 left-4 right-4">
                      <h3 className="text-xl font-black text-white drop-shadow-sm tracking-tight">
                        {place.name}
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {place.description}
                    </p>

                    {/* Highlights list */}
                    {place.highlights && place.highlights.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          <Sparkles size={11} className="text-[#E4572E]" />
                          <span>Must-See Highlights</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {place.highlights.map((hl, hIdx) => (
                            <span
                              key={hIdx}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100/90 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-orange-50 hover:text-[#E4572E] transition-colors"
                            >
                              <Check size={10} className="text-emerald-500 stroke-[3]" />
                              {hl}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0 mt-auto">
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveModalPlace(place)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors"
                    >
                      <Eye size={13} />
                      <span>Quick View</span>
                    </button>

                    <a
                      href="#section-tours"
                      onClick={() => onSelectPlaceFilter?.(place.name)}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#E4572E]"
                    >
                      <span>Find Tours</span>
                      <ArrowRight size={12} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Place Detail Modal */}
      {activeModalPlace && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveModalPlace(null)}
        >
          <div
            className="relative max-w-xl w-full rounded-[24px] bg-white overflow-hidden shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 w-full bg-slate-900">
              <Image
                src={
                  activeModalPlace.image ||
                  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80"
                }
                alt={activeModalPlace.name}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <button
                type="button"
                onClick={() => setActiveModalPlace(null)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#E4572E] bg-white/90 px-2 py-0.5 rounded-full inline-block mb-1">
                  {activeModalPlace.tag}
                </span>
                <h3 className="text-2xl font-black">{activeModalPlace.name}</h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-700 leading-relaxed">
                {activeModalPlace.description}
              </p>

              {activeModalPlace.highlights?.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Key Highlights
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeModalPlace.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-lg bg-orange-50 border border-orange-200/60 px-2.5 py-1 text-xs font-semibold text-orange-950"
                      >
                        <Check size={12} className="text-[#E4572E]" />
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModalPlace(null)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <a
                  href="#section-tours"
                  onClick={() => {
                    onSelectPlaceFilter?.(activeModalPlace.name);
                    setActiveModalPlace(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#E4572E] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#c24118] transition"
                >
                  <span>View Tours for {activeModalPlace.name}</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
