"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuCreditCard as CreditCard, LuExternalLink as ExternalLink, LuShieldCheck as ShieldCheck } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { CustomerPageHeader, CustomerPageShell } from "@/components/customer/CustomerPage";

type Payment = {
  id: number;
  booking_id?: number;
  booking_code?: string;
  payment_code?: string;
  payment_method?: string;
  payment_status?: string;
  paid_amount?: string | number;
  total_amount?: string | number;
  currency?: string;
  created_at?: string;
};

function money(value?: string | number, currency = "USD") {
  if (value == null || value === "") return "-";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `${currency} ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function dateText(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function statusClass(status?: string) {
  const value = (status || "").toLowerCase();
  if (["paid", "captured", "completed", "success"].includes(value)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["pending", "authorized", "partial"].includes(value)) return "bg-amber-50 text-amber-700 border-amber-200";
  if (["failed", "cancelled", "refunded"].includes(value)) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function CustomerPaymentsPage() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get("/customer/payments", { params: { page, limit } })
      .then((res) => {
        if (!active) return;
        setRows(res.data?.items ?? res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
      })
      .catch(() => active && setRows([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [page]);

  const columns: DataTableColumn<Payment>[] = [
    { key: "code", header: "Payment", render: (p) => p.payment_code || `#${p.id}`, className: "font-bold text-dash-text" },
    { key: "booking", header: "Booking", render: (p) => p.booking_id ? <Link className="font-semibold text-dash-brand hover:underline" href={`/customer/bookings/${p.booking_id}`}>{p.booking_code || `Booking #${p.booking_id}`}</Link> : "-" },
    { key: "method", header: "Method", render: (p) => (p.payment_method || "-").replaceAll("_", " "), className: "hidden capitalize text-dash-muted sm:table-cell" },
    { key: "status", header: "Status", render: (p) => <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${statusClass(p.payment_status)}`}>{(p.payment_status || "unknown").replaceAll("_", " ")}</span> },
    { key: "amount", header: "Amount", render: (p) => money(p.paid_amount ?? p.total_amount, p.currency), className: "text-right font-bold text-dash-text" },
    { key: "date", header: "Date", render: (p) => dateText(p.created_at), className: "hidden text-dash-muted md:table-cell" },
  ];

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Payments"
        description="Track every transaction, pending balance, and gateway status in one secure place."
        icon={CreditCard}
        action={{ label: "Pay Pending Bookings", href: "/customer/bookings", icon: CreditCard }}
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <PaymentMetric label="Total Transactions" value={total} />
        <PaymentMetric label="Successful" value={rows.filter((row) => ["paid", "captured", "completed", "success"].includes((row.payment_status || "").toLowerCase())).length} tone="green" />
        <PaymentMetric label="Secure Checkout" value="Protected" icon={ShieldCheck} tone="blue" />
      </div>
      <div className="mt-4">
        <DataTable ariaLabel="Customer payments" columns={columns} rows={rows} loading={loading} page={page} pageSize={limit} total={total} totalPages={Math.ceil(total / limit) || 1} onPageChange={setPage} emptyTitle="No payments found" emptyDescription="Payments will appear here once a booking payment is recorded." actions={(p) => p.booking_id ? <Link href={`/customer/bookings/${p.booking_id}`} className="inline-flex items-center gap-1 rounded-lg border border-[#D5E1EF] bg-white px-3 py-1.5 text-xs font-bold text-[#315174] hover:border-blue-300 hover:text-[#0865D9]"><ExternalLink size={13} /> Booking</Link> : null} />
      </div>
    </CustomerPageShell>
  );
}

function PaymentMetric({ label, value, icon: Icon, tone = "slate" }: { label: string; value: string | number; icon?: React.ElementType; tone?: "slate" | "green" | "blue" }) {
  const colors = tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-[#27496F]";
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#DDE7F3] bg-white px-4 py-3">
      <span><small className="block text-[10px] font-bold uppercase tracking-wide text-[#7184A0]">{label}</small><b className="mt-1 block text-lg text-[#0C2043]">{value}</b></span>
      {Icon && <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors}`}><Icon size={19} /></span>}
    </div>
  );
}
