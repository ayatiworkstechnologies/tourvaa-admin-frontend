"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchPublicCategories,
  fetchPublicCities,
  fetchPublicCountries,
  type PublicCategory,
  type PublicCity,
} from "@/lib/api/publicClient";
import { destinationUrl } from "@/lib/utils/tourUrl";

const MAX_DIRECTORY_COUNTRIES = 24;
const MAX_DIRECTORY_ITEMS = 24;

type DirectoryTab = "countries" | "cities" | "categories";

const directoryTabs: { id: DirectoryTab; label: string }[] = [
  { id: "countries", label: "Top countries to visit" },
  { id: "cities", label: "Top cities to visit" },
  { id: "categories", label: "Top attraction categories" },
];

function cleanCountryNames(countryNames: string[]) {
  return Array.from(
    new Set(countryNames.map((name) => name.trim()).filter(Boolean)),
  ).slice(0, MAX_DIRECTORY_COUNTRIES);
}

function cleanDirectoryItems<T>(items: T[], getName: (item: T) => string) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const name = getName(item).trim();
    const key = name.toLocaleLowerCase();
    if (!name || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_DIRECTORY_ITEMS);
}

export default function ExploreDirectorySection({
  countries: initialCountries,
}: {
  countries?: string[];
}) {
  const initialNames = cleanCountryNames(initialCountries ?? []);
  const [countries, setCountries] = useState<string[]>(initialNames);
  const [cities, setCities] = useState<PublicCity[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [activeTab, setActiveTab] = useState<DirectoryTab>("countries");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      fetchPublicCountries(),
      fetchPublicCities(undefined, MAX_DIRECTORY_ITEMS),
      fetchPublicCategories(),
    ])
      .then(([countryResult, cityResult, categoryResult]) => {
        if (!active) return;

        if (countryResult.status === "fulfilled") {
          setCountries(cleanCountryNames(countryResult.value.map((item) => item.country_name)));
        }
        if (cityResult.status === "fulfilled") {
          setCities(cleanDirectoryItems(cityResult.value, (item) => item.city_name));
        }
        if (categoryResult.status === "fulfilled") {
          setCategories(cleanDirectoryItems(categoryResult.value, (item) => item.category_name));
        }

        setLoadFailed(countryResult.status === "rejected");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="w-full" aria-labelledby="country-directory-heading">
      <h2 id="country-directory-heading" className="sr-only">
        Explore destinations
      </h2>
      <div className="rounded-2xl border border-slate-100 bg-white px-5 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:px-10 sm:py-9 lg:px-12">
        <div
          className="no-scrollbar -mx-1 overflow-x-auto border-b border-slate-200 px-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none]"
          role="tablist"
          aria-label="Explore directory"
        >
          <div className="flex min-w-max snap-x snap-mandatory gap-7 sm:gap-9">
            {directoryTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`${tab.id}-directory-tab`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${tab.id}-directory-panel`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative snap-start whitespace-nowrap px-0.5 pb-3.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-pub-secondary focus-visible:ring-offset-2 sm:text-base ${
                    isActive
                      ? "text-slate-950"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-slate-950" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {loading && (
          (activeTab === "countries" && countries.length === 0)
          || (activeTab === "cities" && cities.length === 0)
          || (activeTab === "categories" && categories.length === 0)
        ) ? (
          <div
            className="grid grid-cols-2 gap-x-5 gap-y-5 pt-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            aria-label="Loading directory"
          >
            {Array.from({ length: 12 }, (_, index) => (
              <span
                key={index}
                className="h-5 animate-pulse rounded bg-slate-100 motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : activeTab === "countries" && countries.length > 0 ? (
          <ol id="countries-directory-panel" role="tabpanel" aria-labelledby="countries-directory-tab" className="grid grid-cols-2 gap-x-5 gap-y-5 pt-7 text-sm text-slate-800 sm:grid-cols-3 sm:pt-9 md:grid-cols-4 lg:grid-cols-6">
            {countries.map((country, index) => (
              <li key={country}>
                <Link
                  href={destinationUrl(country)}
                  className="group flex min-h-7 items-center gap-1 rounded-md outline-none transition-colors hover:text-pub-secondary focus-visible:ring-2 focus-visible:ring-pub-secondary focus-visible:ring-offset-2"
                >
                  <span
                    className="shrink-0 tabular-nums text-slate-950 transition-colors group-hover:text-pub-secondary"
                    aria-hidden="true"
                  >
                    {index + 1}.
                  </span>
                  <span className="min-w-0 truncate group-hover:underline group-hover:underline-offset-4">
                    {country}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : activeTab === "cities" && cities.length > 0 ? (
          <ol id="cities-directory-panel" role="tabpanel" aria-labelledby="cities-directory-tab" className="grid grid-cols-2 gap-x-5 gap-y-5 pt-7 text-sm text-slate-800 sm:grid-cols-3 sm:pt-9 md:grid-cols-4 lg:grid-cols-6">
            {cities.map((city, index) => (
              <li key={city.id}>
                <Link
                  href={`/tours?destination=${encodeURIComponent(city.city_name)}`}
                  className="group flex min-h-7 items-center gap-1 rounded-md outline-none transition-colors hover:text-pub-secondary focus-visible:ring-2 focus-visible:ring-pub-secondary focus-visible:ring-offset-2"
                >
                  <span className="shrink-0 tabular-nums text-slate-950 transition-colors group-hover:text-pub-secondary" aria-hidden="true">
                    {index + 1}.
                  </span>
                  <span className="min-w-0 truncate group-hover:underline group-hover:underline-offset-4">{city.city_name}</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : activeTab === "categories" && categories.length > 0 ? (
          <ol id="categories-directory-panel" role="tabpanel" aria-labelledby="categories-directory-tab" className="grid grid-cols-2 gap-x-5 gap-y-5 pt-7 text-sm text-slate-800 sm:grid-cols-3 sm:pt-9 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((category, index) => (
              <li key={category.id}>
                <Link
                  href={`/tours?category=${encodeURIComponent(category.slug)}`}
                  className="group flex min-h-7 items-center gap-1 rounded-md outline-none transition-colors hover:text-pub-secondary focus-visible:ring-2 focus-visible:ring-pub-secondary focus-visible:ring-offset-2"
                >
                  <span className="shrink-0 tabular-nums text-slate-950 transition-colors group-hover:text-pub-secondary" aria-hidden="true">
                    {index + 1}.
                  </span>
                  <span className="min-w-0 truncate group-hover:underline group-hover:underline-offset-4">{category.category_name}</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p id={`${activeTab}-directory-panel`} role="tabpanel" aria-labelledby={`${activeTab}-directory-tab`} className="pt-7 text-sm text-slate-600" aria-live="polite">
            {activeTab === "countries" && loadFailed
              ? "Countries are being updated. Please check again shortly."
              : "This directory is being updated. Please check again shortly."}
          </p>
        )}
      </div>
    </section>
  );
}
