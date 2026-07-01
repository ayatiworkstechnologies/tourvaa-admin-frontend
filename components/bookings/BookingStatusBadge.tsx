const toneMap: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending_payment: "bg-amber-50 text-amber-700",
  payment_authorized: "bg-sky-50 text-sky-700",
  pending_supplier_acceptance: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  unpaid: "bg-red-50 text-red-700",
  authorized: "bg-sky-50 text-sky-700",
  partially_paid: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  refunded: "bg-slate-100 text-slate-700",
};

export default function BookingStatusBadge({ value }: { value: string }) {
  const tone = toneMap[value] || "bg-[#EEF6FF] text-[#2368A2]";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${tone}`}>{value.replaceAll("_", " ")}</span>;
}
