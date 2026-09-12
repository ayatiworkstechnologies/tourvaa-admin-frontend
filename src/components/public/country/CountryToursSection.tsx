"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  LuCompass as Compass,
  LuSearch as Search,
  LuSlidersHorizontal as Sliders,
  LuArrowRight as ArrowRight,
  LuSparkles as Sparkles,
  LuCalendarDays as Calendar,
  LuClock as Clock,
} from "react-icons/lu";
import { PublicTour, fetchPublicTours } from "@/lib/api/publicClient";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";
import { useCurrency } from "@/hooks/useCurrency";
import TourCard from "@/components/public/TourCard";

export interface CountryToursSectionProps {
  info: CountryDestinationInfo;
  initialTours?: PublicTour[];
  selectedPlaceFilter?: string;
  onClearPlaceFilter?: () => void;
}

export default function CountryToursSection({
  info,
  initialTours,
  selectedPlaceFilter,
  onClearPlaceFilter,
}: CountryToursSectionProps) {
  const { format } = useCurrency();
  const [tours, setTours] = useState<PublicTour[]>(initialTours || []);
  const [loading, setLoading] = useState<boolean>(!initialTours);
  const [searchTerm, setSearchTerm] = useState<string>(selectedPlaceFilter || "");
  const [durationFilter, setDurationFilter] = useState<string>("all"); // "all", "short" (1-6), "medium" (7-10), "long" (11+)
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "duration">("featured");

  useEffect(() => {
    if (selectedPlaceFilter) {
      setSearchTerm(selectedPlaceFilter);
    }
  }, [selectedPlaceFilter]);

  // Fetch tours if not provided initially
  useEffect(() => {
    if (initialTours && initialTours.length > 0) return;

    let isMounted = true;
    setLoading(true);

    fetchPublicTours({
      country: info.country_name,
      limit: 24,
    })
      .then((res) => {
        if (isMounted) {
          setTours(res.items || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load country tours:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [info.country_name, initialTours]);

  // Filter and sort tours
  const filteredTours = useMemo(() => {
    let result = [...tours];

    // Text search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.city_name?.toLowerCase().includes(q) ||
          t.short_description?.toLowerCase().includes(q) ||
          t.category_name?.toLowerCase().includes(q)
      );
    }

    // Duration filter
    if (durationFilter === "short") {
      result = result.filter((t) => (t.number_of_days || 0) <= 6);
    } else if (durationFilter === "medium") {
      result = result.filter(
        (t) => (t.number_of_days || 0) >= 7 && (t.number_of_days || 0) <= 10
      );
    } else if (durationFilter === "long") {
      result = result.filter((t) => (t.number_of_days || 0) >= 11);
    }

    // Sorting
    if (sortBy === "price_asc") {
      result.sort((a, b) => {
        const pA = a.discounted_price_per_person ?? a.price_start_per_person ?? 0;
        const pB = b.discounted_price_per_person ?? b.price_start_per_person ?? 0;
        return pA - pB;
      });
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => {
        const pA = a.discounted_price_per_person ?? a.price_start_per_person ?? 0;
        const pB = b.discounted_price_per_person ?? b.price_start_per_person ?? 0;
        return pB - pA;
      });
    } else if (sortBy === "duration") {
      result.sort((a, b) => (a.number_of_days || 0) - (b.number_of_days || 0));
    }

    return result;
  }, [tours, searchTerm, durationFilter, sortBy]);

  return (
    <section id="section-tours" className="py-14 sm:py-20 bg-white border-b border-slate-100">
      <div className="mx-auto max-w-[1380px] px-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#E4572E]">
              <Compass size={12} className="text-[#E4572E]" />
              <span>Available Tour Packages</span>
            </div>

            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight">
              Tours & Trips in {info.country_name}
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium max-w-xl">
              Handcrafted group journeys and private adventures across {info.country_name}, designed by local specialists with guaranteed departures.
            </p>
          </div>

          <Link
            href={`/tours/${info.country_slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-xs hover:border-[#E4572E] hover:text-[#E4572E] transition-all self-start md:self-auto shrink-0"
          >
            <span>All {info.country_name} Tours</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 sm:p-4 shadow-2xs">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${info.country_name} tours by keyword, city, or highlight...`}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#E4572E] focus:outline-none focus:ring-1 focus:ring-[#E4572E]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    onClearPlaceFilter?.();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Duration Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setDurationFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  durationFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                All Durations
              </button>
              <button
                type="button"
                onClick={() => setDurationFilter("short")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  durationFilter === "short"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                1–6 Days
              </button>
              <button
                type="button"
                onClick={() => setDurationFilter("medium")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  durationFilter === "medium"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                7–10 Days
              </button>
              <button
                type="button"
                onClick={() => setDurationFilter("long")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  durationFilter === "long"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                11+ Days
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#E4572E] focus:outline-none"
              >
                <option value="featured">Featured First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="duration">Duration: Short to Long</option>
              </select>
            </div>
          </div>
        </div>

        {/* Selected Filter Notice */}
        {selectedPlaceFilter && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
            <span>Filtering tours for:</span>
            <span className="font-bold text-[#E4572E] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
              {selectedPlaceFilter}
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                onClearPlaceFilter?.();
              }}
              className="text-slate-400 hover:text-slate-700 underline font-semibold"
            >
              Reset filter
            </button>
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-96 rounded-[22px] bg-slate-100 animate-pulse border border-slate-200/60"
              />
            ))}
          </div>
        ) : filteredTours.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTours.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                format={format}
                variant="search"
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-[22px] border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-[#E4572E]">
              <Compass size={28} />
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-900">
              No tours matched your filter
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              We couldn&apos;t find tours matching &ldquo;{searchTerm || durationFilter}&rdquo;. Try clearing filters or exploring our full tour catalog.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setDurationFilter("all");
                  onClearPlaceFilter?.();
                }}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-[#E4572E] transition"
              >
                Clear all filters
              </button>
              <Link
                href={`/tours/${info.country_slug}`}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-slate-400"
              >
                View all tours
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
