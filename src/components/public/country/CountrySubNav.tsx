"use client";

import React, { useEffect, useState } from "react";
import {
  LuCalendar as Calendar,
  LuCompass as Compass,
  LuHeart as Heart,
  LuInfo as Info,
  LuMapPin as MapPin,
  LuSparkles as Sparkles,
} from "react-icons/lu";

import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountrySubNavProps {
  info?: CountryDestinationInfo;
  tourCount?: number;
}

const NAV_ITEMS = [
  { id: "section-tours", label: "Tour Packages", icon: Compass },
  { id: "section-overview", label: "Overview", icon: Info },
  { id: "section-why-visit", label: "Why Visit", icon: Heart },
  { id: "section-best-time", label: "When to Go & Climate", icon: Calendar },
  { id: "section-places", label: "Places to Visit", icon: MapPin },
  { id: "section-travel-info", label: "Travel Guide", icon: Sparkles },
];

export default function CountrySubNav({ tourCount }: CountrySubNavProps) {
  const [activeSection, setActiveSection] = useState("section-tours");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const item = NAV_ITEMS[i];
        const element = document.getElementById(item.id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(item.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    const yOffset = -110;
    const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
    setActiveSection(id);
  };

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto max-w-[1380px] px-5">
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto py-2.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#E4572E] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={14} className={isActive ? "text-white" : "text-[#E4572E]"} />
                <span>{item.label}</span>
                {item.id === "section-tours" && tourCount !== undefined && tourCount > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      isActive ? "bg-white/20 text-white" : "bg-orange-100 text-[#E4572E]"
                    }`}
                  >
                    {tourCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
