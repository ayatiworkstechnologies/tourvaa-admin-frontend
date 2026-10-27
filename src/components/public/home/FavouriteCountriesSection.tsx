"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuGlobe as Globe2,
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
import PrimaryCtaButton from "@/components/public/PrimaryCtaButton";

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const nextCard = () => {
    setActiveIndex((prev) => (prev + 1) % destinations.length);
  };

  const prevCard = () => {
    setActiveIndex((prev) => (prev - 1 + destinations.length) % destinations.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 45) {
      nextCard();
    } else if (diff < -45) {
      prevCard();
    }
    setTouchStart(null);
  };

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
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-slate-950 tracking-tight font-heading">
            {title}
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* ── MOBILE: Fade & Slide Card Stack ── */}
        <div className="mt-8 sm:hidden">
          <div
            className="relative h-[410px] w-full max-w-[340px] mx-auto select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {destinations.map((country, idx) => {
              const isActive = idx === activeIndex;

              // Do not leave inactive cards peeking out from the active card:
              // their pale edges break the rounded-card boundary on mobile.
              let stackClasses = "hidden";
              if (isActive) {
                stackClasses = "block animate-in fade-in slide-in-from-right-2 duration-300";
              }

              return (
                <div
                  key={country.name}
                  className={`absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${stackClasses}`}
                >
                  <Link
                    href={country.href || destinationUrl(country.name)}
                    data-country-card
                    className="relative block h-full w-full overflow-hidden rounded-[24px] bg-slate-900 border border-slate-100 active:scale-[0.99] transition-transform duration-200"
                  >
                    {/* Full-bleed image */}
                    <img
                      src={country.image}
                      alt={country.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />

                    {/* Gradient overlay for text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none rounded-[24px]" />

                    {/* Top-Left Location Badge */}
                    <span className="absolute left-3.5 top-3.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-pub-accent px-3.5 py-1 text-[11px] font-bold text-white shadow-md">
                      <MapPin size={11} className="shrink-0 text-white" />
                      <span>{country.badge || country.name}</span>
                    </span>

                    {/* Bottom Content Overlay */}
                    <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-left text-white">
                      <h3 className="text-xl font-bold !text-white tracking-tight drop-shadow-sm font-heading">
                        {country.name.toLowerCase().endsWith("tours") ? country.name : `${country.name} tours`}
                      </h3>
                      <div className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed">
                        <SquareCheckBig
                          size={12}
                          className="mt-0.5 shrink-0 text-white"
                        />
                        <p
                          className="line-clamp-2 !text-white text-white drop-shadow text-[11px] leading-relaxed"
                          style={{ color: "#ffffff" }}
                        >
                          {country.snippet || "Explore historic landmarks, scenic landscapes and vibrant local culture."}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-bold !text-white">
                        <span className="text-white drop-shadow-xs">Explore tours</span>
                        <ArrowRight size={13} className="text-pub-accent" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Mobile Stack Navigation Controls */}
          {destinations.length > 1 && (
            <div className="mt-5 flex items-center justify-between gap-3 max-w-[340px] mx-auto px-2">
              <button
                type="button"
                aria-label="Previous country"
                onClick={prevCard}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-xs transition hover:bg-slate-50 active:scale-90 cursor-pointer"
              >
                <ChevronLeft size={20} className="stroke-[2.5]" />
              </button>

              {/* Slide Counter & Dots */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700 tracking-wider">
                  {String(activeIndex + 1).padStart(2, "0")}{" "}
                  <span className="text-slate-400 font-normal">/</span>{" "}
                  {String(destinations.length).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-1.5">
                  {destinations.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Go to country slide ${i + 1}`}
                      onClick={() => setActiveIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        activeIndex === i ? "w-5 bg-pub-accent" : "w-1.5 bg-slate-300 hover:bg-slate-400"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                aria-label="Next country"
                onClick={nextCard}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-xs transition hover:bg-slate-50 active:scale-90 cursor-pointer"
              >
                <ChevronRight size={20} className="stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>

        {/* ── DESKTOP: 4-Column Responsive Grid ── */}
        <div className="mt-10 hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          {destinations.map((country) => (
            <Link
              key={country.name}
              href={country.href || destinationUrl(country.name)}
              data-country-card
              className="group relative h-[390px] lg:h-[410px] w-full overflow-hidden rounded-[24px] bg-slate-900 transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:shadow-2xl hover:-translate-y-1.5 focus:outline-none block active:scale-[0.98] cursor-pointer"
            >
              {/* Full-bleed image */}
              <img
                src={country.image}
                alt={country.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />

              {/* Gradient overlay for bottom readability while keeping top bright */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none rounded-[24px] transition-opacity duration-300 group-hover:from-black/90" />

              {/* Top-Left Location Badge */}
              <span className="absolute left-3.5 top-3.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-pub-accent/90 backdrop-blur-md px-3.5 py-1 text-[11px] font-bold text-white shadow-md transition-transform duration-300 group-hover:scale-105">
                <MapPin size={11} className="shrink-0 text-white" />
                <span>{country.badge || country.name}</span>
              </span>

              {/* Bottom Content Overlay */}
              <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-left text-white">
                <h3 className="text-lg sm:text-xl font-bold !text-white tracking-tight drop-shadow-sm transition-colors duration-200 group-hover:text-pub-secondary font-heading">
                  {country.name.toLowerCase().endsWith("tours") ? country.name : `${country.name} tours`}
                </h3>
                <div className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed">
                  <SquareCheckBig
                    size={12}
                    className="mt-0.5 shrink-0 text-white"
                  />
                  <p
                    className="line-clamp-2 !text-white text-white drop-shadow text-[11px] leading-relaxed"
                    style={{ color: "#ffffff" }}
                  >
                    {country.snippet || "Explore historic landmarks, scenic landscapes and vibrant local culture."}
                  </p>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold !text-white transition-all duration-300 group-hover:translate-x-1">
                  <span className="text-white drop-shadow-xs">Explore tours</span>
                  <ArrowRight size={13} className="text-pub-accent transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-center sm:mt-10">
          <PrimaryCtaButton href="/destinations" size="md" leadingIcon={<Globe2 size={18} />}>
            View All Countries
          </PrimaryCtaButton>
        </div>
      </div>
    </section>
  );
}
