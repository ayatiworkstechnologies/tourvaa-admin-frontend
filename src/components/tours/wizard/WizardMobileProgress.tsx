"use client";

import { theme, type TourWorkspaceRole } from "@/components/tours/TourWorkspace";
import { WIZARD_STEPS } from "./steps";

export function WizardMobileProgress({
  role,
  activeIndex,
}: {
  role: TourWorkspaceRole;
  activeIndex: number;
}) {
  const colors = theme[role];
  const step = WIZARD_STEPS[activeIndex];
  const progressPct = WIZARD_STEPS.length > 1 ? (activeIndex / (WIZARD_STEPS.length - 1)) * 100 : 0;

  return (
    <div className={`mt-4 rounded-2xl border bg-white p-4 shadow-[0_8px_24px_-22px_rgba(24,76,140,.7)] lg:hidden ${colors.contentBorder}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[11px] font-black uppercase tracking-[.1em] ${colors.progressText}`}>
          Step {activeIndex + 1} of {WIZARD_STEPS.length}
        </span>
        <span className="truncate text-[11px] font-bold text-dash-subtle">{step.label}</span>
      </div>
      <div className={`relative mt-2.5 h-1.5 w-full overflow-hidden rounded-full ${colors.track}`}>
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${colors.progressBar}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
