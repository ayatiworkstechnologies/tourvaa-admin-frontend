"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuMapPin as MapPin,
  LuSquareCheckBig as SquareCheckBig,
} from "react-icons/lu";
import {
  fetchContentBlock,
  fetchFavouriteCountries,
  fetchPopularDestinations,
  FavouriteCountriesSectionBlock,
} from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import {
  CountryDestination,
  DEFAULT_FAVOURITE_COUNTRIES,
  PLACEHOLDER_IMAGE,
} from "./homeTypes";
import { destinationUrl } from "@/lib/utils/tourUrl";

const DEFAULT_TITLE = "Favourite Countries for Travellers from UK";
const DEFAULT_SUBTITLE = "Explore the destinations our UK travellers love most from sun-soaked coastlines to iconic cultural gems.";

export interface FavouriteCountriesSectionProps {
  initialDestinations?: CountryDestination[];
  title?: string;
  subtitle?: string;
}

export default function FavouriteCountriesSection({
  initialDestinations,
  title: propTitle,
  subtitle: propSubtitle,
}: FavouriteCountriesSectionProps) {
  const [destinations, setDestinations] = useState<CountryDestination[]>(
    initialDestinations || DEFAULT_FAVOURITE_COUNTRIES,
  );
  const [heading, setHeading] = useState<Partial<FavouriteCountriesSectionBlock>>({});

  useEffect(() => {
    if (propTitle || propSubtitle) return;
    let active = true;
    fetchContentBlock<FavouriteCountriesSectionBlock>("favourite_countries_section")
      .then((res) => {
        if (active && res?.data) setHeading(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [propTitle, propSubtitle]);

  const title = propTitle || heading.title || DEFAULT_TITLE;
  const subtitle = propSubtitle || heading.subtitle || DEFAULT_SUBTITLE;

  // Fast independent data loading
  useEffect(() => {
    if (initialDestinations && initialDestinations.length > 0) {
      setDestinations(initialDestinations);
      return;
    }

    let active = true;

    Promise.allSettled([
      fetchFavouriteCountries(),
      fetchPopularDestinations(),
    ]).then(([favResult, destResult]) => {
      if (!active) return;

      const curatedFavourites =
        favResult.status === "fulfilled"
          ? favResult.value.filter((r) => r.is_active !== false)
          : [];

      if (curatedFavourites.length) {
        setDestinations(
          [...curatedFavourites]
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .map((item) => ({
              name: item.title,
              badge: item.title,
              image: item.image ? mediaUrl(item.image) : PLACEHOLDER_IMAGE,
              snippet: item.snippet || "",
              href: item.href || undefined,
            })),
        );
      } else if (destResult.status === "fulfilled" && destResult.value.length) {
        const cmsMap = new Map(
          destResult.value.map((d) => [d.title.trim().toLowerCase(), d]),
        );
        setDestinations((prev) =>
          prev.map((item) => {
            const match = cmsMap.get(item.name.toLowerCase());
            if (match?.image) {
              return { ...item, image: mediaUrl(match.image) };
            }
            return item;
          }),
        );
      }
    });

    return () => {
      active = false;
    };
  }, [initialDestinations]);

  return (
    <section className="relative w-full overflow-hidden bg-white py-14 sm:py-18">
      <div className="relative z-10 mx-auto max-w-[1400px] px-5">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-slate-950 tracking-tight">
            {title}
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* 8 Country Cards in Responsive Grid */}
        <div className="mt-8 sm:mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 reveal-stagger">
          {destinations.map((country) => (
            <Link
              key={country.name}
              href={country.href || destinationUrl(country.name)}
              className="group relative h-[370px] sm:h-[390px] lg:h-[410px] w-full overflow-hidden rounded-[20px] bg-slate-900 transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:shadow-xl hover:-translate-y-1.5 focus:outline-none block"
            >
              {/* Full-bleed image */}
              <img
                src={country.image}
                alt={country.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />

              {/* Gradient overlay for bottom readability while keeping top bright */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none rounded-[20px]" />

              {/* Top-Left Location Badge */}
              <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-pub-accent px-3 py-1 text-[11px] font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                <MapPin size={11} className="shrink-0 text-white" />
                <span>{country.badge || country.name}</span>
              </span>

              {/* Bottom Content Overlay */}
              <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 text-left">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight drop-shadow-sm transition-colors duration-200 group-hover:text-pub-secondary">
                  {country.name.toLowerCase().endsWith("tours") ? country.name : `${country.name} tours`}
                </h3>
                <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-white/85 leading-relaxed">
                  <SquareCheckBig
                    size={12}
                    className="mt-0.5 shrink-0 text-white/70"
                  />
                  <p className="line-clamp-2 drop-shadow">
                    {country.snippet || "Explore historic landmarks, scenic landscapes and vibrant local culture."}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
