"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LuCompass as Compass,
  LuPhoneCall as PhoneCall,
  LuSparkles as Sparkles,
  LuArrowRight as ArrowRight,
  LuShieldCheck as ShieldCheck,
  LuHeartHandshake as HeartHandshake,
} from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";
import { PublicTour } from "@/lib/api/publicClient";
import CountryDestinationHero from "@/components/public/country/CountryDestinationHero";
import CountrySubNav from "@/components/public/country/CountrySubNav";
import CountryOverviewSection from "@/components/public/country/CountryOverviewSection";
import CountryWhyVisitSection from "@/components/public/country/CountryWhyVisitSection";
import CountryWhenToGoSection from "@/components/public/country/CountryWhenToGoSection";
import CountryPlacesToVisitSection from "@/components/public/country/CountryPlacesToVisitSection";
import CountryToursSection from "@/components/public/country/CountryToursSection";
import CountryTravelInfoSection from "@/components/public/country/CountryTravelInfoSection";

export interface CountryDestinationPageContentProps {
  info: CountryDestinationInfo;
  initialTours?: PublicTour[];
}

export default function CountryDestinationPageContent({
  info,
  initialTours = [],
}: CountryDestinationPageContentProps) {
  const [selectedPlaceFilter, setSelectedPlaceFilter] = useState<string>("");

  const handleSelectPlaceFilter = (placeName: string) => {
    setSelectedPlaceFilter(placeName);
    // Smooth scroll to tours section
    const toursEl = document.getElementById("section-tours");
    if (toursEl) {
      toursEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleClearPlaceFilter = () => {
    setSelectedPlaceFilter("");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Hero with Panoramic Image & Quick Facts strip */}
      <CountryDestinationHero info={info} />

      {/* 2. Sticky Sub-Nav (On The Go Tours navigation pattern) */}
      <CountrySubNav info={info} />

      {/* 3. Destination Overview */}
      <CountryOverviewSection info={info} />

      {/* 4. Why Visit The Country */}
      <CountryWhyVisitSection info={info} />

      {/* 5. Best Time to Visit, Monsoon & Temperature Guide */}
      <CountryWhenToGoSection info={info} />

      {/* 6. Best Places to Visit */}
      <CountryPlacesToVisitSection
        info={info}
        onSelectPlaceFilter={handleSelectPlaceFilter}
      />

      {/* 7. Available Tour Packages */}
      <CountryToursSection
        info={info}
        initialTours={initialTours}
        selectedPlaceFilter={selectedPlaceFilter}
        onClearPlaceFilter={handleClearPlaceFilter}
      />

      {/* 8. Travel Information & Advice (Visas, Money, Health, Customs, Transport) */}
      <CountryTravelInfoSection info={info} />

      {/* 9. Tailor-Made & Consultation Callout Banner */}
      <section className="py-16 bg-slate-950 text-white relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-1/4 -z-0 h-96 w-96 rounded-full bg-[#E4572E]/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 -z-0 h-96 w-96 rounded-full bg-orange-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-[1380px] px-5">
          <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-white/5 p-8 sm:p-12 backdrop-blur-md">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E4572E]/20 px-3.5 py-1 text-xs font-bold text-[#E4572E]">
                  <Sparkles size={13} />
                  <span>Tailor-Made Specialists</span>
                </div>
                <h3 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  Want a Custom Itinerary for {info.country_name}?
                </h3>
                <p className="mt-3 text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
                  Our destination experts can handcraft a private journey tailored to your preferred travel dates, pace, and dream experiences with guaranteed boutique accommodations.
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    100% Tailored to You
                  </span>
                  <span className="flex items-center gap-1.5">
                    <HeartHandshake size={16} className="text-[#E4572E]" />
                    Direct Local Specialists
                  </span>
                  <span className="flex items-center gap-1.5">
                    <PhoneCall size={15} className="text-amber-400" />
                    Free Consultation
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E4572E] px-8 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-[#c24118] hover:shadow-orange-500/20"
                >
                  <span>Request Custom Quote</span>
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href={`/tours/${info.country_slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  <span>Browse All Tours</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
