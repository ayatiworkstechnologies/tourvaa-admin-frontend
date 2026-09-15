"use client";

/* eslint-disable @next/next/no-img-element */

import React from "react";
import {
  LuMapPin as MapPin,
  LuArrowRight as ArrowRight,
} from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryPlacesToVisitSectionProps {
  info: CountryDestinationInfo;
  onSelectPlaceFilter?: (placeName: string) => void;
}

export default function CountryPlacesToVisitSection({
  info,
  onSelectPlaceFilter,
}: CountryPlacesToVisitSectionProps) {
  const { best_places_to_visit } = info;
  const places = (best_places_to_visit?.places || []).slice(0, 4);

  if (!places.length) return null;

  return (
    <section id="section-places" className="py-10 sm:py-14 bg-white border-b border-slate-100">
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-left mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            {best_places_to_visit.headline || `Places to Visit in ${info.country_name}`}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
            {best_places_to_visit.subtitle ||
              `Key highlights and iconic destinations you must see during your trip.`}
          </p>
        </div>

        {/* 4 Places in a Single Horizontal Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {places.map((place, idx) => {
            const fallbackImg =
              "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80";
            const imgSrc = place.image && place.image.trim().length > 0 ? place.image : fallbackImg;

            return (
              <div
                key={place.id || place.name || idx}
                onClick={() => onSelectPlaceFilter?.(place.name)}
                className="group flex flex-col justify-between overflow-hidden rounded-[20px] border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg cursor-pointer"
              >
                <div>
                  {/* Photo with rounded-xl */}
                  <div className="relative h-44 w-full overflow-hidden rounded-[14px] bg-slate-100">
                    <img
                      src={imgSrc}
                      alt={place.name}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                    />
                    {place.tag && (
                      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        <MapPin size={10} className="text-[#E4572E]" />
                        <span>{place.tag}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Description below photo */}
                  <h3 className="mt-3.5 text-base font-bold text-slate-900 tracking-tight group-hover:text-sky-700 transition">
                    {place.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                    {place.description}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-700 group-hover:text-sky-700 transition">
                  <span>Explore tours</span>
                  <ArrowRight size={12} className="transition group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
