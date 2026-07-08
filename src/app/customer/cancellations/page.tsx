"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuFileText as FileText } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type Cancellation = {
  id: number;
  booking_id: number;
  booking_code?: string;
  tour_name?: string;
  reason?: string;
  status?: string;
  admin_notes?: string;
  created_at?: string;
};

function dateText(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function statusClass(status?: string) {
  const value = (status || "").toLowerCase();
  if (["approved", "refunded", "completed"].includes(value)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["requested", "under_review", "refund_processing"].includes(value)) return "bg-amber-50 text-amber-700 border-amber-200";
  if (["rejected", "cancelled"].includes(value)) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function CustomerCancellationsPage() {
  const [rows, setRows] = useState<Cancellation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get("/customer/cancellations")
      .then((res) => active && setRows(res.data?.items ?? res.data?.data ?? []))
      .catch(() => active && setRows([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const columns: DataTableColumn<Cancellation>[] = [
    { key: "booking", header: "Booking", render: (c) => <Link className="font-bold text-dash-brand hover:underline" href={`/customer/bookings/${c.booking_id}`}>{c.booking_code || `Booking #${c.booking_id}`}</Link> },
    { key: "tour", header: "Tour", render: (c) => c.tour_name || "-", className: "text-dash-muted" },
    { key: "reason", header: "Reason", render: (c) => c.reason || "-", className: "hidden max-w-xs truncate text-dash-muted md:table-cell" },
    { key: "status", header: "Status", render: (c) => <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${statusClass(c.status)}`}>{(c.status || "requested").replaceAll("_", " ")}</span> },
    { key: "date", header: "Requested", render: (c) => dateText(c.created_at), className: "hidden text-dash-muted sm:table-cell" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-dash-text">Cancellations</h1>
          <p className="mt-1 text-sm text-dash-muted">Track cancellation and refund requests.</p>
        </div>
        <Link href="/customer/bookings" className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-dark"><FileText size={16} /> Request from Booking</Link>
      </div>
      <DataTable ariaLabel="Customer cancellations" columns={columns} rows={rows} loading={loading} page={1} pageSize={rows.length || 10} total={rows.length} totalPages={1} emptyTitle="No cancellation requests" emptyDescription="Cancellation requests submitted from booking details will appear here." />
    </div>
  );
}
