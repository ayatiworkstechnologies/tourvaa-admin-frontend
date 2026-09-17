"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useRef } from "react";
import {
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
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
  const places = best_places_to_visit?.places || [];
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!places.length) return null;

  const scroll = (direction: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 300;
    el.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
  };

  return (
    <section id="section-places" className="py-10 sm:py-14 bg-white border-b border-slate-100">
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
        {/* Section Header with Title, Subtitle, and Carousel Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div className="text-left max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              {best_places_to_visit.headline || `What You'll See in ${info.country_name}`}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              {best_places_to_visit.subtitle ||
                `Discover the iconic landmarks, ancient history, and breathtaking landscapes that make ${info.country_name} a traveler's dream destination.`}
            </p>
          </div>

          {/* Carousel Arrows matching screenshot */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              aria-label="Previous places"
              onClick={() => scroll(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-95 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next places"
              onClick={() => scroll(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-95 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Places Carousel / Grid matching Figma proportions */}
        <div
          ref={scrollRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {places.slice(0, 8).map((place, idx) => {
            const fallbackImg =
              "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80";
            const imgSrc = place.image && place.image.trim().length > 0 ? place.image : fallbackImg;

            return (
              <div
                key={place.id || place.name || idx}
                onClick={() => onSelectPlaceFilter?.(place.name)}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5 sm:p-4 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-200 hover:shadow-md cursor-pointer"
              >
                <div>
                  {/* Photo with clean rounded-xl */}
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={imgSrc}
                      alt={place.name}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>

                  {/* Title & Description below photo */}
                  <h3 className="mt-3.5 text-base font-semibold text-slate-900 tracking-tight group-hover:text-[#DF6951] transition">
                    {place.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 font-normal leading-relaxed line-clamp-3">
                    {place.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
