"use client";

type StatusStyle = {
  bg: string;
  text: string;
  ring: string;
  dot: string;
  label?: string;
};

const statusStyles: Record<string, StatusStyle> = {
  // Confirmed / Paid / Accepted
  confirmed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  accepted: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  completed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  paid: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-600/20",
    dot: "bg-emerald-500",
  },

  // In-progress / Pending
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-amber-600/20",
    dot: "bg-amber-500 animate-pulse",
  },
  pending_payment: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-amber-600/20",
    dot: "bg-amber-500 animate-pulse",
    label: "Pending Payment",
  },
  pending_supplier_acceptance: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-amber-600/20",
    dot: "bg-amber-500 animate-pulse",
    label: "Pending Supplier",
  },
  partially_paid: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-amber-600/20",
    dot: "bg-amber-500",
    label: "Partially Paid",
  },
  pending_credit_approval: {
    bg: "bg-teal-50",
    text: "text-teal-800",
    ring: "ring-teal-600/20",
    dot: "bg-teal-500",
    label: "Credit Pending",
  },
  credit_approval_pending: {
    bg: "bg-teal-50",
    text: "text-teal-800",
    ring: "ring-teal-600/20",
    dot: "bg-teal-500",
    label: "Credit Pending",
  },
  bank_transfer_pending: {
    bg: "bg-teal-50",
    text: "text-teal-800",
    ring: "ring-teal-600/20",
    dot: "bg-teal-500",
    label: "Bank Transfer",
  },

  // Active / Ongoing / Authorized
  ongoing: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-600/20",
    dot: "bg-blue-500",
  },
  payment_authorized: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-600/20",
    dot: "bg-sky-500",
    label: "Authorized",
  },
  authorized: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-600/20",
    dot: "bg-sky-500",
  },
  postponed: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-600/20",
    dot: "bg-violet-500",
  },

  // Negative / Cancelled / Unpaid
  unpaid: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-600/20",
    dot: "bg-rose-500",
  },
  declined: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-600/20",
    dot: "bg-rose-500",
  },
  cancelled: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-600/20",
    dot: "bg-rose-500",
  },
  failed: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-600/20",
    dot: "bg-rose-500",
  },

  // Neutral / Not Assigned
  not_assigned: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-500/20",
    dot: "bg-slate-400",
    label: "Not Assigned",
  },
  draft: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-500/20",
    dot: "bg-slate-400",
  },
  refunded: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-500/20",
    dot: "bg-slate-400",
  },
  partially_refunded: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-500/20",
    dot: "bg-slate-400",
    label: "Partially Refunded",
  },
  voided: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-500/20",
    dot: "bg-slate-400",
  },
};

const defaultStyle: StatusStyle = {
  bg: "bg-blue-50",
  text: "text-blue-700",
  ring: "ring-blue-600/20",
  dot: "bg-blue-500",
};

export default function BookingStatusBadge({ value }: { value?: string | null }) {
  const normKey = (value || "").toLowerCase().trim();
  const conf = statusStyles[normKey] || defaultStyle;
  const label = conf.label || (normKey ? normKey.replaceAll("_", " ") : "Unknown");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${conf.bg} ${conf.text} ${conf.ring} whitespace-nowrap capitalize`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${conf.dot}`} />
      <span>{label}</span>
    </span>
  );
}
