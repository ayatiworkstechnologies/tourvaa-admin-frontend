"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LuCircleAlert as AlertCircle, LuCalendarCheck as CalendarCheck, LuCircleCheckBig as CheckCircle2, LuClock3 as Clock3, LuEye as Eye, LuFilter as Filter, LuCircleX as XCircle } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { SupplierMetric, SupplierPageHeader, SupplierPageShell, SupplierSection } from "@/components/supplier/SupplierPage";

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
  { value: "pending_payment", label: "Pending Payment" },
  { value: "pending_supplier_acceptance", label: "Awaiting My Decision" },
  { value: "confirmed", label: "Confirmed" },
  { value: "ongoing", label: "Ongoing" },
  { value: "postponed", label: "Postponed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "declined", label: "Declined" },
];

function statusColors(s: string) {
  const v = (s || "").toLowerCase();
  if (["confirmed", "completed", "paid"].includes(v))
    return "bg-emerald-50 text-emerald-700";
  if (["pending", "pending_payment", "payment_authorized", "pending_supplier_acceptance"].includes(v))
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
  const [initialQueryApplied, setInitialQueryApplied] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { limit, page };
      if (statusFilter) params.booking_status = statusFilter;
      const res = await api.get("/bookings", { params });
      const data = res.data;
      setBookings(data?.items ?? data?.data ?? data ?? []);
      setTotal(data?.total ?? 0);
      setStatusCounts(data?.status_counts ?? {});
      setTotalPages(data?.total_pages ?? Math.max(1, Math.ceil(Number(data?.total ?? 0) / Number(data?.limit ?? limit))));
    } catch {
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    const requestedStatus = new URLSearchParams(window.location.search).get("status") || "";
    if (STATUS_OPTIONS.some((option) => option.value === requestedStatus)) {
      setStatusFilter(requestedStatus);
    }
    setInitialQueryApplied(true);
  }, []);

  useEffect(() => {
    if (initialQueryApplied) void load();
  }, [initialQueryApplied, load]);

  const handleFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const stats = [
    { label: "Total Bookings", value: Object.keys(statusCounts).length ? Object.values(statusCounts).reduce((sum, count) => sum + count, 0) : total, icon: CalendarCheck, tone: "bg-emerald-50 text-emerald-700", note: "All supplier bookings" },
    { label: "Confirmed / Ongoing", value: (statusCounts.confirmed ?? 0) + (statusCounts.ongoing ?? 0), icon: CheckCircle2, tone: "bg-sky-50 text-sky-700", note: "Active operations" },
    { label: "Awaiting Action", value: (statusCounts.payment_authorized ?? 0) + (statusCounts.pending_supplier_acceptance ?? 0), icon: Clock3, tone: "bg-amber-50 text-amber-700", note: "Review required" },
    { label: "Cancelled / Declined", value: (statusCounts.cancelled ?? 0) + (statusCounts.declined ?? 0), icon: XCircle, tone: "bg-rose-50 text-rose-700", note: "Closed without travel" },
  ];

  const columns: DataTableColumn<Booking>[] = [
    { key: "booking_code", header: "Booking", className: "font-mono text-xs text-dash-muted", render: (b) => b.booking_code },
    { key: "tour", header: "Tour", className: "max-w-[200px]", render: (b) => <p className="truncate font-semibold text-dash-text">{b.tour_name ?? b.tour_title ?? "-"}</p> },
    { key: "travel_date", header: "Travel Date", className: "whitespace-nowrap text-dash-muted", render: (b) => b.tour_date ?? b.travel_date ?? "-" },
    { key: "travellers", header: "Travellers", className: "text-center text-dash-muted", render: (b) => b.num_travellers ?? b.total_pax ?? "-" },
    { key: "status", header: "Status", render: (b) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusColors(b.booking_status)}`}>{b.booking_status.replaceAll("_", " ")}</span> },
    { key: "payment", header: "Payment", render: (b) => b.payment_status ? <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${paymentColors(b.payment_status)}`}>{b.payment_status}</span> : <span className="text-xs text-dash-subtle">-</span> },
    { key: "amount", header: "Amount", className: "whitespace-nowrap font-semibold text-dash-text", render: (b) => `${b.currency ?? "USD"} ${Number(b.final_amount ?? b.total_amount ?? 0).toLocaleString()}` },
  ];

  return (
    <SupplierPageShell>
      <SupplierPageHeader
        title="Bookings"
        description="Review new requests, confirm paid bookings, and manage every active traveller departure."
        icon={CalendarCheck}
        eyebrow="Booking Operations"
      />

      {/* Stats */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon, tone, note }) => (
          <SupplierMetric key={label} label={label} value={value} icon={icon} tone={tone} note={note} />
        ))}
      </div>

      {/* Filters */}
      <SupplierSection className="mt-4">
      <div className="flex flex-col gap-3 border-b border-[#E5EFE9] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-dash-subtle" />
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="rounded-xl border border-[#D5E6DB] bg-white px-4 py-2.5 text-sm font-bold text-[#365545] outline-none focus:border-[#16833A] focus:ring-4 focus:ring-emerald-50"
          > 
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            <span>{total} booking{total !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="m-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
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
      {loading && (
        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}
      {!loading && !error && (
        <div>
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-dash-border/80 bg-white px-3 py-1.5 text-xs font-bold text-dash-body shadow-sm hover:bg-[#F3F8FC] hover:text-dash-brand transition-all"
              >
                <Eye size={14} />
                View
              </Link>
            )}
          />
        </div>
      )}
      </SupplierSection>
    </SupplierPageShell>
  );
}
