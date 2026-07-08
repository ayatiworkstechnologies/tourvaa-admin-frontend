"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Categories", href: "/admin/tours/categories" },
  { label: "Sub Categories", href: "/admin/tours/subcategories" },
];

export default function TourCategoryTabs() {
  const pathname = usePathname();

  return (
    <div className="inline-flex rounded-xl border border-dash-border bg-white p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${active ? "bg-dash-brand text-white shadow-sm" : "text-dash-muted hover:bg-dash-bg hover:text-dash-text"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
