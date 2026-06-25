"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
} from "lucide-react";
import api from "@/lib/api";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type Booking = {
  id: number;
  booking_code: string;
  tour_name?: string;
  tour_title?: string;
  tour_date?: string;
  travel_date?: string;
  num_travellers?: number;
  total_pax?: number;
  booking_status: string;
  payment_status?: string;
  final_amount?: string | number;
  total_amount?: string | number;
  currency?: string;
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "declined", label: "Declined" },
];

function statusColors(s: string) {
  const v = (s || "").toLowerCase();
  if (["confirmed", "completed", "paid"].includes(v))
    return "bg-emerald-50 text-emerald-700";
  if (["pending", "pending_payment", "pending_confirmation"].includes(v))
    return "bg-amber-50 text-amber-700";
  if (["cancelled", "declined", "failed"].includes(v))
    return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

function paymentColors(s: string) {
  const v = (s || "").toLowerCase();
  if (["paid", "completed"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "partial"].includes(v)) return "bg-amber-50 text-amber-700";
  if (["failed", "refunded"].includes(v)) return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

export default function SupplierBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { limit, page };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/supplier/bookings", { params });
      const data = res.data;
      setBookings(data?.items ?? data?.data ?? data ?? []);
      setTotal(data?.total ?? 0);
      if (data?.total && data?.limit) {
        setTotalPages(Math.ceil(data.total / data.limit));
      } else {
        setTotalPages(1);
      }
    } catch {
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const columns: DataTableColumn<Booking>[] = [
    { key: "booking_code", header: "Booking", className: "font-mono text-xs text-[#667085]", render: (b) => b.booking_code },
    { key: "tour", header: "Tour", className: "max-w-[200px]", render: (b) => <p className="truncate font-semibold text-[#121826]">{b.tour_name ?? b.tour_title ?? "—"}</p> },
    { key: "travel_date", header: "Travel Date", className: "whitespace-nowrap text-[#667085]", render: (b) => b.tour_date ?? b.travel_date ?? "—" },
    { key: "travellers", header: "Travellers", className: "text-center text-[#667085]", render: (b) => b.num_travellers ?? b.total_pax ?? "—" },
    { key: "status", header: "Status", render: (b) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColors(b.booking_status)}`}>{b.booking_status}</span> },
    { key: "payment", header: "Payment", render: (b) => b.payment_status ? <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${paymentColors(b.payment_status)}`}>{b.payment_status}</span> : <span className="text-xs text-[#98A2B3]">—</span> },
    { key: "amount", header: "Amount", className: "whitespace-nowrap font-semibold text-[#121826]", render: (b) => `${b.currency ?? "AED"} ${Number(b.final_amount ?? b.total_amount ?? 0).toLocaleString()}` },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-[32px] leading-tight font-black tracking-tight text-[#121826]">Bookings</h1>
        <p className="mt-2 text-sm font-medium text-[#667085]">
          Manage all bookings for your tours.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-[#98A2B3]" />
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="rounded-2xl border border-[#E7EAF0]/80 bg-white px-4 py-2.5 text-sm font-bold text-[#344054] shadow-[0_2px_8px_rgb(0,0,0,0.02)] outline-none focus:border-[#43A9F6] focus:ring-4 focus:ring-[#43A9F6]/10 transition-all cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-[#F0F7FF] px-4 py-2 text-sm font-bold text-[#43A9F6]">
            <span>{total} booking{total !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <span className="flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </span>
          <button
            type="button"
            onClick={load}
            className="text-xs font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="mt-2">
          <DataTable
            ariaLabel="Bookings table"
            columns={columns}
            rows={bookings}
            loading={loading}
            page={page}
            pageSize={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyTitle="No bookings found"
            emptyDescription={statusFilter ? "Try clearing the filter to see all bookings." : "Bookings for your tours will appear here."}
            actions={(b) => (
              <Link
                href={`/supplier/bookings/${b.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7EAF0]/80 bg-white px-3 py-1.5 text-xs font-bold text-[#344054] shadow-sm hover:bg-[#F3F8FC] hover:text-[#43A9F6] transition-all"
              >
                <Eye size={14} />
                View
              </Link>
            )}
          />
        </div>
      )}
    </div>
  );
}
