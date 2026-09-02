"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuArrowLeft as ArrowLeft,
  LuArrowRight as ArrowRight,
  LuCircleAlert as AlertCircle,
  LuEye as Eye,
  LuCompass as MapPinned,
  LuRotateCcw as RotateCcw,
  LuLoaderCircle as Loader2,
} from "react-icons/lu";

import api from "@/lib/api/client";
import TourFormPage from "@/components/cms/TourFormPage";
import { TourWorkspaceContent, TourWorkspaceHeader } from "@/components/tours/TourWorkspace";
import { WizardSidebar } from "@/components/tours/wizard/WizardSidebar";
import { WizardMobileProgress } from "@/components/tours/wizard/WizardMobileProgress";
import { WizardStickyActionBar, type WizardBarButton } from "@/components/tours/wizard/WizardStickyActionBar";
import { WizardReviewSubmit } from "@/components/tours/wizard/WizardReviewSubmit";
import { useStepCompletion } from "@/components/tours/wizard/useStepCompletion";
import { WIZARD_STEPS } from "@/components/tours/wizard/steps";
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
      label: "Pricing Updated",
      message: "Supplier pricing changed and is already live. Admin still needs to review and approve the change.",
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

  const [activeIndex, setActiveIndex] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  // Set right before an external "Save & Continue" button submits a
  // TourFormPage-backed step via the HTML `form` attribute -- read inside
  // that step's onSaved to decide whether to also advance, so the same
  // in-form "Save" button (which should NOT jump steps) and the wizard's
  // external continue button (which SHOULD) can share one submit handler.
  // Plain state (not a ref) so it's never read/written from render output
  // construction -- only from effects/handlers.
  const [advanceAfterSave, setAdvanceAfterSave] = useState(false);

  const selectStep = useCallback((index: number) => {
    setActiveIndex(index);
    setVisitedSteps((prev) => new Set(prev).add(index));
  }, []);

  const goNext = useCallback(() => {
    selectStep(Math.min(WIZARD_STEPS.length - 1, activeIndex + 1));
  }, [activeIndex, selectStep]);

  // TourFormPage-backed steps have a real single form to submit; every
  // other step's data already saves per-row through its own add/edit
  // modal, so there is no separate batch "save" action there -- only
  // "Save & Continue" (navigate), matching how the rows actually persist.
  const currentFormId = ({ basic: "wizard-form-basic", location: "wizard-form-location", media: "wizard-form-media", seo: "wizard-form-seo" } as Record<string, string>)[WIZARD_STEPS[activeIndex]?.id];

  const submitCurrentForm = useCallback((advance: boolean) => {
    setAdvanceAfterSave(advance);
    (document.getElementById(currentFormId) as HTMLFormElement | null)?.requestSubmit();
  }, [currentFormId]);
  const submitCurrentFormAndSave = useCallback(() => submitCurrentForm(false), [submitCurrentForm]);
  const submitCurrentFormAndContinue = useCallback(() => submitCurrentForm(true), [submitCurrentForm]);

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

  const { statuses, refresh: refreshCompletion } = useStepCompletion(tourId, tour);

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

  const afterFormSaved = useCallback(() => {
    void fetchTour(false);
    void refreshCompletion();
    if (advanceAfterSave) {
      setAdvanceAfterSave(false);
      goNext();
    }
  }, [fetchTour, refreshCompletion, goNext, advanceAfterSave]);

  // Create mode: no tour yet, only the essentials form can be shown. The
  // remaining 11 steps have nowhere to save to until a tour id exists.
  if (!tourId) {
    return (
      <>
        <TourWorkspaceHeader
          role={role}
          title="Create New Tour"
          description="Start with the essentials below. Saving creates the tour and unlocks the full 12-step editor for itinerary, pricing, media, and more."
          icon={MapPinned}
          eyebrow={isSupplier ? "Tour Builder" : "Admin Tour Builder"}
          actions={[{ label: isSupplier ? "Back to My Tours" : "Back to Tours", href: basePath, icon: ArrowLeft, variant: "secondary" }]}
        />
        <div className="mt-4 flex flex-col gap-4 lg:flex-row">
          <WizardSidebar role={role} activeIndex={0} visitedIndexes={new Set()} statuses={{}} onSelect={() => {}} disabled />
          <div className="min-w-0 flex-1">
            <WizardMobileProgress role={role} activeIndex={0} />
            <TourWorkspaceContent role={role} stepLabel={`Step ${WIZARD_STEPS[0].number} of ${WIZARD_STEPS.length} · ${WIZARD_STEPS[0].label}`}>
              <TourFormPage
                embedded
                role={role}
                sections={["basic-core"]}
                formId="wizard-form-create"
                onSaved={(saved) => {
                  const id = (saved as { id?: number } | undefined)?.id;
                  router.push(id ? `${basePath}/${id}/edit` : basePath);
                }}
              />
            </TourWorkspaceContent>
            <WizardStickyActionBar
              role={role}
              left={[{ key: "cancel", label: "Cancel", onClick: () => router.push(basePath), variant: "ghost" }]}
              right={[
                {
                  key: "continue",
                  label: "Save & Continue",
                  icon: ArrowRight,
                  variant: "primary",
                  onClick: () => (document.getElementById("wizard-form-create") as HTMLFormElement | null)?.requestSubmit(),
                },
              ]}
            />
            <p className="mt-3 text-center text-[11px] font-semibold text-dash-subtle">
              Steps 2–{WIZARD_STEPS.length} unlock once you save the basics above.
            </p>
          </div>
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
  const banner = tour ? reviewBanner(tour) : null;
  const canWithdraw =
    isSupplier &&
    tour &&
    (["pending_approval", "repricing_required"].includes((tour.status ?? "").toLowerCase()) || Boolean(banner));
  const activeStep = WIZARD_STEPS[activeIndex];
  const activeKey = activeStep.id;
  const openCommentsForStep = comments.filter((c) => c.section === activeKey);
  const isFirstStep = activeIndex === 0;
  const isReviewStep = activeKey === "review";

  const saveLabel = isSupplier ? "Save Changes" : "Save Draft";

  const leftButtons: WizardBarButton[] = [
    { key: "prev", label: "Previous", icon: ArrowLeft, variant: "secondary", disabled: isFirstStep, onClick: () => selectStep(Math.max(0, activeIndex - 1)) },
  ];
  const rightButtons: WizardBarButton[] = [];
  if (!isReviewStep) {
    if (currentFormId) {
      rightButtons.push({ key: "save", label: saveLabel, variant: "secondary", onClick: submitCurrentFormAndSave });
      rightButtons.push({ key: "continue", label: "Save & Continue", icon: ArrowRight, variant: "primary", onClick: submitCurrentFormAndContinue });
    } else {
      rightButtons.push({ key: "continue", label: "Save & Continue", icon: ArrowRight, variant: "primary", onClick: goNext });
    }
  }

  return (
    <>
      <TourWorkspaceHeader
        role={role}
        title={tour?.title ?? "Edit Tour"}
        description="Complete the 12-step editor below. Each step saves independently, so you can leave and come back anytime."
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

      {tour?.status && ["pending_approval", "repricing_required"].includes((tour.status ?? "").toLowerCase()) && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">
            This tour has a submission awaiting admin review. Saving changes now will replace that pending version with a new one and restart the review — withdraw the current submission first if you want to keep it intact.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        <WizardSidebar role={role} activeIndex={activeIndex} visitedIndexes={visitedSteps} statuses={statuses} onSelect={selectStep} />
        <div className="min-w-0 flex-1">
          <WizardMobileProgress role={role} activeIndex={activeIndex} />

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

          <TourWorkspaceContent role={role} stepLabel={`Step ${activeStep.number} of ${WIZARD_STEPS.length} · ${activeStep.label}`}>
            {activeKey === "basic" && (
              <TourFormPage
                tourId={tourId}
                embedded
                role={role}
                sections={["basic-core"]}
                formId="wizard-form-basic"
                initialData={tour ?? undefined}
                onSaved={afterFormSaved}
                onGoToPricing={() => selectStep(WIZARD_STEPS.findIndex((s) => s.id === "pricing"))}
              />
            )}
            {activeKey === "overview" && (
              <div className="space-y-6">
                <TourOverviewTab tourId={tourId} />
                <TourHighlightsTab tourId={tourId} />
              </div>
            )}
            {activeKey === "location" && (
              <div className="space-y-6">
                <TourFormPage tourId={tourId} embedded role={role} sections={["location"]} formId="wizard-form-location" initialData={tour ?? undefined} onSaved={afterFormSaved} />
                <div className="rounded-2xl border border-dash-border-soft bg-white p-6 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
                  <h2 className="text-xl font-black text-dash-text">Physical Rating</h2>
                  <p className="mt-1 text-sm text-dash-subtle">How physically demanding this tour is for travellers.</p>
                  <div className="mt-5">
                    <PhysicalRatingField tourId={tourId} />
                  </div>
                </div>
              </div>
            )}
            {activeKey === "itinerary" && <TourItineraryTab tourId={tourId} numberOfDays={tour?.number_of_days ? Number(tour.number_of_days) : undefined} />}
            {activeKey === "pricing" && (
              <div className="space-y-6">
                <TourPricingTab tourId={tourId} role={role} tourStatus={tour?.status as string | undefined} />
                <div id="tour-discounts-section">
                  <TourDiscountsTab tourId={tourId} role={role} />
                </div>
              </div>
            )}
            {activeKey === "calendar" && <TourCalendarTab tourId={tourId} />}
            {activeKey === "accommodation" && (
              <div className="space-y-6">
                <TourAccommodationExtraTab tourId={tourId} />
                <TourOptionalActivityTab tourId={tourId} />
              </div>
            )}
            {activeKey === "extensions" && (
              <div className="space-y-6">
                <TourExtensionsTab tourId={tourId} />
                <TourSimilarTab tourId={tourId} />
              </div>
            )}
            {activeKey === "inclusions" && (
              <div className="space-y-6">
                <TourItemsTab tourId={tourId} segment="inclusions" label="Inclusions" />
                <TourItemsTab tourId={tourId} segment="exclusions" label="Exclusions" />
              </div>
            )}
            {activeKey === "media" && (
              <div className="space-y-6">
                <TourGalleryTab tourId={tourId} />
                <TourFormPage tourId={tourId} embedded role={role} sections={["media"]} formId="wizard-form-media" initialData={tour ?? undefined} onSaved={afterFormSaved} />
              </div>
            )}
            {activeKey === "seo" && (
              <div className="space-y-6">
                <TourFormPage tourId={tourId} embedded role={role} sections={["seo", "settings"]} formId="wizard-form-seo" initialData={tour ?? undefined} onSaved={afterFormSaved} />
                <CancellationPolicySection tourId={tourId} />
              </div>
            )}
            {activeKey === "review" && tour && (
              <WizardReviewSubmit
                role={role}
                tourId={tourId}
                basePath={basePath}
                isSupplier={isSupplier}
                status={String(tour.status ?? "")}
                statuses={statuses}
                onEditStep={selectStep}
                canSubmit={Boolean(canSubmit)}
                submitting={submitting}
                submitSuccess={submitSuccess}
                submitError={submitError}
                onSubmitForApproval={handleSubmitForApproval}
                canWithdraw={Boolean(canWithdraw)}
                withdrawing={withdrawing}
                onWithdraw={handleWithdraw}
                hasPendingReview={Boolean(banner)}
              />
            )}
          </TourWorkspaceContent>

          <WizardStickyActionBar role={role} left={leftButtons} right={rightButtons} />
        </div>
      </div>
    </>
  );
}
