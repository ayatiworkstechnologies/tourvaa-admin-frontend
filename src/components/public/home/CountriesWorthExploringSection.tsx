"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuBookOpen as BookOpen,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuHeart as Heart,
  LuSparkles as Sparkles,
  LuStar as Star,
} from "react-icons/lu";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import {
  fetchPopularDestinations,
  fetchPublicCountries,
} from "@/lib/api/publicClient";
import {
  CountryWorthExploring,
  stableHash,
  topDestinationsFromCountries,
} from "./homeTypes";
import { EmptyCollection } from "./HomeHelpers";

export function CountryWorthExploringCard({
  country,
}: {
  country: CountryWorthExploring;
}) {
  const { isWishlisted, toggleWishlist } = useTravelStore();
  const itemId = stableHash(`country-${country.name}`);
  const wishlisted = isWishlisted(itemId);
  const href = `/tours?country=${encodeURIComponent(country.name)}`;

  const travelItem = {
    id: itemId,
    title: `${country.name} Tours`,
    place: country.name,
    image: country.image,
    price: null,
    currency: "USD",
    duration: country.count,
    href,
  };

  const ratingVal = (country.rating ?? 4.9).toFixed(1);

  return (
    <div
      data-country-card
      className="group relative w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 ease-out hover:border-slate-300 hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between h-full"
    >
      {/* Top Image Container */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-[16px] bg-slate-100 shrink-0">
        <Link href={href} className="block h-full w-full">
          <img
            src={country.image}
            alt={country.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
          />
        </Link>

        {/* Subtle vignette for badge readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none" />

        {/* Popular orange badge (top-left) */}
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#E4572E] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-orange-600/30">
          <Sparkles size={11} className="fill-white animate-sparkle-glow" />
          <span>{country.badge || "Popular"}</span>
        </span>

        {/* Wishlist button (top-right) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(travelItem);
          }}
          aria-label={
            wishlisted
              ? `Remove ${country.name} from wishlist`
              : `Add ${country.name} to wishlist`
          }
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-700 shadow-md transition-all duration-200 hover:scale-115 active:scale-90 hover:bg-white focus:outline-none cursor-pointer"
        >
          <Heart
            size={16}
            className={
              wishlisted
                ? "fill-red-500 text-red-500"
                : "fill-slate-400/40 text-slate-700"
            }
          />
        </button>
      </div>

      {/* Card Body */}
      <div className="pt-4 flex flex-col justify-between flex-1">
        <div>
          {/* Name and Rating */}
          <div className="flex items-center justify-between gap-2 min-h-[32px]">
            <Link href={href} className="block min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold text-slate-900 transition-colors group-hover:text-pub-secondary">
                {country.name}
              </h3>
            </Link>
            <div className="flex items-center gap-1 text-xs font-extrabold text-slate-800 shrink-0 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/60">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span>{ratingVal}</span>
            </div>
          </div>

          {/* Packages count with map/book icon */}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <BookOpen size={13} className="text-sky-500 shrink-0 stroke-[2]" />
            <span>{country.count}</span>
          </p>
        </div>

        {/* Bottom Explore action */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-slate-500">
            Explore packages
          </span>
          <Link
            href={href}
            aria-label={`Explore ${country.name} tours`}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1527] text-white shadow-xs transition-all duration-300 group-hover:bg-[#E4572E] group-hover:scale-110 active:scale-95"
          >
            <ArrowRight
              size={14}
              className="stroke-[2.5] transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

export interface CountriesWorthExploringSectionProps {
  initialCountries?: CountryWorthExploring[];
  loading?: boolean;
}

export default function CountriesWorthExploringSection({
  initialCountries,
  loading: initialLoading,
}: CountriesWorthExploringSectionProps) {
  const [countries, setCountries] = useState<CountryWorthExploring[]>(
    initialCountries || [],
  );
  const [loading, setLoading] = useState<boolean>(
    initialLoading !== undefined ? initialLoading : !initialCountries?.length,
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fast independent data loading
  useEffect(() => {
    if (initialCountries && initialCountries.length > 0) {
      setCountries(initialCountries);
      setLoading(false);
      return;
    }

    let active = true;

    async function loadCountries() {
      try {
        const [countryResult, destinationResult] = await Promise.allSettled([
          fetchPublicCountries(),
          fetchPopularDestinations(),
        ]);

        if (!active) return;

        if (countryResult.status === "fulfilled" && countryResult.value.length) {
          const cmsDestinations =
            destinationResult.status === "fulfilled"
              ? destinationResult.value
              : [];
          const topCountries = topDestinationsFromCountries(
            countryResult.value,
            cmsDestinations,
            6,
          );
          if (topCountries.length) {
            setCountries(topCountries);
          }
        }
      } catch {
        // graceful fallback
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCountries();

    return () => {
      active = false;
    };
  }, [initialCountries]);

  const move = (direction: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-country-card]");
    const gap = 20;
    const step = firstCard ? firstCard.offsetWidth + gap : 320;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const displayCountries = countries;

  return (
    <section className="relative w-full overflow-hidden my-8 sm:my-14 py-12 sm:py-20 bg-gradient-to-b from-white via-[#FAF7F2] to-[#F4EFE7] border-y border-slate-200/60 shadow-2xs">
      {/* Ambient decorative glowing blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-bl from-amber-200/20 via-orange-100/15 to-transparent blur-3xl animate-float-orb" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-100/20 via-slate-100/20 to-transparent blur-3xl animate-float-orb-alt" />

      <div className="relative z-10 mx-auto max-w-[1380px] px-5">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-800 mb-2">
              <Sparkles
                size={12}
                className="fill-current text-amber-600 animate-sparkle-glow"
              />
              <span>Global Destinations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-slate-950 tracking-tight">
              Countries Worth Exploring
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium max-w-xl">
              Iconic landscapes, rich cultures, and unforgettable adventures
              across the world&apos;s most sought-after countries.
            </p>
          </div>

          {!loading && displayCountries.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                aria-label="Previous countries"
                onClick={() => move(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-[#E4572E] hover:text-[#E4572E] hover:scale-110 active:scale-90 hover:shadow-sm cursor-pointer"
              >
                <ChevronLeft size={18} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                aria-label="Next countries"
                onClick={() => move(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-[#E4572E] hover:text-[#E4572E] hover:scale-110 active:scale-90 hover:shadow-sm cursor-pointer"
              >
                <ChevronRight size={18} className="stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth"
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start h-72 animate-pulse rounded-[22px] bg-white/60 border border-slate-200/60"
              />
            ))
          ) : displayCountries.length > 0 ? (
            displayCountries.map((country, index) => (
              <CountryWorthExploringCard
                key={`${country.name}-${index}`}
                country={country}
              />
            ))
          ) : (
            <EmptyCollection
              message="No destinations are available yet."
              href="/tours"
              linkLabel="Browse all tours"
            />
          )}
        </div>
      </div>
    </section>
  );
}
