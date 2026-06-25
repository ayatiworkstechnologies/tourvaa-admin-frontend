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
    <div className="inline-flex rounded-xl border border-[#E7EAF0] bg-white p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${active ? "bg-[#43A9F6] text-white shadow-sm" : "text-[#667085] hover:bg-[#F7F9FC] hover:text-[#121826]"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
