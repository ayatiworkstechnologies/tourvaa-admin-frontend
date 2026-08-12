"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LuCompass as Compass, LuGlobe as Globe, LuMapPin as MapPin } from "react-icons/lu";
import {
  fetchPublicCategories,
  fetchPublicCities,
  fetchPublicCountries,
  PublicCategory,
  PublicCity,
  PublicCountry,
} from "@/lib/api/publicClient";

type MegaTab = "destinations" | "countries" | "categories";

const tabDefinitions = [
  { key: "destinations" as const, label: "Destinations", icon: MapPin },
  { key: "countries" as const, label: "Top countries to visit", icon: Globe },
  { key: "categories" as const, label: "Top attraction categories", icon: Compass },
];

export default function DestinationsMegaPanel() {
  const [tab, setTab] = useState<MegaTab>("destinations");
  const [cities, setCities] = useState<PublicCity[]>([]);
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([fetchPublicCities(), fetchPublicCountries(), fetchPublicCategories()]).then(([citiesResult, countriesResult, categoriesResult]) => {
      if (!active) return;
      if (citiesResult.status === "fulfilled") setCities(citiesResult.value);
      if (countriesResult.status === "fulfilled") setCountries(countriesResult.value);
      if (categoriesResult.status === "fulfilled") setCategories(categoriesResult.value);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const collections = useMemo(() => ({
    destinations: cities.filter((item) => (item.tour_count || 0) > 0).slice(0, 16).map((item) => ({ key: `city-${item.id}`, label: item.city_name, count: item.tour_count || 0, href: `/tours?city=${encodeURIComponent(item.city_name)}` })),
    countries: countries.filter((item) => (item.tour_count || 0) > 0).slice(0, 16).map((item) => ({ key: `country-${item.id}`, label: item.country_name, count: item.tour_count || 0, href: `/tours?country=${encodeURIComponent(item.country_name)}` })),
    categories: categories.filter((item) => (item.tour_count || 0) > 0).slice(0, 16).map((item) => ({ key: `category-${item.id}`, label: item.category_name, count: item.tour_count || 0, href: `/tours?category=${encodeURIComponent(item.slug)}` })),
  }), [categories, cities, countries]);

  if (loading) return null;

  const availableTabs = tabDefinitions.filter((item) => collections[item.key].length > 0);
  if (!availableTabs.length) return null;

  const activeKey = availableTabs.some((item) => item.key === tab) ? tab : availableTabs[0].key;
  const activeTab = availableTabs.find((item) => item.key === activeKey) ?? availableTabs[0];

  return (
    <section aria-label="Explore popular destinations" className="bg-white pb-10 pt-12">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-12">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,.06)] sm:p-7">
          <div className="inline-flex flex-wrap gap-1 rounded-full bg-slate-100 p-1">
            {availableTabs.map((item) => (
              <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${activeKey === item.key ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,.35)]" : "text-slate-500 hover:text-slate-800"}`}>
                <item.icon size={13} />
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {collections[activeKey].map((item) => (
              <Link key={item.key} href={item.href} className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-[0_8px_20px_rgba(15,23,42,.08)]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white"><activeTab.icon size={17} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900">{item.label}</span>
                  <span className="block text-[10px] text-slate-400">{item.count} tour{item.count === 1 ? "" : "s"} &amp; activities</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
