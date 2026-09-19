"use client";

import React, { useEffect, useState, useMemo } from "react";
import PrimaryCtaButton from "@/components/public/PrimaryCtaButton";
import {
  LuCompass as Compass,
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
  const [loading, setLoading] = useState<boolean>(!initialTours || initialTours.length === 0);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>(selectedPlaceFilter || "");

  useEffect(() => {
    if (selectedPlaceFilter) {
      setSearchTerm(selectedPlaceFilter);
    }
  }, [selectedPlaceFilter]);

  // Fetch real tours from API
  useEffect(() => {
    if (initialTours && initialTours.length > 0) {
      setTours(initialTours);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchPublicTours({
      country: info.country_name,
      limit: 12,
    })
      .then((res) => {
        if (isMounted) {
          const fetched = res.items || [];
          setTours(fetched);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load country tours:", err);
        if (isMounted) {
          setTours([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [info.country_name, initialTours]);

  // Filter Categories matching screenshot
  const categoryPills = [
    { id: "all", label: "All Tours" },
    { id: "popular", label: "Popular" },
    { id: "classic", label: "Classic" },
    { id: "adventure", label: "Adventure" },
    { id: "short", label: "Short Breaks" },
    { id: "culture", label: "Culture & History" },
    { id: "indepth", label: "In-depth" },
  ];

  // Filter and sort tours
  const displayTours = useMemo(() => {
    const list = tours;
    let result = [...list];

    // Category filter
    if (activeCategory === "popular") {
      result = result.filter((t) => (t.rating_average || 0) >= 4.8 || t.category_name?.toLowerCase().includes("popular"));
    } else if (activeCategory === "classic") {
      result = result.filter((t) => t.category_name?.toLowerCase().includes("classic") || (t.number_of_days || 0) >= 7);
    } else if (activeCategory === "adventure") {
      result = result.filter((t) => t.category_name?.toLowerCase().includes("adventure") || (t.title?.toLowerCase().includes("mountain") || t.title?.toLowerCase().includes("trail")));
    } else if (activeCategory === "short") {
      result = result.filter((t) => (t.number_of_days || 0) <= 8);
    } else if (activeCategory === "culture") {
      result = result.filter((t) => t.category_name?.toLowerCase().includes("culture") || t.title?.toLowerCase().includes("ancient") || t.title?.toLowerCase().includes("city"));
    } else if (activeCategory === "indepth") {
      result = result.filter((t) => (t.number_of_days || 0) >= 11);
    }

    // Keyword search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.city_name?.toLowerCase().includes(q) ||
          t.short_description?.toLowerCase().includes(q)
      );
    }

    return result.slice(0, 6);
  }, [tours, activeCategory, searchTerm]);

  return (
    <section id="section-tours" className="py-12 sm:py-16 bg-white border-b border-slate-100">
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
        {/* ── Heading matching screenshot ── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              All Tours in {info.country_name}
            </h2>
            <span className="hidden sm:inline-flex rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600">
              {displayTours.length} available
            </span>
          </div>

          <PrimaryCtaButton href={`/tours/${info.country_slug}`} size="sm">
            View full catalog
          </PrimaryCtaButton>
        </div>

        {/* ── Category Filter Pills Row matching screenshot ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoryPills.map((pill) => {
            const isActive = activeCategory === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveCategory(pill.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-pub-accent text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {pill.id === "all" ? `${pill.label} (${displayTours.length})` : pill.label}
              </button>
            );
          })}
        </div>

        {/* Active Search/Place Notice */}
        {searchTerm && (
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
            <span>Filtered by:</span>
            <span className="font-bold text-pub-accent bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
              {searchTerm}
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                onClearPlaceFilter?.();
              }}
              className="text-slate-400 hover:text-slate-700 underline font-semibold cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        {/* ── 6 Tour Cards Grid (3 Columns x 2 Rows) ── */}
        {loading ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[430px] rounded-[22px] bg-slate-100 animate-pulse border border-slate-200/60"
              />
            ))}
          </div>
        ) : displayTours.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTours.map((tour) => (
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-pub-accent">
              <Compass size={24} />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900">
              No tours matched this category
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Try switching category or clearing the search filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("all");
                setSearchTerm("");
                onClearPlaceFilter?.();
              }}
              className="mt-4 rounded-full bg-[#0A1128] px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Reset to All Tours
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

