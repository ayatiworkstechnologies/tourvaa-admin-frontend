"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import TourFormPage from "@/components/cms/TourFormPage";
import TourOverviewTab from "@/components/tours/TourOverviewTab";
import TourItineraryTab from "@/components/tours/TourItineraryTab";
import TourItemsTab from "@/components/tours/TourItemsTab";
import TourHighlightsTab from "@/components/tours/TourHighlightsTab";
import TourSimilarTab from "@/components/tours/TourSimilarTab";
import TourExtensionsTab from "@/components/tours/TourExtensionsTab";
import TourGalleryTab from "@/components/tours/TourGalleryTab";
import TourPricingTab from "@/components/tours/TourPricingTab";
import TourCalendarTab from "@/components/tours/TourCalendarTab";
import TourDiscountsTab from "@/components/tours/TourDiscountsTab";

type Tab = {
  key: string;
  label: string;
};

const TABS: Tab[] = [
  { key: "basic", label: "Basic Details" },
  { key: "overview", label: "Overview" },
  { key: "itinerary", label: "Itinerary" },
  { key: "inclusions", label: "Inclusions" },
  { key: "exclusions", label: "Exclusions" },
  { key: "highlights", label: "Highlights" },
  { key: "similar", label: "Similar Tours" },
  { key: "extensions", label: "Extensions" },
  { key: "gallery", label: "Gallery" },
  { key: "pricing", label: "Pricing" },
  { key: "calendar", label: "Calendar" },
  { key: "discounts", label: "Discounts" },
];

export default function TourEditPage({ tourId }: { tourId: string }) {
  const [activeTab, setActiveTab] = useState("basic");

  return (
    <ModuleWrapper title="Edit Tour" requiredPermission="tours.edit">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/tours" className="inline-flex items-center gap-1 text-sm font-bold text-[#2F9FE9]">
          <ArrowLeft size={15} /> Tours
        </Link>
        <span className="text-[#98A2B3]">/</span>
        <span className="text-sm text-[#344054]">Edit</span>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-[#E7EAF0] bg-white p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-[#43A9F6] text-white shadow-sm"
                : "text-[#344054] hover:bg-[#F2F4F7]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "basic" && <TourFormPage tourId={tourId} />}
        {activeTab === "overview" && <TourOverviewTab tourId={tourId} />}
        {activeTab === "itinerary" && <TourItineraryTab tourId={tourId} />}
        {activeTab === "inclusions" && <TourItemsTab tourId={tourId} segment="inclusions" label="Inclusion" />}
        {activeTab === "exclusions" && <TourItemsTab tourId={tourId} segment="exclusions" label="Exclusion" />}
        {activeTab === "highlights" && <TourHighlightsTab tourId={tourId} />}
        {activeTab === "similar" && <TourSimilarTab tourId={tourId} />}
        {activeTab === "extensions" && <TourExtensionsTab tourId={tourId} />}
        {activeTab === "gallery" && <TourGalleryTab tourId={tourId} />}
        {activeTab === "pricing" && <TourPricingTab tourId={tourId} />}
        {activeTab === "calendar" && <TourCalendarTab tourId={tourId} />}
        {activeTab === "discounts" && <TourDiscountsTab tourId={tourId} />}
      </div>
    </ModuleWrapper>
  );
}

