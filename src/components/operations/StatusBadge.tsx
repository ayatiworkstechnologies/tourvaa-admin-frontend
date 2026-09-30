"use client";

type Props = {
  value?: string | null;
};

type StatusStyle = {
  bg: string;
  text: string;
  ring: string;
  dot: string;
};

const toneMap: Record<string, StatusStyle> = {
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  published: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-amber-600/20",
    dot: "bg-amber-500 animate-pulse",
  },
  partial_approved: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-600/20",
    dot: "bg-sky-500",
  },
  draft: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-500/20",
    dot: "bg-slate-400",
  },
  inactive: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-500/20",
    dot: "bg-slate-400",
  },
  unpublished: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-500/20",
    dot: "bg-slate-400",
  },
  rejected: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-600/20",
    dot: "bg-rose-500",
  },
  blocked: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-600/20",
    dot: "bg-rose-500",
  },
  disabled: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-600/20",
    dot: "bg-rose-500",
  },
};

const defaultTone: StatusStyle = {
  bg: "bg-slate-100",
  text: "text-slate-700",
  ring: "ring-slate-500/20",
  dot: "bg-slate-400",
};

export default function StatusBadge({ value }: Props) {
  const normalized = (value || "pending").toLowerCase();
  const style = toneMap[normalized] || defaultTone;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style.bg} ${style.text} ${style.ring} whitespace-nowrap capitalize`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
      <span>{normalized.replaceAll("_", " ")}</span>
    </span>
  );
}
