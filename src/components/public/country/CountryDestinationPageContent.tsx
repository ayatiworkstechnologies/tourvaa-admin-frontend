"use client";

import React, { useState } from "react";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";
import { PublicTour } from "@/lib/api/publicClient";
import CountryDestinationHero from "@/components/public/country/CountryDestinationHero";
import CountryOverviewSection from "@/components/public/country/CountryOverviewSection";
import CountryPlacesToVisitSection from "@/components/public/country/CountryPlacesToVisitSection";
import CountryWhyVisitSection from "@/components/public/country/CountryWhyVisitSection";
import CountryDurationGuidingStyles from "@/components/public/country/CountryDurationGuidingStyles";
import CountryWhenToGoSection from "@/components/public/country/CountryWhenToGoSection";
import CountryToursSection from "@/components/public/country/CountryToursSection";
import CountryExploreFaqSection from "@/components/public/country/CountryExploreFaqSection";
import CountryTravelInfoSection from "@/components/public/country/CountryTravelInfoSection";
import ExternalExperiencesSection from "@/components/public/external/ExternalExperiencesSection";

export interface CountryDestinationPageContentProps {
  info: CountryDestinationInfo;
  initialTours?: PublicTour[];
  tourCount?: number;
}

export default function CountryDestinationPageContent({
  info,
  initialTours = [],
  tourCount = 0,
}: CountryDestinationPageContentProps) {
  const [selectedPlaceFilter, setSelectedPlaceFilter] = useState<string>("");
  const visible = (section: keyof NonNullable<CountryDestinationInfo["section_visibility"]>) =>
    info.section_visibility?.[section] !== false;

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
      {/* ── 1. Hero Banner, Tagline, Introduction & Quick Facts Strip ── */}
      {visible("hero") && (
        <CountryDestinationHero info={info} tourCount={tourCount} />
      )}

      {/* ── 2. Places to Visit in {Country} (Directly following Hero as in Design Spec) ── */}
      {visible("places") && (
        <CountryPlacesToVisitSection
          info={info}
          onSelectPlaceFilter={handleSelectPlaceFilter}
        />
      )}

      {/* ── 3. Why Visit {Country} - Core Reason Pillars ── */}
      {visible("why_visit") && <CountryWhyVisitSection info={info} />}

      {/* ── 4. Destination Overview & Detailed Narrative ── */}
      {visible("overview") && <CountryOverviewSection info={info} />}

      {/* ── 5. Duration & Guiding Styles ── */}
      {visible("duration_guiding") && (
        <CountryDurationGuidingStyles
          info={info}
          onSelectDuration={(tag) => {
            setSelectedPlaceFilter(tag);
          }}
        />
      )}

      {/* ── 6. When to travel to {Country} & Climate Matrix ── */}
      {visible("when_to_go") && (
        <CountryWhenToGoSection
          info={info}
          onSelectSeason={(season) => {
            setSelectedPlaceFilter(season);
          }}
        />
      )}

      {/* ── 7. Practical Travel Information & Advice ── */}
      {visible("travel_info") && <CountryTravelInfoSection info={info} />}

      {/* ── 8. All Tours in {Country} ── */}
      {visible("tours") && (
        <CountryToursSection
          info={info}
          initialTours={initialTours}
          selectedPlaceFilter={selectedPlaceFilter}
          onClearPlaceFilter={handleClearPlaceFilter}
        />
      )}

      {/* ── 9. Things to Do in {Country} - partner experiences (Viator) ── */}
      {visible("external_experiences") && (
        <ExternalExperiencesSection
          placement="show_on_destination_pages"
          source="destination"
          country={info.country_name}
        />
      )}

      {/* ── 10. Countries Worth Exploring, Directory & FAQs ── */}
      {(visible("related_destinations") || visible("destination_directory") || visible("faq")) && (
        <CountryExploreFaqSection
          info={info}
          showRelated={visible("related_destinations")}
          showDirectory={visible("destination_directory")}
          showFaq={visible("faq")}
        />
      )}
    </div>
  );
}
