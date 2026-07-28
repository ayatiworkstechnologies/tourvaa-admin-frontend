"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  TourWorkspaceContent,
  TourWorkspaceHeader,
  TourWorkspaceTabs,
} from "@/components/tours/TourWorkspace";
import TourOverviewTab from "@/components/tours/TourOverviewTab";
import TourHighlightsTab from "@/components/tours/TourHighlightsTab";
import TourItineraryTab from "@/components/tours/TourItineraryTab";
import TourItemsTab from "@/components/tours/TourItemsTab";
import TourAccommodationExtraTab from "@/components/tours/TourAccommodationExtraTab";
import TourOptionalActivityTab from "@/components/tours/TourOptionalActivityTab";
import CancellationPolicySection from "@/components/tours/CancellationPolicySection";
import TourGalleryTab from "@/components/tours/TourGalleryTab";
import TourPricingTab from "@/components/tours/TourPricingTab";
import TourCalendarTab from "@/components/tours/TourCalendarTab";
import TourExtensionsTab from "@/components/tours/TourExtensionsTab";
import TourDiscountsTab from "@/components/tours/TourDiscountsTab";
import TourSimilarTab from "@/components/tours/TourSimilarTab";

type Tour = {
  [key: string]: unknown;
  id: number;
  tour_code: string;
  slug: string;
  title: string;
  status: string;
};

const PRIMARY_STEPS = [
  { key: "basic", label: "Basic Details" },
  { key: "location", label: "Location & Category" },
  { key: "overview", label: "Overview & Highlights" },
  { key: "itinerary", label: "Itinerary" },
  { key: "pricing", label: "Pricing" },
  { key: "accommodation", label: "Accommodation" },
  { key: "activities", label: "Activities & Add-ons" },
  { key: "policies", label: "Inclusions & Policies" },
  { key: "media", label: "Gallery & Media/SEO" },
  { key: "review", label: "Review & Submit" },
];

const SECONDARY_TABS = [
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

export default function TourWizard({ tourId, role }: { tourId?: string; role: "admin" | "supplier" }) {
  const router = useRouter();
  const isSupplier = role === "supplier";
  const basePath = isSupplier ? "/supplier/tours" : "/admin/tours";

  const [group, setGroup] = useState<"primary" | "secondary">("primary");
  const [activeIndex, setActiveIndex] = useState(0);

  const [tour, setTour] = useState<Tour | null>(null);
  const [loadingTour, setLoadingTour] = useState(Boolean(tourId));
  const [fetchError, setFetchError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchTour = useCallback(async (showLoading = true) => {
    if (!tourId) return;
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
    if (!tourId) return;
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

  // Create mode: no tour yet, only the essentials form can be shown.
  if (!tourId) {
    return (
      <>
        <TourWorkspaceHeader
          role={role}
          title="Create New Tour"
          description="Start with the essentials below. Saving creates the tour and unlocks the full 10-step editor for itinerary, pricing, media, and more."
          icon={MapPinned}
          eyebrow={isSupplier ? "Tour Builder" : "Admin Tour Builder"}
          actions={[{ label: isSupplier ? "Back to My Tours" : "Back to Tours", href: basePath, icon: ArrowLeft, variant: "secondary" }]}
        />
        <div className="mt-4">
          <TourFormPage
            embedded
            role={role}
            sections={["basic"]}
            onSaved={(saved) => {
              const id = (saved as { id?: number } | undefined)?.id;
              router.push(id ? `${basePath}/${id}/edit` : basePath);
            }}
          />
        </div>
      </>
    );
  }

  if (loadingTour) {
    return (
      <>
        <div className="h-32 animate-pulse rounded-2xl border border-dash-border bg-white" />
        <div className="mt-4 h-14 animate-pulse rounded-2xl border border-dash-border bg-white" />
        <div className="mt-4 h-[520px] animate-pulse rounded-2xl border border-dash-border bg-white" />
      </>
    );
  }

  if (fetchError) {
    return (
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
    );
  }

  const canSubmit =
    isSupplier &&
    tour &&
    ["draft", "rejected"].includes((tour.status ?? "").toLowerCase()) &&
    !submitSuccess;
  const activeKey = group === "primary" ? PRIMARY_STEPS[activeIndex].key : SECONDARY_TABS[activeIndex].key;

  return (
    <>
      <TourWorkspaceHeader
        role={role}
        title={tour?.title ?? "Edit Tour"}
        description="Complete the 10-step editor below. Each step saves independently, so you can leave and come back anytime."
        icon={MapPinned}
        eyebrow={tour?.tour_code ? `Tour Editor · ${tour.tour_code}` : "Tour Editor"}
        actions={[
          { label: isSupplier ? "My Tours" : "Back to Tours", href: basePath, icon: ArrowLeft, variant: "secondary" },
          ...(isSupplier ? [{ label: "Preview", href: `/supplier/tours/${tourId}/preview`, icon: Eye, variant: "secondary" as const }] : []),
        ]}
      >
        <div className="flex flex-wrap items-center gap-2">
          {tour?.status && (
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColors(tour.status)}`}>
              {tour.status.replaceAll("_", " ")}
            </span>
          )}
          <span className="text-[11px] text-dash-muted">Changes save inside each section below.</span>
        </div>
      </TourWorkspaceHeader>

      {submitError && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <AlertCircle size={16} />
          {submitError}
        </div>
      )}

      <TourWorkspaceTabs
        role={role}
        tabs={PRIMARY_STEPS}
        activeIndex={group === "primary" ? activeIndex : -1}
        onSelect={(index) => { setGroup("primary"); setActiveIndex(index); }}
      />

      <div className="mt-6 flex items-center gap-3 px-1">
        <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-wide text-dash-subtle">Marketing & availability</span>
        <div className="h-px flex-1 bg-dash-border" />
      </div>
      <TourWorkspaceTabs
        role={role}
        tabs={SECONDARY_TABS}
        activeIndex={group === "secondary" ? activeIndex : -1}
        onSelect={(index) => { setGroup("secondary"); setActiveIndex(index); }}
      />

      <TourWorkspaceContent role={role}>
        {activeKey === "basic" && <TourFormPage tourId={tourId} embedded role={role} sections={["basic"]} initialData={tour ?? undefined} onSaved={() => fetchTour(false)} />}
        {activeKey === "location" && <TourFormPage tourId={tourId} embedded role={role} sections={["location"]} initialData={tour ?? undefined} onSaved={() => fetchTour(false)} />}
        {activeKey === "overview" && (
          <div className="space-y-6">
            <TourOverviewTab tourId={tourId} />
            <TourHighlightsTab tourId={tourId} />
          </div>
        )}
        {activeKey === "itinerary" && <TourItineraryTab tourId={tourId} />}
        {activeKey === "pricing" && (
          <div className="space-y-6">
            <TourFormPage tourId={tourId} embedded role={role} sections={["pricing"]} initialData={tour ?? undefined} onSaved={() => fetchTour(false)} />
            <TourPricingTab tourId={tourId} />
          </div>
        )}
        {activeKey === "accommodation" && <TourAccommodationExtraTab tourId={tourId} />}
        {activeKey === "activities" && <TourOptionalActivityTab tourId={tourId} />}
        {activeKey === "policies" && (
          <div className="space-y-6">
            <TourItemsTab tourId={tourId} segment="inclusions" label="Inclusions" />
            <TourItemsTab tourId={tourId} segment="exclusions" label="Exclusions" />
            <CancellationPolicySection tourId={tourId} />
          </div>
        )}
        {activeKey === "media" && (
          <div className="space-y-6">
            <TourGalleryTab tourId={tourId} />
            <TourFormPage tourId={tourId} embedded role={role} sections={["media-seo"]} initialData={tour ?? undefined} onSaved={() => fetchTour(false)} />
          </div>
        )}
        {activeKey === "review" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-dash-border bg-white p-6">
              <h2 className="text-xl font-bold text-dash-text">Review & Submit</h2>
              <p className="mt-1 text-sm text-dash-subtle">
                {isSupplier
                  ? "Once every section looks right, submit this tour for admin review. You can keep editing drafts and resubmit if changes are requested."
                  : "Approvals happen from the Tour Approval queue, so changes from suppliers get a deliberate review step before going live."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {isSupplier ? (
                  <>
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
                    <a href={`/supplier/tours/${tourId}/preview`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-xs font-black text-dash-body hover:bg-dash-bg">
                      <Eye size={15} /> Preview
                    </a>
                  </>
                ) : (
                  <>
                    <a href="/admin/tour-approval" className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-dash-brand-hover">
                      <SendHorizontal size={15} /> Go to Tour Approval queue
                    </a>
                    {tour?.slug && (
                      <a href={`/tours/${tourId}/${tour.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-xs font-black text-dash-body hover:bg-dash-bg">
                        <Eye size={15} /> Preview public page
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeKey === "calendar" && <TourCalendarTab tourId={tourId} />}
        {activeKey === "extensions" && <TourExtensionsTab tourId={tourId} />}
        {activeKey === "discounts" && <TourDiscountsTab tourId={tourId} />}
        {activeKey === "similar" && <TourSimilarTab tourId={tourId} />}
      </TourWorkspaceContent>
    </>
  );
}
