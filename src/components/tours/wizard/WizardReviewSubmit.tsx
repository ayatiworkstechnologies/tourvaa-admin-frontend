"use client";

import {
  LuCheck as Check,
  LuCircleCheckBig as CheckCircle2,
  LuClipboardList as ClipboardList,
  LuEye as Eye,
  LuLoaderCircle as Loader2,
  LuPencil as Pencil,
  LuRotateCcw as RotateCcw,
  LuSendHorizontal as SendHorizontal,
  LuTriangleAlert as AlertTriangle,
} from "react-icons/lu";
import Link from "next/link";
import { theme, type TourWorkspaceRole } from "@/components/tours/TourWorkspace";
import { REVIEWABLE_STEPS } from "./steps";
import type { StepStatus } from "./WizardSidebar";

const STATUS_BADGE: Record<StepStatus, { label: string; className: string; icon: React.ElementType | null }> = {
  complete: { label: "Complete", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: Check },
  missing: { label: "Missing information", className: "border-amber-200 bg-amber-50 text-amber-700", icon: AlertTriangle },
  optional: { label: "Optional · not added", className: "border-dash-border bg-dash-bg text-dash-subtle", icon: null },
  "not-started": { label: "Not started", className: "border-dash-border bg-dash-bg text-dash-subtle", icon: null },
};

export function WizardReviewSubmit({
  role,
  tourId,
  basePath,
  isSupplier,
  status,
  statuses,
  onEditStep,
  canSubmit,
  submitting,
  submitSuccess,
  submitError,
  onSubmitForApproval,
  canWithdraw,
  withdrawing,
  onWithdraw,
  hasPendingReview,
}: {
  role: TourWorkspaceRole;
  tourId: string;
  basePath: string;
  isSupplier: boolean;
  status: string;
  statuses: Record<number, StepStatus>;
  onEditStep: (index: number) => void;
  canSubmit: boolean;
  submitting: boolean;
  submitSuccess: boolean;
  submitError: string;
  onSubmitForApproval: () => void;
  canWithdraw: boolean;
  withdrawing: boolean;
  onWithdraw: () => void;
  hasPendingReview: boolean;
}) {
  const colors = theme[role];
  const statusValues = REVIEWABLE_STEPS.map((_, index) => statuses[index] ?? "not-started");
  const completeCount = statusValues.filter((s) => s === "complete").length;
  const missingCount = statusValues.filter((s) => s === "missing").length;
  const completionPct = REVIEWABLE_STEPS.length ? Math.round((completeCount / REVIEWABLE_STEPS.length) * 100) : 0;
  const isLiveTour = ["active", "published"].includes((status ?? "").toLowerCase());

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border bg-white p-5 sm:p-6 ${colors.contentBorder}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${role === "supplier" ? "bg-emerald-50 text-emerald-700" : "bg-[#EDF5FF] text-dash-brand-hover"}`}>
              <ClipboardList size={18} />
            </span>
            <div>
              <h2 className="text-xl font-black text-dash-text">Review every section</h2>
              <p className="mt-1 text-sm text-dash-subtle">
                {missingCount > 0
                  ? `${missingCount} section${missingCount > 1 ? "s" : ""} could use more information before you submit. Nothing below blocks saving a draft.`
                  : "Everything looks complete. Review each section below, then submit when you're ready."}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-2xl font-black ${colors.progressText}`}>{completeCount}/{REVIEWABLE_STEPS.length}</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-dash-subtle">Complete</p>
          </div>
        </div>

        <div className={`mt-4 h-1.5 w-full overflow-hidden rounded-full ${colors.track}`}>
          <div className={`h-full rounded-full transition-[width] duration-500 ease-out ${colors.progressBar}`} style={{ width: `${completionPct}%` }} />
        </div>

        <ul className="mt-5 divide-y divide-dash-border-soft">
          {REVIEWABLE_STEPS.map((step, index) => {
            const stepStatus = statuses[index] ?? "not-started";
            const badge = STATUS_BADGE[stepStatus];
            const Icon = badge.icon;
            return (
              <li key={step.id} className="flex items-center justify-between gap-3 rounded-lg px-1 py-3 transition-colors hover:bg-dash-bg/60">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-xs font-black text-dash-subtle">{step.number}</span>
                  <span className="truncate text-sm font-bold text-dash-text">{step.label}</span>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${badge.className}`}>
                    {Icon && <Icon size={11} />}
                    {badge.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditStep(index)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-dash-border px-3 py-1.5 text-xs font-bold text-dash-body transition-colors hover:bg-dash-bg"
                >
                  <Pencil size={12} /> Edit
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={`rounded-2xl border bg-white p-5 sm:p-6 ${colors.contentBorder}`}>
        <h2 className="text-xl font-bold text-dash-text">
          {isSupplier ? (isLiveTour ? "Submit changes for review" : "Submit for approval") : "Save & update"}
        </h2>

        {isSupplier && isLiveTour && (
          <p className="mt-1 text-sm text-dash-subtle">
            Your changes will be sent for review. The currently published tour will remain visible to customers until your changes are approved.
          </p>
        )}
        {isSupplier && !isLiveTour && (
          <p className="mt-1 text-sm text-dash-subtle">
            Once every section looks right, submit this tour for admin review. You can keep editing drafts and resubmit if changes are requested.
          </p>
        )}
        {!isSupplier && (
          <p className="mt-1 text-sm text-dash-subtle">
            Every section already saves independently as you go. Approvals for supplier submissions happen from the Tour Approval queue.
          </p>
        )}

        {isSupplier && isLiveTour && hasPendingReview && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            <AlertTriangle size={16} /> Your latest edits are already staged for admin review — no separate submit step is needed.
          </div>
        )}

        {submitError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {submitError}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {isSupplier ? (
            <>
              {canSubmit && (
                <button
                  type="button"
                  onClick={onSubmitForApproval}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#16833A] px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-100 hover:bg-[#117331] disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <SendHorizontal size={15} />}
                  {submitting ? "Submitting…" : "Submit for Approval"}
                </button>
              )}
              {submitSuccess && (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                  <CheckCircle2 size={15} /> Submitted for approval!
                </span>
              )}
              {canWithdraw && (
                <button
                  type="button"
                  onClick={onWithdraw}
                  disabled={withdrawing}
                  className="inline-flex items-center gap-2 rounded-xl border border-dash-border bg-white px-4 py-2.5 text-xs font-black text-dash-body hover:bg-dash-bg disabled:opacity-60"
                >
                  {withdrawing ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                  Withdraw Submission
                </button>
              )}
              <Link href={`/supplier/tours/${tourId}/preview`} target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-xs font-black text-dash-body hover:bg-dash-bg">
                <Eye size={15} /> Preview
              </Link>
              <Link href={basePath} className="ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-dash-body hover:bg-dash-bg">
                Done for now
              </Link>
            </>
          ) : (
            <>
              <Link href="/admin/tour-approval" className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-dash-brand-hover">
                <SendHorizontal size={15} /> Go to Tour Approval queue
              </Link>
              <Link href={basePath} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-xs font-black text-dash-body hover:bg-dash-bg">
                Update Tour · Back to Tours
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
