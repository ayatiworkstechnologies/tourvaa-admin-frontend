"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LuArrowRight as ArrowRight, LuCheck as Check, LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight } from "react-icons/lu";

export type TourWorkspaceRole = "admin" | "supplier";

type WorkspaceAction = {
  label: string;
  href: string;
  icon?: React.ElementType;
  variant?: "primary" | "secondary";
};

export const theme = {
  admin: {
    border: "border-[#DCE6F5]",
    glow: "bg-[#EAF3FF]",
    ring: "border-blue-50/80",
    icon: "from-[#2989F2] to-[#1755C6] shadow-blue-200",
    eyebrow: "text-[#2563C7]",
    primary: "bg-dash-brand shadow-blue-200 hover:bg-dash-brand-hover",
    secondary: "border-[#D6E1F0] text-dash-body hover:bg-[#F4F8FD]",
    divider: "border-[#E7EDF6]",
    tabActive: "bg-dash-brand text-white",
    tabIdle: "text-dash-muted hover:bg-[#EDF5FF] hover:text-dash-text",
    progressActive: "border-blue-300 bg-blue-50",
    progressDone: "border-blue-100 bg-white",
    progressIdle: "border-[#E2E9F3] bg-[#F8FAFD]",
    progressNumber: "bg-dash-brand text-white",
    progressMuted: "bg-[#E9EEF5] text-dash-subtle",
    progressText: "text-[#164E9C]",
    progressBar: "bg-dash-brand",
    track: "bg-[#E1E9F3]",
    contentBorder: "border-[#DCE6F3]",
    contentShadow: "shadow-[0_10px_32px_-27px_rgba(28,83,160,.7)]",
  },
  supplier: {
    border: "border-[#D8EADF]",
    glow: "bg-[#E8F7ED]",
    ring: "border-emerald-50/70",
    icon: "from-[#16833A] to-[#0D5C29] shadow-emerald-200",
    eyebrow: "text-[#16833A]",
    primary: "bg-[#16833A] shadow-emerald-200 hover:bg-[#117331]",
    secondary: "border-[#D5E6DB] text-[#365A45] hover:bg-[#F0F8F3]",
    divider: "border-[#E5EFE9]",
    tabActive: "bg-[#16833A] text-white",
    tabIdle: "text-[#647A6E] hover:bg-[#F0F8F3] hover:text-[#123024]",
    progressActive: "border-emerald-300 bg-emerald-50",
    progressDone: "border-emerald-100 bg-white",
    progressIdle: "border-[#E1ECE5] bg-[#F8FBF9]",
    progressNumber: "bg-[#16833A] text-white",
    progressMuted: "bg-[#E4ECE7] text-[#7A8D82]",
    progressText: "text-emerald-800",
    progressBar: "bg-[#16833A]",
    track: "bg-[#E2ECE6]",
    contentBorder: "border-[#DCEBE2]",
    contentShadow: "shadow-[0_10px_32px_-27px_rgba(15,82,48,.7)]",
  },
} as const;

export function TourWorkspaceHeader({
  role,
  title,
  description,
  icon: Icon,
  eyebrow,
  actions = [],
  children,
}: {
  role: TourWorkspaceRole;
  title: string;
  description: string;
  icon: React.ElementType;
  eyebrow?: string;
  actions?: WorkspaceAction[];
  children?: React.ReactNode;
}) {
  const colors = theme[role];
  return (
    <section className={`relative overflow-hidden rounded-2xl border bg-white px-5 py-5 shadow-[0_14px_40px_-32px_rgba(24,76,140,.6)] sm:px-6 ${colors.border}`}>
      <div className={`pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full blur-2xl ${colors.glow}`} />
      <div className={`pointer-events-none absolute right-32 top-8 h-20 w-20 rounded-full border-[14px] ${colors.ring}`} />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg ${colors.icon}`}>
            <Icon size={24} />
          </span>
          <div className="min-w-0">
            <p className={`text-[10px] font-black uppercase tracking-[.16em] ${colors.eyebrow}`}>
              {eyebrow ?? (role === "admin" ? "Admin Tour Workspace" : "Supplier Tour Workspace")}
            </p>
            <h1 className="mt-1 text-[24px] font-black leading-tight tracking-tight text-dash-text">{title}</h1>
            <p className="mt-1 max-w-3xl text-[13px] leading-5 text-dash-muted">{description}</p>
          </div>
        </div>
        {actions.length > 0 && (
          <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
            {actions.map(({ label, href, icon: ActionIcon = ArrowRight, variant = "primary" }) => (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black transition hover:-translate-y-0.5 ${
                  variant === "primary"
                    ? `border-transparent text-white shadow-md ${colors.primary}`
                    : `bg-white ${colors.secondary}`
                }`}
              >
                <ActionIcon size={15} />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
      {children && <div className={`relative mt-5 border-t pt-4 ${colors.divider}`}>{children}</div>}
    </section>
  );
}

export type TourWorkspaceTab = { key: string; label: string };

export function TourWorkspaceTabs({
  role,
  tabs,
  activeIndex,
  onSelect,
}: {
  role: TourWorkspaceRole;
  tabs: TourWorkspaceTab[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const colors = theme[role];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [tabs]);

  useEffect(() => {
    // Keep the active tab in view when it's changed programmatically (e.g. Back/Next).
    const el = scrollRef.current;
    const activeButton = el?.children[0]?.children[activeIndex] as HTMLElement | undefined;
    activeButton?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  const scrollByAmount = (amount: number) => scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });

  return (
    <div className={`relative mt-4 rounded-2xl border bg-white shadow-[0_8px_24px_-22px_rgba(24,76,140,.7)] ${colors.contentBorder}`}>
      {canScrollLeft && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 rounded-l-2xl bg-gradient-to-r from-white to-transparent" />
          <button
            type="button"
            onClick={() => scrollByAmount(-180)}
            aria-label="Scroll tabs left"
            className="absolute left-1 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-dash-border bg-white shadow-sm hover:bg-dash-bg"
          >
            <ChevronLeft size={14} />
          </button>
        </>
      )}
      <div
        ref={scrollRef}
        className="overflow-x-auto p-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex min-w-max gap-1">
          {tabs.map((tab, index) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelect(index)}
              aria-current={activeIndex === index ? "page" : undefined}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                activeIndex === index ? `${colors.tabActive} shadow-sm` : colors.tabIdle
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {canScrollRight && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 rounded-r-2xl bg-gradient-to-l from-white to-transparent" />
          <button
            type="button"
            onClick={() => scrollByAmount(180)}
            aria-label="Scroll tabs right"
            className="absolute right-1 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-dash-border bg-white shadow-sm hover:bg-dash-bg"
          >
            <ChevronRight size={14} />
          </button>
        </>
      )}
    </div>
  );
}

export function TourWorkspaceStepper({
  role,
  steps,
  activeIndex,
  visitedIndexes,
  onSelect,
  disabled = false,
}: {
  role: TourWorkspaceRole;
  steps: TourWorkspaceTab[];
  activeIndex: number;
  /** Step indexes the user has already opened at least once -- rendered with
   * a checkmark. This tracks "visited", not real field-level completeness
   * (that lives in the Review & Submit checklist), so it's a wayfinding aid
   * rather than a validation signal. */
  visitedIndexes: Set<number>;
  onSelect: (index: number) => void;
  /** True in create mode, before a tour id exists -- the other 9 steps have
   * nowhere to save to yet, so the stepper previews the flow without acting
   * as real navigation. */
  disabled?: boolean;
}) {
  const colors = theme[role];
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressPct = steps.length > 1 ? (activeIndex / (steps.length - 1)) * 100 : 0;

  useEffect(() => {
    const el = scrollRef.current;
    const activeButton = el?.children[activeIndex] as HTMLElement | undefined;
    activeButton?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [activeIndex]);

  return (
    <div className={`relative mt-4 rounded-2xl border bg-white p-4 shadow-[0_8px_24px_-22px_rgba(24,76,140,.7)] sm:p-5 ${colors.contentBorder}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[11px] font-black uppercase tracking-[.1em] ${colors.progressText}`}>
          Step {activeIndex + 1} of {steps.length}
        </span>
        <span className="truncate text-[11px] font-bold text-dash-subtle">{steps[activeIndex]?.label}</span>
      </div>
      <div className={`relative mt-2.5 h-1.5 w-full overflow-hidden rounded-full ${colors.track}`}>
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${colors.progressBar}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div
        ref={scrollRef}
        className="mt-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {steps.map((step, index) => {
          const active = index === activeIndex;
          const done = !active && visitedIndexes.has(index);
          const locked = disabled && !active;
          return (
            <button
              key={step.key}
              type="button"
              onClick={() => !disabled && onSelect(index)}
              aria-current={active ? "step" : undefined}
              aria-disabled={locked || undefined}
              title={locked ? "Save the basics first to unlock this step" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                locked ? "cursor-not-allowed opacity-50" : ""
              } ${active ? colors.progressActive : done ? colors.progressDone : colors.progressIdle}`}
            >
              <span
                className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                  active || done ? colors.progressNumber : colors.progressMuted
                }`}
              >
                {/* Always show the step number, even once visited - a
                    checkmark replacing it made a completed step
                    unidentifiable at a glance (e.g. "Pricing" losing its
                    "5"). The checkmark is now a small overlay badge instead
                    of a replacement. */}
                {index + 1}
                {done && (
                  <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-white">
                    <Check size={8} strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className={`whitespace-nowrap text-[11px] font-bold ${active ? colors.progressText : "text-dash-subtle"}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TourWorkspaceContent({
  role,
  children,
  className = "",
  stepLabel,
}: {
  role: TourWorkspaceRole;
  children: React.ReactNode;
  className?: string;
  /** Small kicker shown at the top of the content card so the current step
   * stays legible after scrolling past the stepper on long forms. */
  stepLabel?: string;
}) {
  const colors = theme[role];
  return (
    <div className={`mt-4 rounded-2xl border bg-white p-5 sm:p-7 ${colors.contentBorder} ${colors.contentShadow} ${className}`}>
      {stepLabel && (
        <div className={`mb-5 flex items-center gap-2 border-b pb-4 ${colors.divider}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${colors.progressBar}`} />
          <span className={`text-[11px] font-black uppercase tracking-[.1em] ${colors.progressText}`}>{stepLabel}</span>
        </div>
      )}
      {children}
    </div>
  );
}
