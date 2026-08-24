"use client";

import { LuCheck as Check, LuTriangleAlert as AlertTriangle } from "react-icons/lu";
import { theme, type TourWorkspaceRole } from "@/components/tours/TourWorkspace";
import { WIZARD_STEPS } from "./steps";

export type StepStatus = "complete" | "missing" | "optional" | "not-started";

export function WizardSidebar({
  role,
  activeIndex,
  visitedIndexes,
  statuses,
  onSelect,
  disabled = false,
}: {
  role: TourWorkspaceRole;
  activeIndex: number;
  visitedIndexes: Set<number>;
  /** Per-step index status, from useStepCompletion. Absent = not evaluated (e.g. review step). */
  statuses: Record<number, StepStatus>;
  onSelect: (index: number) => void;
  disabled?: boolean;
}) {
  const colors = theme[role];
  const progressPct = WIZARD_STEPS.length > 1 ? (activeIndex / (WIZARD_STEPS.length - 1)) * 100 : 0;

  return (
    <nav
      aria-label="Tour wizard steps"
      className={`sticky top-4 hidden w-72 shrink-0 self-start rounded-2xl border bg-white p-3 shadow-[0_8px_24px_-22px_rgba(24,76,140,.7)] lg:block ${colors.contentBorder}`}
    >
      <div className="px-2 pb-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] font-black uppercase tracking-[.1em] ${colors.progressText}`}>Step {activeIndex + 1} of {WIZARD_STEPS.length}</span>
        </div>
        <div className={`relative mt-2 h-1.5 w-full overflow-hidden rounded-full ${colors.track}`}>
          <div className={`h-full rounded-full transition-[width] duration-500 ease-out ${colors.progressBar}`} style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <ol className="relative space-y-1">
        {WIZARD_STEPS.map((step, index) => {
          const active = index === activeIndex;
          const visited = visitedIndexes.has(index);
          const status = statuses[index];
          const locked = disabled && !active;
          const isLast = index === WIZARD_STEPS.length - 1;

          return (
            <li key={step.id} className="relative">
              {!isLast && (
                <span className={`absolute left-[26px] top-9 h-[calc(100%-14px)] w-px ${visited || active ? colors.progressBar : "bg-dash-border"} opacity-30`} aria-hidden="true" />
              )}
              <button
                type="button"
                onClick={() => !locked && onSelect(index)}
                aria-current={active ? "step" : undefined}
                aria-disabled={locked || undefined}
                title={locked ? "Save the basics first to unlock this step" : undefined}
                className={`relative flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  locked ? "cursor-not-allowed opacity-40" : ""
                } ${active ? colors.progressActive : "hover:bg-dash-bg"}`}
              >
                <span
                  className={`relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-colors ${
                    active || visited ? colors.progressNumber : colors.progressMuted
                  }`}
                >
                  {step.number}
                  {visited && !active && status === "complete" && (
                    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-white">
                      <Check size={8} strokeWidth={3} />
                    </span>
                  )}
                  {visited && !active && status === "missing" && (
                    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-white">
                      <AlertTriangle size={8} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className={`block truncate text-[12.5px] font-bold ${active ? colors.progressText : "text-dash-body"}`}>
                    {step.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-dash-subtle">
                    {active
                      ? "Current step"
                      : status === "complete"
                        ? "Complete"
                        : status === "missing"
                          ? "Missing information"
                          : status === "optional"
                            ? "Optional"
                            : "Not started"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
