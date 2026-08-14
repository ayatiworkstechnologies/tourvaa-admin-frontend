"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuCircleAlert as AlertCircle,
  LuArrowLeft as ArrowLeft,
  LuArrowRight as ArrowRight,
  LuCircleCheckBig as CheckCircle2,
  LuEye as Eye,
  LuLoaderCircle as Loader2,
  LuMapPinned as MapPinned,
  LuRotateCcw as RotateCcw,
  LuSendHorizontal as SendHorizontal,
} from "react-icons/lu";

import api from "@/lib/api/client";
import TourFormPage from "@/components/cms/TourFormPage";
import {
  TourWorkspaceContent,
  TourWorkspaceHeader,
  TourWorkspaceStepper,
  TourWorkspaceTabs,
} from "@/components/tours/TourWorkspace";
import TourOverviewTab from "@/components/tours/TourOverviewTab";
import PhysicalRatingField from "@/components/tours/PhysicalRatingField";
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
  pending_review_kind?: string | null;
};

type ReviewComment = {
  id: number;
  section: string;
  field_name?: string | null;
  comment: string;
  severity: string;
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
  if (["pending", "pending_approval", "submitted", "draft", "repricing_required"].includes(value))
    return "border-amber-200 bg-amber-50 text-amber-700";
  if (["rejected", "cancelled"].includes(value))
    return "border-red-200 bg-red-50 text-red-600";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

const SEVERITY_STYLES: Record<string, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-700",
  minor: "border-slate-200 bg-slate-50 text-slate-700",
  required: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
};

// While a published tour has a pending review (see backend
// tour_versions._stage_pending_version), Tour.status deliberately stays
// "published" so it never leaves the public site mid-review -- this derives
// the badge/banner the wizard actually needs to show from that plus
// pending_review_kind, instead of reading Tour.status alone.
function reviewBanner(tour: Tour): { label: string; message: string } | null {
  if (tour.status !== "published" || !tour.pending_review_kind) return null;
  if (tour.pending_review_kind === "repricing_required") {
    return {
      label: "Repricing Required",
      message: "Supplier pricing changed. The published price stays active until an admin recalculates and approves it.",
    };
  }
  return {
    label: "Unpublished Changes",
    message: "The published version remains live while this update is being reviewed.",
  };
}

export default function TourWizard({ tourId, role }: { tourId?: string; role: "admin" | "supplier" }) {
  const router = useRouter();
  const isSupplier = role === "supplier";
  const basePath = isSupplier ? "/supplier/tours" : "/admin/tours";

  const [group, setGroup] = useState<"primary" | "secondary">("primary");
  const [activeIndex, setActiveIndex] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));

  const selectPrimaryStep = (index: number) => {
    setGroup("primary");
    setActiveIndex(index);
    setVisitedSteps((prev) => new Set(prev).add(index));
  };

  const [tour, setTour] = useState<Tour | null>(null);
  const [loadingTour, setLoadingTour] = useState(Boolean(tourId));
  const [fetchError, setFetchError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [comments, setComments] = useState<ReviewComment[]>([]);

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

  const fetchComments = useCallback(async () => {
    if (!tourId) return;
    try {
      const response = await api.get(`/tours/${tourId}/review-comments`, { params: { status: "open" } });
      setComments(response.data?.data ?? []);
    } catch {
      // Non-critical -- the editor still works without visible feedback.
    }
  }, [tourId]);

  useEffect(() => {
    void fetchTour();
    void fetchComments();
  }, [fetchTour, fetchComments]);

  const resolveComment = async (commentId: number) => {
    if (!tourId) return;
    try {
      await api.patch(`/tours/${tourId}/review-comments/${commentId}/resolve`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // leave it in the list -- the user can retry
    }
  };

  const handleWithdraw = async () => {
    if (!tourId) return;
    setWithdrawing(true);
    try {
      await api.post(`/tours/${tourId}/withdraw`);
      await fetchTour(false);
    } catch {
      setSubmitError("Could not withdraw the submission. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  };

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

  // Create mode: no tour yet, only the essentials form can be shown. The
  // remaining 9 steps have nowhere to save to until a tour id exists, so the
  // stepper is shown read-only (step 1 active, the rest visibly locked)
  // purely to preview the flow ahead rather than as real navigation.
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
        <TourWorkspaceStepper
          role={role}
          steps={PRIMARY_STEPS}
          activeIndex={0}
          visitedIndexes={new Set()}
          onSelect={() => {}}
          disabled
        />
        <TourWorkspaceContent role={role} stepLabel={`Step 1 of ${PRIMARY_STEPS.length} · ${PRIMARY_STEPS[0].label}`}>
          <TourFormPage
            embedded
            role={role}
            sections={["basic"]}
            onSaved={(saved) => {
              const id = (saved as { id?: number } | undefined)?.id;
              router.push(id ? `${basePath}/${id}/edit` : basePath);
            }}
          />
        </TourWorkspaceContent>
        <p className="mt-3 text-center text-[11px] font-semibold text-dash-subtle">
          Steps 2–{PRIMARY_STEPS.length} unlock once you save the basics above.
        </p>
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
  const banner = tour ? reviewBanner(tour) : null;
  const canWithdraw =
    isSupplier &&
    tour &&
    (["pending_approval", "repricing_required"].includes((tour.status ?? "").toLowerCase()) || Boolean(banner));
  const activeKey = group === "primary" ? PRIMARY_STEPS[activeIndex].key : SECONDARY_TABS[activeIndex].key;
  const openCommentsForStep = comments.filter((c) => c.section === activeKey);

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
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColors(banner ? "pending_approval" : tour.status)}`}>
              {banner ? banner.label : tour.status.replaceAll("_", " ")}
            </span>
          )}
          <span className="text-[11px] text-dash-muted">
            {banner ? banner.message : "Changes save inside each section below."}
          </span>
          {canWithdraw && (
            <button
              type="button"
              onClick={() => void handleWithdraw()}
              disabled={withdrawing}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-dash-border bg-white px-3 py-1 text-xs font-bold text-dash-body hover:bg-dash-bg disabled:opacity-60"
            >
              {withdrawing ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
              Withdraw Submission
            </button>
          )}
        </div>
      </TourWorkspaceHeader>

      {submitError && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <AlertCircle size={16} />
          {submitError}
        </div>
      )}

      {group === "primary" ? (
        <TourWorkspaceStepper
          role={role}
          steps={PRIMARY_STEPS}
          activeIndex={activeIndex}
          visitedIndexes={visitedSteps}
          onSelect={selectPrimaryStep}
        />
      ) : (
        <TourWorkspaceTabs
          role={role}
          tabs={PRIMARY_STEPS}
          activeIndex={-1}
          onSelect={selectPrimaryStep}
        />
      )}

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

      {openCommentsForStep.length > 0 && (
        <div className="mt-4 space-y-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-amber-700">Admin feedback for this step</p>
          {openCommentsForStep.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-white p-3">
              <div className="min-w-0">
                <span className={`mr-2 rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${SEVERITY_STYLES[c.severity] ?? SEVERITY_STYLES.minor}`}>
                  {c.severity}
                </span>
                <span className="text-sm text-dash-body">{c.comment}</span>
              </div>
              <button
                type="button"
                onClick={() => void resolveComment(c.id)}
                className="shrink-0 rounded-lg border border-dash-border px-2.5 py-1 text-xs font-bold text-dash-subtle hover:bg-dash-bg"
              >
                Mark resolved
              </button>
            </div>
          ))}
        </div>
      )}

      <TourWorkspaceContent
        role={role}
        stepLabel={
          group === "primary"
            ? `Step ${activeIndex + 1} of ${PRIMARY_STEPS.length} · ${PRIMARY_STEPS[activeIndex].label}`
            : SECONDARY_TABS[activeIndex]?.label
        }
      >
        {activeKey === "basic" && (
          <TourFormPage
            tourId={tourId}
            embedded
            role={role}
            sections={["basic"]}
            initialData={tour ?? undefined}
            onSaved={() => fetchTour(false)}
            onGoToPricing={() => selectPrimaryStep(PRIMARY_STEPS.findIndex((s) => s.key === "pricing"))}
          />
        )}
        {activeKey === "location" && (
          <div className="space-y-6">
            <TourFormPage tourId={tourId} embedded role={role} sections={["location"]} initialData={tour ?? undefined} onSaved={() => fetchTour(false)} />
            <div className="rounded-2xl border border-dash-border-soft bg-white p-6 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
              <h2 className="text-xl font-black text-dash-text">Physical Rating</h2>
              <p className="mt-1 text-sm text-dash-subtle">How physically demanding this tour is for travellers.</p>
              <div className="mt-5">
                <PhysicalRatingField tourId={tourId} />
              </div>
            </div>
          </div>
        )}
        {activeKey === "overview" && (
          <div className="space-y-6">
            <TourOverviewTab tourId={tourId} />
            <TourHighlightsTab tourId={tourId} />
          </div>
        )}
        {activeKey === "itinerary" && <TourItineraryTab tourId={tourId} numberOfDays={tour?.number_of_days ? Number(tour.number_of_days) : undefined} />}
        {activeKey === "pricing" && <TourPricingTab tourId={tourId} role={role} />}
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

      {group === "primary" && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => selectPrimaryStep(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-dash-border bg-white px-4 py-2.5 text-xs font-black text-dash-body transition hover:bg-dash-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={15} /> Back
          </button>
          {activeIndex < PRIMARY_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => selectPrimaryStep(Math.min(PRIMARY_STEPS.length - 1, activeIndex + 1))}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:-translate-y-0.5 ${
                isSupplier ? "bg-[#16833A] shadow-emerald-200 hover:bg-[#117331]" : "bg-dash-brand shadow-blue-200 hover:bg-dash-brand-hover"
              }`}
            >
              Continue: {PRIMARY_STEPS[activeIndex + 1].label} <ArrowRight size={15} />
            </button>
          ) : (
            <span className="text-[11px] font-bold text-dash-subtle">You&apos;re on the last step.</span>
          )}
        </div>
      )}
    </>
  );
}
