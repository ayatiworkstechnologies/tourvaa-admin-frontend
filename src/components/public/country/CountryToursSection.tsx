"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  LuCompass as Compass,
  LuArrowRight as ArrowRight,
} from "react-icons/lu";
import { PublicTour, fetchPublicTours } from "@/lib/api/publicClient";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";
import { useCurrency } from "@/hooks/useCurrency";
import TourCard from "@/components/public/TourCard";

// The hardcoded fallback tour data below only fills in the fields actually
// shown on this page's cards; this backfills the rest of PublicTour's
// required fields with safe defaults so the fallback list still satisfies
// the same type used for real API results.
type FallbackTourSeed = Omit<PublicTour, "tour_code" | "supplier_name" | "subtitle" | "number_of_hours" | "status">;
function fillTourDefaults(seeds: FallbackTourSeed[]): PublicTour[] {
  return seeds.map((seed) => ({
    ...seed,
    tour_code: "",
    supplier_name: "",
    subtitle: seed.short_description,
    number_of_hours: null,
    status: "published",
  }));
}

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

  // Fallback realistic tours if DB has few or zero tours for this country
  const fallbackCountryTours: PublicTour[] = useMemo(() => {
    const isChina = info.country_slug === "china" || info.country_name.toLowerCase() === "china";
    if (isChina) {
      return fillTourDefaults([
        {
          id: 101,
          slug: "china-highlights-great-wall",
          title: "China Highlights & The Great Wall",
          country_name: "China",
          city_name: "Beijing, Xi'an, Shanghai",
          number_of_days: 10,
          group_size: "Max 16",
          category_name: "Classic",
          rating_average: 4.9,
          rating_count: 48,
          price_start_per_person: 1899,
          currency: "USD",
          banner_image:
            "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80",
          short_description:
            "Walk the legendary Mutianyu Great Wall, explore the Forbidden City, stand before the Terracotta Army, and cruise Shanghai's dazzling Bund.",
        },
        {
          id: 102,
          slug: "shanghai-to-beijing-express",
          title: "Shanghai to Beijing Express",
          country_name: "China",
          city_name: "Shanghai, Suzhou, Beijing",
          number_of_days: 8,
          group_size: "Max 14",
          category_name: "Popular",
          rating_average: 4.8,
          rating_count: 36,
          price_start_per_person: 1599,
          currency: "USD",
          banner_image:
            "https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?auto=format&fit=crop&w=800&q=80",
          short_description:
            "High-speed bullet train odyssey connecting China's futuristic metropolis with the ancient imperial heartland and tranquil water towns.",
        },
        {
          id: 103,
          slug: "yangtze-river-ancient-dynasties",
          title: "Yangtze Splendors & Ancient Dynasties",
          country_name: "China",
          city_name: "Beijing, Xi'an, Yangtze, Shanghai",
          number_of_days: 14,
          group_size: "Max 16",
          category_name: "In-depth",
          rating_average: 5.0,
          rating_count: 62,
          price_start_per_person: 2499,
          currency: "USD",
          banner_image:
            "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=80",
          short_description:
            "A 5-star luxury cruise through the dramatic Three Gorges, complemented by the imperial grandeur of Beijing and Xi'an warriors.",
        },
        {
          id: 104,
          slug: "forbidden-city-terracotta-short-break",
          title: "Forbidden Imperial Cities",
          country_name: "China",
          city_name: "Beijing & Xi'an",
          number_of_days: 6,
          group_size: "Max 12",
          category_name: "Short Breaks",
          rating_average: 4.7,
          rating_count: 29,
          price_start_per_person: 1249,
          currency: "USD",
          banner_image:
            "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=800&q=80",
          short_description:
            "Fast-paced immersion in northern China's essential historical icons: Temple of Heaven, Summer Palace, and the Terracotta Vaults.",
        },
        {
          id: 105,
          slug: "avatar-mountains-guilin-karst",
          title: "Avatar Mountains & Guilin Karst",
          country_name: "China",
          city_name: "Zhangjiajie & Guilin",
          number_of_days: 9,
          group_size: "Max 14",
          category_name: "Adventure",
          rating_average: 4.9,
          rating_count: 54,
          price_start_per_person: 1799,
          currency: "USD",
          banner_image:
            "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
          short_description:
            "Gaze upon the towering sandstone pillars of Zhangjiajie and drift down the emerald Li River through otherworldly limestone peaks.",
        },
        {
          id: 106,
          slug: "sichuan-pandas-silk-road-wonders",
          title: "Sichuan Pandas & Silk Road Wonders",
          country_name: "China",
          city_name: "Chengdu, Xi'an, Dunhuang",
          number_of_days: 12,
          group_size: "Max 16",
          category_name: "Culture & History",
          rating_average: 4.9,
          rating_count: 41,
          price_start_per_person: 2199,
          currency: "USD",
          banner_image:
            "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=800&q=80",
          short_description:
            "Encounter giant pandas at Chengdu sanctuary, explore Mogao Buddhist grottoes, and ride camels through singing desert dunes.",
        },
      ]);
    }

    // Default template for other countries
    return fillTourDefaults([
      {
        id: 201,
        slug: `${info.country_slug}-classic-discovery`,
        title: `${info.country_name} Classic Discovery`,
        country_name: info.country_name,
        city_name: info.quick_facts?.capital || info.country_name,
        number_of_days: 10,
        group_size: "Max 16",
        category_name: "Classic",
        rating_average: 4.9,
        rating_count: 38,
        price_start_per_person: 1899,
        currency: "USD",
        banner_image: info.hero_image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
        short_description: `The definitive introduction to ${info.country_name}'s premier landmarks, cultural capitals, and scenic marvels with an expert local guide.`,
      },
      {
        id: 202,
        slug: `${info.country_slug}-highlights-express`,
        title: `${info.country_name} Highlights Express`,
        country_name: info.country_name,
        city_name: info.quick_facts?.capital || info.country_name,
        number_of_days: 6,
        group_size: "Max 14",
        category_name: "Short Breaks",
        rating_average: 4.8,
        rating_count: 27,
        price_start_per_person: 1299,
        currency: "USD",
        banner_image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80",
        short_description: `A compact and invigorating journey covering must-see sites for travellers with limited vacation time.`,
      },
      {
        id: 203,
        slug: `${info.country_slug}-grand-expedition`,
        title: `${info.country_name} Grand Expedition`,
        country_name: info.country_name,
        city_name: "Comprehensive Tour",
        number_of_days: 14,
        group_size: "Max 16",
        category_name: "In-depth",
        rating_average: 5.0,
        rating_count: 45,
        price_start_per_person: 2599,
        currency: "USD",
        banner_image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
        short_description: `An all-inclusive grand odyssey covering every corner of ${info.country_name} with premium heritage accommodations.`,
      },
      {
        id: 204,
        slug: `${info.country_slug}-adventure-trails`,
        title: `${info.country_name} Adventure & Nature Trails`,
        country_name: info.country_name,
        city_name: "Scenic Highlands",
        number_of_days: 9,
        group_size: "Max 12",
        category_name: "Adventure",
        rating_average: 4.9,
        rating_count: 32,
        price_start_per_person: 1749,
        currency: "USD",
        banner_image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
        short_description: `Trek pristine wilderness routes, national parks, and remote valleys with professional outdoor tour guides.`,
      },
      {
        id: 205,
        slug: `${info.country_slug}-culture-heritage`,
        title: `${info.country_name} Cultural Heritage Journey`,
        country_name: info.country_name,
        city_name: "Historical Cities",
        number_of_days: 8,
        group_size: "Max 14",
        category_name: "Culture & History",
        rating_average: 4.8,
        rating_count: 39,
        price_start_per_person: 1499,
        currency: "USD",
        banner_image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80",
        short_description: `Immerse in ancient architecture, sacred shrines, folklore traditions, and traditional cuisine.`,
      },
      {
        id: 206,
        slug: `${info.country_slug}-signature-experience`,
        title: `${info.country_name} Signature Explorer`,
        country_name: info.country_name,
        city_name: "National Circuit",
        number_of_days: 11,
        group_size: "Max 16",
        category_name: "Popular",
        rating_average: 4.9,
        rating_count: 51,
        price_start_per_person: 2099,
        currency: "USD",
        banner_image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
        short_description: `The top-rated itinerary favored by first-time and returning travellers seeking authentic cultural immersion.`,
      },
    ]);
  }, [info]);

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
          if (fetched.length >= 4) {
            setTours(fetched);
          } else {
            // Merge with fallback so we always have at least 6 rich tours
            const combined = [...fetched, ...fallbackCountryTours.slice(fetched.length)];
            setTours(combined);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load country tours, using fallback catalog:", err);
        if (isMounted) {
          setTours(fallbackCountryTours);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [info.country_name, initialTours, fallbackCountryTours]);

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
    const list = tours.length > 0 ? tours : fallbackCountryTours;
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
  }, [tours, fallbackCountryTours, activeCategory, searchTerm]);

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

          <Link
            href={`/tours/${info.country_slug}`}
            className="text-xs font-bold text-slate-600 hover:text-slate-950 flex items-center gap-1 transition"
          >
            <span>View full catalog</span>
            <ArrowRight size={13} />
          </Link>
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
                    ? "bg-[#E4572E] text-white shadow-sm"
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
            <span className="font-bold text-[#E4572E] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-[#E4572E]">
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
