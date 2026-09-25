"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConfirm } from "@/hooks/useConfirm";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LuArrowLeft as ArrowLeft,
  LuArrowRight as ArrowRight,
  LuSave as Save,
  LuCircleAlert as AlertCircle,
  LuEye as Eye,
  LuCompass as MapPinned,
  LuRotateCcw as RotateCcw,
  LuLoaderCircle as Loader2,
} from "react-icons/lu";

import api from "@/lib/api/client";
import TourFormPage from "@/components/cms/TourFormPage";
import { TourWorkspaceContent, TourWorkspaceHeader } from "@/components/tours/TourWorkspace";
import { WizardSideStepper } from "@/components/tours/wizard/WizardSideStepper";
import { WizardStickyActionBar, type WizardBarButton } from "@/components/tours/wizard/WizardStickyActionBar";
import { WizardReviewSubmit } from "@/components/tours/wizard/WizardReviewSubmit";
import { useStepCompletion } from "@/components/tours/wizard/useStepCompletion";
import { WIZARD_STEPS } from "@/components/tours/wizard/steps";
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

// Persistent forms per step (see saveCurrentStep in TourWizard).
const STEP_FORM_IDS: Record<string, string[]> = {
  basic: ["wizard-form-basic"],
  location: ["wizard-form-location", "wizard-form-overview"],
  media: ["wizard-form-media"],
  settings: ["wizard-form-settings"],
  seo: ["wizard-form-seo"],
};

export default function TourWizard({ tourId, role }: { tourId?: string; role: "admin" | "supplier" }) {
  const router = useRouter();
  const isSupplier = role === "supplier";
  const basePath = isSupplier ? "/supplier/tours" : "/admin/tours";

  // The current step lives in the URL (?step=pricing) so a refresh or a shared
  // link lands on the same step, and a freshly created tour opens on step 2.
  const searchParams = useSearchParams();
  const initialStep = Math.max(0, WIZARD_STEPS.findIndex((st) => st.id === searchParams.get("step")));
  const [activeIndex, setActiveIndex] = useState(initialStep);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([initialStep]));
  const { confirm, dialog } = useConfirm();
  // True once a persistent form on the current step has been edited and not yet
  // saved; navigation asks before throwing those edits away.
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  // "Save & Next" bookkeeping (see saveCurrentStep): forms still to report saved, and whether to advance.
  const [pendingSaves, setPendingSaves] = useState(0);
  const [advanceAfterSave, setAdvanceAfterSave] = useState(false);

  const moveToStep = useCallback((index: number) => {
    setActiveIndex(index);
    setVisitedSteps((prev) => new Set(prev).add(index));
    setDirty(false);
    setSavedAt(null);
    setPendingSaves(0);
    setAdvanceAfterSave(false);
    window.history.replaceState(null, "", `?step=${WIZARD_STEPS[index].id}`);
  }, []);

  const selectStep = useCallback(async (index: number) => {
    if (index === activeIndex) return;
    if (dirty) {
      const leave = await confirm({
        title: "Unsaved changes",
        message: "You have changes on this step that haven't been saved. Leave without saving them?",
        confirmLabel: "Leave without saving",
        cancelLabel: "Stay and save",
        danger: true,
      });
      if (!leave) return;
    }
    moveToStep(index);
  }, [activeIndex, dirty, confirm, moveToStep]);

  const goNext = useCallback(() => {
    void selectStep(Math.min(WIZARD_STEPS.length - 1, activeIndex + 1));
  }, [activeIndex, selectStep]);

  // Browser refresh/close with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Only the step's persistent forms count (not the add/edit dialogs, which save themselves).
  const trackEdit = useCallback((e: React.SyntheticEvent) => {
    if ((e.target as HTMLElement).closest('form[id^="wizard-form-"]')) setDirty(true);
  }, []);

  // One Save per step. Steps whose content is a persistent form list its form
  // ids here; the Save button submits all of them together. Every other step
  // saves per item through its own add/edit dialog (pricing slabs, itinerary
  // days, gallery uploads, ...), so it has no Save button - only Previous/Next.
  const stepFormIds = useMemo(
    () => STEP_FORM_IDS[WIZARD_STEPS[activeIndex]?.id] ?? [],
    [activeIndex],
  );

  // "Save & Next": advance only once every form on the step has saved (a form
  // that fails validation never reports saved, so we stay and show its errors).

  const saveCurrentStep = useCallback((advance = false) => {
    setPendingSaves(stepFormIds.length);
    setAdvanceAfterSave(advance);
    for (const id of stepFormIds) (document.getElementById(id) as HTMLFormElement | null)?.requestSubmit();
  }, [stepFormIds]);

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
    setDirty(false);
    setSavedAt(new Date());
    void fetchTour(false);
    void refreshCompletion();
    setPendingSaves((n) => Math.max(0, n - 1));
  }, [fetchTour, refreshCompletion]);

  useEffect(() => {
    if (advanceAfterSave && pendingSaves === 0) {
      setAdvanceAfterSave(false);
      goNext();
    }
  }, [advanceAfterSave, pendingSaves, goNext]);

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
          <WizardSideStepper role={role} activeIndex={0} visitedIndexes={new Set()} statuses={{}} onSelect={() => {}} disabled />
          <div className="min-w-0 flex-1">
            <TourWorkspaceContent role={role} stepLabel={`Step ${WIZARD_STEPS[0].number} of ${WIZARD_STEPS.length} · ${WIZARD_STEPS[0].label}`}>
              <TourFormPage
                embedded
                role={role}
                sections={["basic-core"]}
                formId="wizard-form-create"
                onSaved={(saved) => {
                  const id = (saved as { id?: number } | undefined)?.id;
                  router.push(id ? `${basePath}/${id}/edit?step=location` : basePath);
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
  const openCommentsForStep = comments.filter((c) => activeStep.reviewSections.includes(c.section));
  const isFirstStep = activeIndex === 0;
  const isReviewStep = activeKey === "review";

  const saveLabel = isSupplier ? "Save Changes" : "Save Draft";
  const stepHasSave = stepFormIds.length > 0;

  const leftButtons: WizardBarButton[] = [
    { key: "prev", label: "Previous", icon: ArrowLeft, variant: "secondary", disabled: isFirstStep, onClick: () => void selectStep(Math.max(0, activeIndex - 1)) },
  ];
  const rightButtons: WizardBarButton[] = [];
  if (!isReviewStep) {
    if (stepHasSave) {
      rightButtons.push({ key: "save", label: saveLabel, icon: Save, variant: "secondary", onClick: () => saveCurrentStep(false) });
      rightButtons.push({ key: "next", label: "Save & Next", icon: ArrowRight, variant: "primary", onClick: () => saveCurrentStep(true) });
    } else {
      rightButtons.push({ key: "next", label: "Next", icon: ArrowRight, variant: "primary", onClick: goNext });
    }
  }
  const barHint = isReviewStep
    ? undefined
    : stepHasSave
      ? dirty
        ? "You have unsaved changes on this step."
        : savedAt
          ? `Saved at ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : "Save keeps you here; Save & Next saves and moves on."
      : "Items on this step save as you add or edit them.";

  return (
    <>
      <TourWorkspaceHeader
        role={role}
        title={tour?.title ?? "Edit Tour"}
          description="Use the steps on the left to move through the editor. Each step has one Save button, and Next moves on without saving."
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

      {dialog}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        <WizardSideStepper role={role} activeIndex={activeIndex} visitedIndexes={visitedSteps} statuses={statuses} onSelect={(i) => void selectStep(i)} />
        <div className="min-w-0 flex-1">

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

          <div onInputCapture={trackEdit} onChangeCapture={trackEdit}>
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
                onGoToPricing={() => void selectStep(WIZARD_STEPS.findIndex((s) => s.id === "pricing"))}
              />
            )}
            {activeKey === "location" && (
              <div className="space-y-6">
                <TourFormPage tourId={tourId} embedded role={role} sections={["location"]} formId="wizard-form-location" initialData={tour ?? undefined} onSaved={afterFormSaved} />
                <TourOverviewTab tourId={tourId} embedded onSaved={afterFormSaved} />
                <TourHighlightsTab tourId={tourId} />
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
            {activeKey === "extras" && (
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
            {activeKey === "settings" && (
              <div className="space-y-6">
                <TourFormPage tourId={tourId} embedded role={role} sections={["settings"]} formId="wizard-form-settings" initialData={tour ?? undefined} onSaved={afterFormSaved} />
                <CancellationPolicySection tourId={tourId} />
              </div>
            )}
            {activeKey === "seo" && (
              <TourFormPage tourId={tourId} embedded role={role} sections={["seo"]} formId="wizard-form-seo" initialData={tour ?? undefined} onSaved={afterFormSaved} />
            )}
            {activeKey === "review" && tour && (
              <WizardReviewSubmit
                role={role}
                tourId={tourId}
                basePath={basePath}
                isSupplier={isSupplier}
                status={String(tour.status ?? "")}
                statuses={statuses}
                onEditStep={(i) => void selectStep(i)}
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
          </div>

          <WizardStickyActionBar role={role} left={leftButtons} right={rightButtons} hint={barHint} />
        </div>
      </div>
    </>
  );
}
