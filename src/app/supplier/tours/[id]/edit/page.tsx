"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LuCircleAlert as AlertCircle,
  LuArrowLeft as ArrowLeft,
  LuCircleCheckBig as CheckCircle2,
  LuEye as Eye,
  LuLoaderCircle as Loader2,
  LuMapPinned as MapPinned,
  LuSendHorizontal as SendHorizontal,
} from "react-icons/lu";

import api from "@/lib/api/client";
import TourFormPage from "@/components/cms/TourFormPage";
import { SupplierPageShell } from "@/components/supplier/SupplierPage";
import {
  TourWorkspaceContent,
  TourWorkspaceHeader,
  TourWorkspaceStepFooter,
  TourWorkspaceTabs,
} from "@/components/tours/TourWorkspace";
import TourOverviewTab from "@/components/tours/TourOverviewTab";
import TourItineraryTab from "@/components/tours/TourItineraryTab";
import TourItemsTab from "@/components/tours/TourItemsTab";
import TourHighlightsTab from "@/components/tours/TourHighlightsTab";
import TourGalleryTab from "@/components/tours/TourGalleryTab";
import TourPricingTab from "@/components/tours/TourPricingTab";
import TourCalendarTab from "@/components/tours/TourCalendarTab";
import TourExtensionsTab from "@/components/tours/TourExtensionsTab";
import TourSimilarTab from "@/components/tours/TourSimilarTab";
import TourDiscountsTab from "@/components/tours/TourDiscountsTab";

type Tour = {
  [key: string]: unknown;
  id: number;
  tour_code: string;
  title: string;
  status: string;
};

const TABS = [
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

function statusColors(status: string) {
  const value = (status || "").toLowerCase();
  if (["active", "published"].includes(value))
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["pending", "pending_approval", "submitted", "draft"].includes(value))
    return "border-amber-200 bg-amber-50 text-amber-700";
  if (["rejected", "cancelled"].includes(value))
    return "border-red-200 bg-red-50 text-red-600";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function TourEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tourId = params.id;
  const [activeTab, setActiveTab] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [tour, setTour] = useState<Tour | null>(null);
  const [loadingTour, setLoadingTour] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchTour = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingTour(true);
    setFetchError("");
    try {
      const response = await api.get(`/tours/${tourId}`);
      setTour(response.data?.data ?? response.data);
    } catch {
      setFetchError("Failed to load tour. Please try again.");
    } finally {
      if (showLoading) setLoadingTour(false);
    }
  }, [tourId]);

  useEffect(() => {
    void fetchTour();
  }, [fetchTour]);

  const handleSubmitForApproval = async () => {
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);
    try {
      await api.post(`/tours/${tourId}/submit-for-approval`);
      setSubmitSuccess(true);
      await fetchTour(false);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { detail?: string; message?: string } } })
          ?.response?.data?.detail ??
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        "Could not submit for approval.";
      setSubmitError(typeof message === "string" ? message : "Could not submit for approval.");
    } finally {
      setSubmitting(false);
    }
  };

  const completeAndNext = () => {
    setCompletedSteps((current) => new Set(current).add(activeTab));
    setActiveTab((current) => Math.min(current + 1, TABS.length - 1));
  };

  const finishReview = () => {
    setCompletedSteps((current) => new Set(current).add(activeTab));
    router.push("/supplier/tours");
  };

  if (loadingTour) {
    return (
      <SupplierPageShell>
        <div className="h-32 animate-pulse rounded-2xl border border-[#DCEBE2] bg-white" />
        <div className="mt-4 h-14 animate-pulse rounded-2xl border border-[#DCEBE2] bg-white" />
        <div className="mt-4 h-[520px] animate-pulse rounded-2xl border border-[#DCEBE2] bg-white" />
      </SupplierPageShell>
    );
  }

  if (fetchError) {
    return (
      <SupplierPageShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
          <AlertCircle size={32} className="mx-auto text-red-400" />
          <p className="mt-3 font-bold text-red-700">{fetchError}</p>
          <button
            type="button"
            onClick={() => void fetchTour()}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </SupplierPageShell>
    );
  }

  const canSubmit =
    tour &&
    ["draft", "rejected"].includes((tour.status ?? "").toLowerCase()) &&
    !submitSuccess;
  const activeKey = TABS[activeTab].key;

  return (
    <SupplierPageShell>
      <TourWorkspaceHeader
        role="supplier"
        title={tour?.title ?? "Edit Tour"}
        description="Complete the same core tour details used by the admin team, then manage itinerary, media, pricing, availability, and promotions."
        icon={MapPinned}
        eyebrow={tour?.tour_code ? `Tour Editor · ${tour.tour_code}` : "Tour Editor"}
        actions={[
          { label: "My Tours", href: "/supplier/tours", icon: ArrowLeft, variant: "secondary" },
          { label: "Preview", href: `/supplier/tours/${tourId}/preview`, icon: Eye, variant: "secondary" },
        ]}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {tour?.status && (
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColors(tour.status)}`}>
                {tour.status.replaceAll("_", " ")}
              </span>
            )}
            <span className="text-[11px] text-[#6A8073]">Changes save inside each section below.</span>
          </div>
          <div className="flex items-center gap-3">
            {canSubmit && (
              <button
                type="button"
                onClick={handleSubmitForApproval}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#16833A] px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-100 hover:bg-[#117331] disabled:opacity-60"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <SendHorizontal size={15} />}
                {submitting ? "Submitting…" : "Submit for Approval"}
              </button>
            )}
            {submitSuccess && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                <CheckCircle2 size={15} />
                Submitted for approval!
              </span>
            )}
          </div>
        </div>
      </TourWorkspaceHeader>

      {submitError && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <AlertCircle size={16} />
          {submitError}
        </div>
      )}

      <TourWorkspaceTabs
        role="supplier"
        tabs={TABS}
        activeIndex={activeTab}
        onSelect={setActiveTab}
        completedIndices={completedSteps}
      />

      <TourWorkspaceContent role="supplier">
        {activeKey === "basic" && (
          <TourFormPage
            tourId={tourId}
            embedded
            role="supplier"
            initialData={tour ?? undefined}
            onSaved={() => fetchTour(false)}
          />
        )}
        {activeKey === "overview" && <TourOverviewTab tourId={tourId} />}
        {activeKey === "itinerary" && <TourItineraryTab tourId={tourId} />}
        {activeKey === "inclusions" && <TourItemsTab tourId={tourId} segment="inclusions" label="Inclusions" />}
        {activeKey === "exclusions" && <TourItemsTab tourId={tourId} segment="exclusions" label="Exclusions" />}
        {activeKey === "highlights" && <TourHighlightsTab tourId={tourId} />}
        {activeKey === "gallery" && <TourGalleryTab tourId={tourId} />}
        {activeKey === "pricing" && <TourPricingTab tourId={tourId} />}
        {activeKey === "calendar" && <TourCalendarTab tourId={tourId} />}
        {activeKey === "extensions" && <TourExtensionsTab tourId={tourId} />}
        {activeKey === "discounts" && <TourDiscountsTab tourId={tourId} />}
        {activeKey === "similar" && <TourSimilarTab tourId={tourId} />}
      </TourWorkspaceContent>

      <TourWorkspaceStepFooter
        role="supplier"
        activeIndex={activeTab}
        total={TABS.length}
        completedCount={completedSteps.size}
        onBack={() => setActiveTab((current) => Math.max(0, current - 1))}
        onNext={completeAndNext}
        onFinish={finishReview}
      />
    </SupplierPageShell>
  );
}
