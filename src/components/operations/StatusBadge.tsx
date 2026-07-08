"use client";

type Props = {
  value?: string | null;
};

const toneMap: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  approved: "bg-emerald-50 text-emerald-700",
  published: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  partial_approved: "bg-sky-50 text-sky-700",
  draft: "bg-slate-100 text-slate-700",
  inactive: "bg-slate-100 text-slate-700",
  unpublished: "bg-slate-100 text-slate-700",
  rejected: "bg-red-50 text-red-700",
  blocked: "bg-red-50 text-red-700",
  disabled: "bg-red-50 text-red-700",
};

export default function StatusBadge({ value }: Props) {
  const normalized = (value || "pending").toLowerCase();
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${toneMap[normalized] || "bg-slate-100 text-slate-700"}`}>
      {normalized.replaceAll("_", " ")}
    </span>
  );
}
