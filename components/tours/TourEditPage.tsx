"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

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

type Step = {
  key: string;
  label: string;
};

const STEPS: Step[] = [
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
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));

  const activeTab = STEPS[stepIndex].key;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const goTo = (index: number) => {
    setStepIndex(index);
    setVisited((prev) => new Set(prev).add(index));
  };

  return (
    <ModuleWrapper title="Edit Tour" requiredPermission="tours.edit">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/tours" className="inline-flex items-center gap-1 text-sm font-bold text-[#2F9FE9]">
          <ArrowLeft size={15} /> Tours
        </Link>
        <span className="text-[#98A2B3]">/</span>
        <span className="text-sm text-[#344054]">Edit</span>
      </div>

      {/* Step indicator */}
      <div className="mb-6 overflow-x-auto rounded-2xl border border-[#E9EDF3] bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
        <div className="flex min-w-max items-center">
          {STEPS.map((step, index) => {
            const isActive = index === stepIndex;
            const isDone = visited.has(index) && index !== stepIndex;
            return (
              <div key={step.key} className="flex items-center">
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  className="flex flex-col items-center gap-1.5 px-2"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isActive
                        ? "bg-[#43A9F6] text-white shadow-[0_4px_10px_rgb(67,169,246,0.35)]"
                        : isDone
                        ? "bg-[#EDF5FF] text-[#2F9FE9]"
                        : "bg-[#F0F3F8] text-[#98A2B3]"
                    }`}
                  >
                    {isDone ? <Check size={14} /> : index + 1}
                  </span>
                  <span className={`whitespace-nowrap text-xs font-semibold ${isActive ? "text-[#121826]" : "text-[#98A2B3]"}`}>
                    {step.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <span className={`mx-1 h-0.5 w-8 rounded-full ${visited.has(index + 1) || isDone ? "bg-[#43A9F6]" : "bg-[#F0F3F8]"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
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

      {/* Step navigation */}
      <div className="mt-6 flex items-center justify-between border-t border-[#F0F3F8] pt-5">
        <button
          type="button"
          onClick={() => !isFirst && goTo(stepIndex - 1)}
          disabled={isFirst}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-bold text-[#344054] transition hover:bg-[#F7F9FC] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <span className="text-xs font-semibold text-[#98A2B3]">
          Step {stepIndex + 1} of {STEPS.length}
        </span>

        {isLast ? (
          <button
            type="button"
            onClick={() => router.push("/admin/tours")}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Check size={15} /> Done
          </button>
        ) : (
          <button
            type="button"
            onClick={() => goTo(stepIndex + 1)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] transition hover:-translate-y-0.5 hover:bg-[#2F9FE9]"
          >
            Next <ArrowRight size={15} />
          </button>
        )}
      </div>
    </ModuleWrapper>
  );
}
