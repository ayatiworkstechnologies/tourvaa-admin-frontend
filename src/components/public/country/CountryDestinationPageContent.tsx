"use client";

import React, { useState } from "react";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";
import { PublicTour } from "@/lib/api/publicClient";
import CountryDestinationHero from "@/components/public/country/CountryDestinationHero";
import CountryPlacesToVisitSection from "@/components/public/country/CountryPlacesToVisitSection";
import CountryWhyVisitSection from "@/components/public/country/CountryWhyVisitSection";
import CountryDurationGuidingStyles from "@/components/public/country/CountryDurationGuidingStyles";
import CountryWhenToGoSection from "@/components/public/country/CountryWhenToGoSection";
import CountryToursSection from "@/components/public/country/CountryToursSection";
import CountryExploreFaqSection from "@/components/public/country/CountryExploreFaqSection";

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
    const toursEl = document.getElementById("section-tours");
    if (toursEl) {
      toursEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleClearPlaceFilter = () => {
    setSelectedPlaceFilter("");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── 1, 2, 3: Hero Banner, Breadcrumbs & Split Overview Card ── */}
      <CountryDestinationHero info={info} tourCount={initialTours?.length || 24} />

      {/* ── 4: Places to Visit in {Country} (4 Horizontal Cards) ── */}
      <CountryPlacesToVisitSection
        info={info}
        onSelectPlaceFilter={handleSelectPlaceFilter}
      />

      {/* ── 5: Must-See Highlight Panoramic Banner ── */}
      <CountryWhyVisitSection info={info} />

      {/* ── 6 & 7: "Find your perfect duration" & "Choose your guiding style" ── */}
      <CountryDurationGuidingStyles
        info={info}
        onSelectDuration={(tag) => {
          setSelectedPlaceFilter(tag);
        }}
      />

      {/* ── 8 & 9: Panoramic Feature Banner & "When to travel to {Country}" ── */}
      <CountryWhenToGoSection
        info={info}
        onSelectSeason={(season) => {
          setSelectedPlaceFilter(season);
        }}
      />

      {/* ── 10: All Tours in {Country} (Filter Pills & 6-Tour Grid) ── */}
      <CountryToursSection
        info={info}
        initialTours={initialTours}
        selectedPlaceFilter={selectedPlaceFilter}
        onClearPlaceFilter={handleClearPlaceFilter}
      />

      {/* ── 11, 12, 13: Countries Worth Exploring, Directory & FAQs ── */}
      <CountryExploreFaqSection info={info} />
    </div>
  );
}
