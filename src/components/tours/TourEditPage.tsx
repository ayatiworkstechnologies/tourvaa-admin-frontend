"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuMapPinned as MapPinned } from "react-icons/lu";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import {
  TourWorkspaceContent,
  TourWorkspaceHeader,
  TourWorkspaceStepFooter,
  TourWorkspaceTabs,
} from "@/components/tours/TourWorkspace";
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
  { key: "gallery", label: "Gallery" },
  { key: "pricing", label: "Pricing" },
  { key: "calendar", label: "Calendar" },
  { key: "extensions", label: "Extensions" },
  { key: "discounts", label: "Discounts" },
  { key: "similar", label: "Similar Tours" },
];

export default function TourEditPage({ tourId }: { tourId: string }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const activeTab = STEPS[stepIndex].key;

  const completeAndNext = () => {
    setCompletedSteps((current) => new Set(current).add(stepIndex));
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const finishReview = () => {
    setCompletedSteps((current) => new Set(current).add(stepIndex));
    router.push("/admin/tours");
  };

  return (
    <ModuleWrapper title="Edit Tour" requiredPermission="tours.edit">
      <TourWorkspaceHeader
        role="admin"
        title="Edit Tour"
        description="Manage the complete tour package across content, itinerary, media, pricing, availability, and promotion sections."
        icon={MapPinned}
        eyebrow={`Admin Tour Editor · Tour #${tourId}`}
        actions={[{ label: "Back to Tours", href: "/admin/tours", variant: "secondary" }]}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-[#1F5DA8]">
              Administrator access
            </span>
            <span className="text-[11px] text-dash-muted">Changes save inside each section below.</span>
          </div>
          <span className="text-[11px] font-bold text-dash-muted">
            {STEPS[stepIndex].label} · {stepIndex + 1} of {STEPS.length}
          </span>
        </div>
      </TourWorkspaceHeader>

      <TourWorkspaceTabs
        role="admin"
        tabs={STEPS}
        activeIndex={stepIndex}
        onSelect={setStepIndex}
        completedIndices={completedSteps}
      />

      <TourWorkspaceContent role="admin">
        {activeTab === "basic" && <TourFormPage tourId={tourId} embedded />}
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
      </TourWorkspaceContent>

      <TourWorkspaceStepFooter
        role="admin"
        activeIndex={stepIndex}
        total={STEPS.length}
        completedCount={completedSteps.size}
        onBack={() => setStepIndex((current) => Math.max(0, current - 1))}
        onNext={completeAndNext}
        onFinish={finishReview}
      />
    </ModuleWrapper>
  );
}
