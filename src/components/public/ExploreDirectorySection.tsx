"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchPublicCategories,
  fetchPublicCities,
  fetchPublicCountries,
} from "@/lib/api/publicClient";

const DIRECTORY_COUNTRIES = [
  "New Zealand",
  "Spain",
  "Italy",
  "Greece",
  "United States",
  "France",
  "Portugal",
  "Türkiye",
  "Poland",
  "Netherlands",
  "Croatia",
  "Ireland",
  "Australia",
  "Morocco",
  "Thailand",
  "Malta",
  "Germany",
  "Canada",
  "Norway",
  "Hungary",
  "Japan",
  "Czechia",
  "Indonesia",
  "Switzerland",
];

const DIRECTORY_CITIES = [
  "Rome",
  "Paris",
  "Tokyo",
  "London",
  "Barcelona",
  "Dubai",
  "New York",
  "Istanbul",
  "Bangkok",
  "Amsterdam",
  "Singapore",
  "Vienna",
  "Prague",
  "Cairo",
  "Sydney",
  "Kyoto",
  "Queenstown",
  "Marrakech",
  "Athens",
  "Zurich",
  "Edinburgh",
  "Lisbon",
  "Dubrovnik",
  "Bali",
];

const DIRECTORY_CATEGORIES = [
  "Wildlife & Safari",
  "Cultural Heritage",
  "Mountain Trekking",
  "Beach & Island Escapes",
  "Historic Architecture",
  "Wine & Culinary Tours",
  "Glacier & Fjord Cruises",
  "Desert Expeditions",
  "City Sightseeing",
  "Northern Lights",
  "Ancient Ruins",
  "River Cruises",
  "Photography Expeditions",
  "Wellness & Ayurveda",
  "Honeymoon Getaways",
  "Luxury Train Journeys",
  "Scuba & Snorkeling",
  "Alpine Skiing",
  "Volcano Trails",
  "Festivals & Events",
  "Island Hopping",
  "Sacred Temples",
  "Rainforest Adventures",
  "Road Trips & Caravans",
];

export default function ExploreDirectorySection({
  countries: initialCountries,
  cities: initialCities,
  categories: initialCategories,
}: {
  countries?: string[];
  cities?: string[];
  categories?: string[];
}) {
  const [activeTab, setActiveTab] = useState<
    "countries" | "cities" | "categories"
  >("countries");

  const [countries, setCountries] = useState<string[]>(
    initialCountries && initialCountries.length > 0
      ? initialCountries
      : DIRECTORY_COUNTRIES,
  );
  const [cities, setCities] = useState<string[]>(
    initialCities && initialCities.length > 0
      ? initialCities
      : DIRECTORY_CITIES,
  );
  const [categories, setCategories] = useState<string[]>(
    initialCategories && initialCategories.length > 0
      ? initialCategories
      : DIRECTORY_CATEGORIES,
  );

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      fetchPublicCountries(),
      fetchPublicCities(),
      fetchPublicCategories(),
    ]).then(([countryResult, cityResult, categoryResult]) => {
      if (!active) return;
      if (countryResult.status === "fulfilled" && countryResult.value.length) {
        const validNames = Array.from(
          new Set(
            countryResult.value
              .map((c) => c.country_name?.trim())
              .filter((n): n is string => Boolean(n) && n.length > 2)
          )
        );
        if (validNames.length >= 12 && !validNames.some((n) => n === "Abbeville" || n === "Abbotsford")) {
          setCountries(validNames);
        } else {
          setCountries(DIRECTORY_COUNTRIES);
        }
      }
      if (cityResult.status === "fulfilled" && cityResult.value.length) {
        setCities(cityResult.value.map((c) => c.city_name));
      }
      if (
        categoryResult.status === "fulfilled" &&
        categoryResult.value.length
      ) {
        setCategories(categoryResult.value.map((c) => c.category_name));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const items =
    activeTab === "countries"
      ? countries.length > 0
        ? countries.slice(0, 24)
        : DIRECTORY_COUNTRIES
      : activeTab === "cities"
        ? cities.length > 0
          ? cities.slice(0, 24)
          : DIRECTORY_CITIES
        : categories.length > 0
          ? categories.slice(0, 24)
          : DIRECTORY_CATEGORIES;

  const getHref = (item: string) => {
    if (activeTab === "countries")
      return `/tours?country=${encodeURIComponent(item)}`;
    if (activeTab === "cities")
      return `/tours?search=${encodeURIComponent(item)}`;
    return `/tours?category=${encodeURIComponent(item)}`;
  };

  return (
    <section className="w-full">
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/70 bg-white p-6 sm:p-8 lg:p-10 shadow-xs">
        {/* Tabs Bar */}
        <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200/80 text-xs sm:text-sm md:text-base overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("countries")}
            className={`shrink-0 pb-3 font-bold transition-all duration-200 whitespace-nowrap -mb-[1px] active:scale-95 cursor-pointer ${
              activeTab === "countries"
                ? "border-b-2 border-slate-950 text-slate-950"
                : "border-b-2 border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Top countries to visit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cities")}
            className={`shrink-0 pb-3 font-bold transition-all duration-200 whitespace-nowrap -mb-[1px] active:scale-95 cursor-pointer ${
              activeTab === "cities"
                ? "border-b-2 border-slate-950 text-slate-950"
                : "border-b-2 border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Top Cities to Visit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`shrink-0 pb-3 font-bold transition-all duration-200 whitespace-nowrap -mb-[1px] active:scale-95 cursor-pointer ${
              activeTab === "categories"
                ? "border-b-2 border-slate-950 text-slate-950"
                : "border-b-2 border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Top attraction categories
          </button>
        </div>

        {/* Directory Grid with Numbered Items */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-4 gap-x-4 pt-6 sm:pt-8 text-xs sm:text-sm text-slate-700">
          {items.map((item, index) => (
            <Link
              key={`${item}-${index}`}
              href={getHref(item)}
              className="group flex items-start gap-1.5 transition-all duration-200 hover:translate-x-1 hover:text-pub-secondary"
            >
              <span className="font-semibold text-slate-900 group-hover:text-pub-secondary transition-colors duration-200">
                {index + 1}.
              </span>
              <span className="truncate group-hover:underline">{item}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
