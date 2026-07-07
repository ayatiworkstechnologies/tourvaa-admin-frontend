"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuCreditCard as CreditCard, LuExternalLink as ExternalLink } from "react-icons/lu";
import api from "@/lib/api";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

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

function money(value?: string | number, currency = "AED") {
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
    { key: "code", header: "Payment", render: (p) => p.payment_code || `#${p.id}`, className: "font-bold text-[#121826]" },
    { key: "booking", header: "Booking", render: (p) => p.booking_id ? <Link className="font-semibold text-[#43A9F6] hover:underline" href={`/customer/bookings/${p.booking_id}`}>{p.booking_code || `Booking #${p.booking_id}`}</Link> : "-" },
    { key: "method", header: "Method", render: (p) => (p.payment_method || "-").replaceAll("_", " "), className: "hidden capitalize text-[#667085] sm:table-cell" },
    { key: "status", header: "Status", render: (p) => <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${statusClass(p.payment_status)}`}>{(p.payment_status || "unknown").replaceAll("_", " ")}</span> },
    { key: "amount", header: "Amount", render: (p) => money(p.paid_amount ?? p.total_amount, p.currency), className: "text-right font-bold text-[#121826]" },
    { key: "date", header: "Date", render: (p) => dateText(p.created_at), className: "hidden text-[#667085] md:table-cell" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#121826]">Payments</h1>
          <p className="mt-1 text-sm text-[#667085]">Track customer portal payments and gateway status.</p>
        </div>
        <Link href="/customer/bookings" className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#238DD7]">
          <CreditCard size={16} /> Pay Pending Bookings
        </Link>
      </div>
      <DataTable ariaLabel="Customer payments" columns={columns} rows={rows} loading={loading} page={page} pageSize={limit} total={total} totalPages={Math.ceil(total / limit) || 1} onPageChange={setPage} emptyTitle="No payments found" emptyDescription="Payments will appear here once a booking payment is recorded." actions={(p) => p.booking_id ? <Link href={`/customer/bookings/${p.booking_id}`} className="inline-flex items-center gap-1 rounded-lg border border-[#E7EAF0] px-3 py-1.5 text-xs font-bold text-[#344054] hover:text-[#43A9F6]"><ExternalLink size={13} /> Booking</Link> : null} />
    </div>
  );
}
