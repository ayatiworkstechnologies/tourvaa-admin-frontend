"use client";

import { LuCheck as Check, LuTriangleAlert as AlertTriangle } from "react-icons/lu";
import { theme, type TourWorkspaceRole } from "@/components/tours/TourWorkspace";
import type { StepStatus, WizardStepDef } from "./steps";

/** Compact step navigator for the tour editor: a narrow sticky column beside
 * the form on desktop, a single dropdown on small screens. No top bar, so the
 * form starts right under the page header. */
export function WizardSideStepper({
  role,
  activeIndex,
  visitedIndexes,
  statuses,
  onSelect,
  steps,
  disabled = false,
}: {
  role: TourWorkspaceRole;
  activeIndex: number;
  visitedIndexes: Set<number>;
  /** Per-step index status, from useStepCompletion. Absent = not evaluated (e.g. review step). */
  statuses: Record<number, StepStatus>;
  onSelect: (index: number) => void;
  /** Role-filtered wizard steps supplied by the parent editor. */
  steps: WizardStepDef[];
  /** Create mode: only the first step is usable until the tour exists. */
  disabled?: boolean;
}) {
  const colors = theme[role];

  return (
    <>
      {/* Small screens: one dropdown instead of a bar */}
      <div className="lg:hidden">
        <label className="sr-only" htmlFor="wizard-step-select">Step</label>
        <select
          id="wizard-step-select"
          value={activeIndex}
          disabled={disabled}
          onChange={(e) => onSelect(Number(e.target.value))}
          className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-bold text-dash-text outline-none ${colors.contentBorder}`}
        >
          {steps.map((step, index) => (
            <option key={step.id} value={index}>
              {step.number} · {step.label}
            </option>
          ))}
        </select>
      </div>

      <nav
        aria-label="Tour editor steps"
        className={`sticky top-4 hidden w-52 shrink-0 self-start rounded-2xl border bg-white p-2 shadow-[0_8px_24px_-22px_rgba(24,76,140,.7)] lg:block ${colors.contentBorder}`}
      >
        <ol className="space-y-0.5">
          {steps.map((step, index) => {
            const active = index === activeIndex;
            const visited = visitedIndexes.has(index);
            const status = statuses[index];
            const locked = disabled && !active;

            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => !locked && onSelect(index)}
                  aria-current={active ? "step" : undefined}
                  aria-disabled={locked || undefined}
                  title={locked ? "Save the basics first to unlock this step" : step.description}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition ${
                    locked ? "cursor-not-allowed opacity-40" : ""
                  } ${active ? colors.progressActive : "hover:bg-dash-bg"}`}
                >
                  <span
                    className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black transition-colors ${
                      active || visited ? colors.progressNumber : colors.progressMuted
                    }`}
                  >
                    {step.number}
                    {visited && !active && status === "complete" && (
                      <span className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-white">
                        <Check size={7} strokeWidth={3} />
                      </span>
                    )}
                    {visited && !active && status === "missing" && (
                      <span className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-white">
                        <AlertTriangle size={7} strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[11.5px] font-bold leading-tight ${active ? colors.progressText : "text-dash-body"}`}>
                      {step.label}
                    </span>
                    {step.optional && <span className="block text-[9.5px] font-semibold leading-tight text-dash-subtle">Optional</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
