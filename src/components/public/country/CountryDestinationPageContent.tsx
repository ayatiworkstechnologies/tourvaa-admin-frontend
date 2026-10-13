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
}

export default function CountryDestinationPageContent({
  info,
  initialTours = [],
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
      {/* ── 1, 2, 3: Hero Banner, Breadcrumbs & Split Overview Card ── */}
      {visible("hero") && <CountryDestinationHero info={info} tourCount={initialTours?.length || 24} />}

      {/* CMS: Overview and quick facts */}
      {visible("overview") && <CountryOverviewSection info={info} />}

      {/* ── 4: Places to Visit in {Country} (4 Horizontal Cards) ── */}
      {visible("places") && <CountryPlacesToVisitSection
        info={info}
        onSelectPlaceFilter={handleSelectPlaceFilter}
      />}

      {/* ── 5: Must-See Highlight Panoramic Banner ── */}
      {visible("why_visit") && <CountryWhyVisitSection info={info} />}

      {/* ── 6 & 7: "Find your perfect duration" & "Choose your guiding style" ── */}
      {visible("duration_guiding") && <CountryDurationGuidingStyles
        info={info}
        onSelectDuration={(tag) => {
          setSelectedPlaceFilter(tag);
        }}
      />}

      {/* ── 8 & 9: Panoramic Feature Banner & "When to travel to {Country}" ── */}
      {visible("when_to_go") && <CountryWhenToGoSection
        info={info}
        onSelectSeason={(season) => {
          setSelectedPlaceFilter(season);
        }}
      />}

      {/* CMS: Practical travel information */}
      {visible("travel_info") && <CountryTravelInfoSection info={info} />}

      {/* ── 10: All Tours in {Country} (Filter Pills & 6-Tour Grid) ── */}
      {visible("tours") && <CountryToursSection
        info={info}
        initialTours={initialTours}
        selectedPlaceFilter={selectedPlaceFilter}
        onClearPlaceFilter={handleClearPlaceFilter}
      />}

      {/* ── 10b: Things to Do in {Country} - partner experiences (Viator),
          kept as their own section after Tourvaa's tours ── */}
      {visible("external_experiences") && <ExternalExperiencesSection placement="show_on_destination_pages" source="destination" country={info.country_name} />}

      {/* ── 11, 12, 13: Countries Worth Exploring, Directory & FAQs ── */}
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

