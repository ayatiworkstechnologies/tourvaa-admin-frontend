import Link from "next/link";
import {
  LuArrowLeft as ArrowLeft,
  LuArrowRight as ArrowRight,
  LuCheck as Check,
} from "react-icons/lu";

export type TourWorkspaceRole = "admin" | "supplier";

type WorkspaceAction = {
  label: string;
  href: string;
  icon?: React.ElementType;
  variant?: "primary" | "secondary";
};

const theme = {
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
  completedIndices = new Set<number>(),
}: {
  role: TourWorkspaceRole;
  tabs: TourWorkspaceTab[];
  activeIndex: number;
  onSelect: (index: number) => void;
  completedIndices?: Set<number>;
}) {
  const colors = theme[role];
  return (
    <div className={`mt-4 overflow-x-auto rounded-2xl border bg-white p-2 shadow-[0_8px_24px_-22px_rgba(24,76,140,.7)] [-webkit-overflow-scrolling:touch] ${colors.contentBorder}`}>
      <div className="flex min-w-max gap-1">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(index)}
            aria-current={activeIndex === index ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeIndex === index ? `${colors.tabActive} shadow-sm` : colors.tabIdle
            }`}
          >
            {completedIndices.has(index) && activeIndex !== index && (
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-white ${colors.progressBar}`}>
                <Check size={10} strokeWidth={3} />
              </span>
            )}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TourWorkspaceStepFooter({
  role,
  activeIndex,
  total,
  completedCount,
  onBack,
  onNext,
  onFinish,
}: {
  role: TourWorkspaceRole;
  activeIndex: number;
  total: number;
  completedCount: number;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  const colors = theme[role];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === total - 1;

  return (
    <div className={`mt-4 flex flex-col gap-3 rounded-2xl border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${colors.contentBorder} ${colors.contentShadow}`}>
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-body transition hover:bg-dash-bg disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <div className="text-center">
        <p className="text-xs font-bold text-dash-body">
          Section {activeIndex + 1} of {total}
        </p>
        <p className="mt-0.5 text-[10px] text-dash-subtle">{completedCount} of {total} reviewed</p>
      </div>

      <button
        type="button"
        onClick={isLast ? onFinish : onNext}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 ${colors.primary}`}
      >
        {isLast ? (
          <>
            <Check size={15} strokeWidth={3} />
            Complete Review
          </>
        ) : (
          <>
            Next Section
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </div>
  );
}

export function TourWorkspaceContent({
  role,
  children,
  className = "",
}: {
  role: TourWorkspaceRole;
  children: React.ReactNode;
  className?: string;
}) {
  const colors = theme[role];
  return (
    <div className={`mt-4 rounded-2xl border bg-white p-5 sm:p-7 ${colors.contentBorder} ${colors.contentShadow} ${className}`}>
      {children}
    </div>
  );
}

export function TourWorkspaceProgress({
  role,
  stages,
  currentIndex,
}: {
  role: TourWorkspaceRole;
  stages: Array<{ label: string; note?: string; complete?: boolean }>;
  currentIndex?: number;
}) {
  const colors = theme[role];
  return (
    <div className={`grid grid-cols-2 gap-2 ${stages.length > 4 ? "xl:grid-cols-5" : "sm:grid-cols-4"}`}>
      {stages.map((stage, index) => {
        const active = currentIndex === index;
        const complete = stage.complete ?? (currentIndex != null && index < currentIndex);
        const reached = complete || active;
        return (
          <div
            key={stage.label}
            className={`rounded-xl border p-3 transition ${
              active ? `${colors.progressActive} shadow-sm` : complete ? colors.progressDone : colors.progressIdle
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${reached ? colors.progressNumber : colors.progressMuted}`}>
                {complete ? <Check size={13} strokeWidth={3} /> : index + 1}
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-[10px] font-black ${active ? colors.progressText : "text-dash-muted"}`}>{stage.label}</span>
                {stage.note && <span className="block truncate text-[9px] text-dash-subtle">{stage.note}</span>}
              </span>
            </div>
            {currentIndex != null && (
              <div className={`mt-2 h-1 overflow-hidden rounded-full ${colors.track}`}>
                <div className={`h-full rounded-full transition-all ${colors.progressBar} ${reached ? "w-full" : "w-0"}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
