"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchPublicCategories, fetchPublicCountries, PublicCategory, PublicCountry } from "@/lib/api/publicClient";

type Tab = {
  key: string;
  label: string;
  items: { label: string; href: string; count: number }[];
};

const TOP_N = 8;

export default function DestinationsMegaPanel() {
  const [loading, setLoading] = useState(true);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([fetchPublicCountries(), fetchPublicCategories()]).then(([countryResult, categoryResult]) => {
      if (!active) return;

      const countries: PublicCountry[] = countryResult.status === "fulfilled" ? countryResult.value : [];
      const categories: PublicCategory[] = categoryResult.status === "fulfilled" ? categoryResult.value : [];

      const nextTabs: Tab[] = [];

      const countryItems = countries
        .filter((c) => (c.tour_count || 0) > 0)
        .sort((a, b) => (b.tour_count || 0) - (a.tour_count || 0))
        .slice(0, TOP_N)
        .map((c) => ({ label: c.country_name, href: `/tours?country=${encodeURIComponent(c.country_name)}`, count: c.tour_count || 0 }));
      if (countryItems.length) nextTabs.push({ key: "countries", label: "Destinations", items: countryItems });

      const categoryItems = categories
        .filter((c) => (c.tour_count || 0) > 0)
        .sort((a, b) => (b.tour_count || 0) - (a.tour_count || 0))
        .slice(0, TOP_N)
        .map((c) => ({ label: c.category_name, href: `/tours?category=${encodeURIComponent(c.slug)}`, count: c.tour_count || 0 }));
      if (categoryItems.length) nextTabs.push({ key: "categories", label: "Trip Types", items: categoryItems });

      setTabs(nextTabs);
      setActiveTab(nextTabs[0]?.key || "");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return null;
  const availableTabs = tabs;
  if (!availableTabs.length) return null;

  const current = availableTabs.find((tab) => tab.key === activeTab) || availableTabs[0];

  return (
    <div className="mx-auto max-w-[1400px] px-3 pb-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:rounded-3xl sm:p-8">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
          {availableTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition sm:text-sm ${
                tab.key === current.key
                  ? "bg-pub-primary text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {current.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-pub-accent hover:text-pub-accent sm:text-sm"
            >
              {item.label}
              <span className="text-[10px] font-medium text-slate-400 group-hover:text-pub-accent/70">({item.count})</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
