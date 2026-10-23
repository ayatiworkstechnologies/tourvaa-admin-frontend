"use client";

import { useMemo } from "react";
import {
  LuCheck as Check,
  LuTriangleAlert as AlertTriangle,
  LuSparkles as Sparkles,
  LuCompass as Compass,
  LuCalendarDays as CalendarDays,
  LuImage as ImageIcon,
  LuRocket as Rocket,
} from "react-icons/lu";
import { theme, type TourWorkspaceRole } from "@/components/tours/TourWorkspace";
import type { StepStatus, WizardStepDef, WizardStepId } from "./steps";

type MilestoneGroup = {
  id: string;
  title: string;
  icon: typeof Compass;
  stepIds: WizardStepId[];
};

const MILESTONES: MilestoneGroup[] = [
  {
    id: "essentials",
    title: "Core Essentials",
    icon: Compass,
    stepIds: ["basic", "location"],
  },
  {
    id: "journey",
    title: "Journey & Pricing",
    icon: CalendarDays,
    stepIds: ["itinerary", "pricing", "calendar"],
  },
  {
    id: "enhancements",
    title: "Enhancements & Media",
    icon: ImageIcon,
    stepIds: ["accommodation", "extras", "inclusions", "media"],
  },
  {
    id: "launch",
    title: "Policies & Launch",
    icon: Rocket,
    stepIds: ["settings", "seo", "review"],
  },
];

/** Upgraded milestone-driven step navigator for the tour editor:
 *  - Displays progressive 4-milestone grouping
 *  - Real-time overall completion bar
 *  - 1-click Live Card Preview quick action
 */
export function WizardSideStepper({
  role,
  activeIndex,
  visitedIndexes,
  statuses,
  onSelect,
  steps,
  disabled = false,
  onOpenLivePreview,
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
  /** Optional callback to open the Live Tour Card Preview modal. */
  onOpenLivePreview?: () => void;
}) {
  const colors = theme[role];

  // Map steps into Milestones
  const groupedMilestones = useMemo(() => {
    return MILESTONES.map((milestone) => {
      const stepItems = steps
        .map((step, originalIndex) => ({ step, originalIndex }))
        .filter(({ step }) => milestone.stepIds.includes(step.id));

      const completedCount = stepItems.filter(({ originalIndex }) => statuses[originalIndex] === "complete").length;

      return {
        ...milestone,
        stepItems,
        completedCount,
        totalCount: stepItems.length,
      };
    }).filter((m) => m.stepItems.length > 0);
  }, [steps, statuses]);

  // Total completed non-review steps
  const totalCompleted = useMemo(() => {
    return Object.values(statuses).filter((s) => s === "complete").length;
  }, [statuses]);

  const totalEvaluatedSteps = Math.max(1, steps.length - 1);
  const progressPercent = Math.min(100, Math.round((totalCompleted / totalEvaluatedSteps) * 100));

  return (
    <>
      {/* Small screens: grouped select dropdown */}
      <div className="lg:hidden space-y-2">
        <label className="sr-only" htmlFor="wizard-step-select">Step</label>
        <select
          id="wizard-step-select"
          value={activeIndex}
          disabled={disabled}
          onChange={(e) => onSelect(Number(e.target.value))}
          className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-bold text-dash-text outline-none ${colors.contentBorder}`}
        >
          {groupedMilestones.map((milestone) => (
            <optgroup key={milestone.id} label={milestone.title}>
              {milestone.stepItems.map(({ step, originalIndex }) => (
                <option key={step.id} value={originalIndex}>
                  {step.number} · {step.label} {step.optional ? "(Optional)" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {onOpenLivePreview && (
          <button
            type="button"
            onClick={onOpenLivePreview}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 transition"
          >
            <Sparkles size={14} className="text-blue-600" />
            <span>Open Live Tour Card Preview</span>
          </button>
        )}
      </div>

      {/* Desktop Sticky Stepper */}
      <nav
        aria-label="Tour editor steps"
        className={`sticky top-24 hidden w-64 shrink-0 self-start rounded-2xl border bg-white p-3 shadow-[0_8px_24px_-22px_rgba(24,76,140,.7)] lg:block ${colors.contentBorder}`}
      >
        {/* Progress Header */}
        <div className="mb-3.5 pb-3 border-b border-slate-100 px-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              Tour Readiness
            </span>
            <span className="text-blue-700 font-black tabular-nums">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Milestone Groups */}
        <div className="space-y-3.5">
          {groupedMilestones.map((milestone, mIndex) => {
            const Icon = milestone.icon;
            const isMilestoneActive = milestone.stepItems.some(({ originalIndex }) => originalIndex === activeIndex);

            return (
              <div key={milestone.id} className="space-y-1">
                {/* Milestone Section Header */}
                <div className="flex items-center justify-between px-2 py-0.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <Icon size={12} className={isMilestoneActive ? "text-blue-600" : "text-slate-400"} />
                    <span>{mIndex + 1}. {milestone.title}</span>
                  </span>
                  <span className="text-[9.5px] font-bold text-slate-400 tabular-nums">
                    {milestone.completedCount}/{milestone.totalCount}
                  </span>
                </div>

                {/* Steps in Milestone */}
                <ol className="space-y-0.5">
                  {milestone.stepItems.map(({ step, originalIndex }) => {
                    const active = originalIndex === activeIndex;
                    const visited = visitedIndexes.has(originalIndex);
                    const status = statuses[originalIndex];
                    const locked = disabled && !active;

                    return (
                      <li key={step.id}>
                        <button
                          type="button"
                          onClick={() => !locked && onSelect(originalIndex)}
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
                            <span
                              title={step.label}
                              className={`block truncate text-[11.5px] font-bold leading-tight ${
                                active ? colors.progressText : "text-dash-body"
                              }`}
                            >
                              {step.label}
                            </span>
                            {step.optional && (
                              <span className="block text-[9.5px] font-semibold leading-tight text-dash-subtle">
                                Optional
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>

        {/* Live Tour Card Preview Launcher */}
        {onOpenLivePreview && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onOpenLivePreview}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 px-3 py-2 text-xs font-bold text-blue-700 shadow-2xs transition active:scale-[0.98]"
            >
              <Sparkles size={13} className="text-blue-600" />
              <span>Live Tour Card Preview</span>
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
