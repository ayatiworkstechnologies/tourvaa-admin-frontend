"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, ChevronLeft, ChevronRight, Eye, Plus } from "lucide-react";
import api from "@/lib/api";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type Booking = {
  id: number;
  booking_code: string;
  customer_name?: string;
  tour_name?: string;
  tour_date?: string | null;
  booking_status: string;
  payment_status: string;
  final_amount?: string | number;
  currency?: string;
};

const STATUSES = ["all", "confirmed", "pending", "pending_payment", "completed", "cancelled"];

function money(value: string | number | undefined, currency = "AED") {
  if (!value && value !== 0) return "—";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}

function dateText(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function statusClass(status?: string) {
  const v = (status || "").toLowerCase();
  if (["paid", "completed", "confirmed", "active"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "partial", "partially_paid", "pending_payment"].includes(v)) return "bg-amber-50 text-amber-700";
  if (["cancelled", "failed"].includes(v)) return "bg-rose-50 text-rose-700";
  return "bg-slate-50 text-slate-700";
}

function Pill({ status, children }: { status?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClass(status)}`}>
      {children}
    </span>
  );
}

export default function AgentBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { limit, page };
        if (statusFilter !== "all") params.status = statusFilter;
        const res = await api.get("/bookings", { params });
        if (!active) return;
        setBookings(res.data?.items ?? res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
      } catch {
        if (active) setBookings([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [page, statusFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  function handleStatus(s: string) {
    setStatusFilter(s);
    setPage(1);
  }

  const columns: DataTableColumn<Booking>[] = [
    { key: "code", header: "Code", render: (b) => <Link href={`/agent/bookings/${b.id}`} className="hover:text-orange-600 hover:underline">{b.booking_code}</Link>, className: "font-bold text-[#121826]" },
    { key: "customer", header: "Customer", render: (b) => b.customer_name ?? "—", className: "hidden text-[#667085] sm:table-cell" },
    { key: "tour", header: "Tour", render: (b) => b.tour_name ?? "—", className: "hidden max-w-[180px] truncate text-[#667085] md:table-cell" },
    { key: "date", header: "Date", render: (b) => dateText(b.tour_date), className: "hidden text-[#667085] lg:table-cell" },
    { key: "status", header: "Status", render: (b) => <Pill status={b.booking_status}>{b.booking_status.replaceAll("_", " ")}</Pill> },
    { key: "payment", header: "Payment", render: (b) => <Pill status={b.payment_status}>{b.payment_status.replaceAll("_", " ")}</Pill>, className: "hidden xl:table-cell" },
    { key: "total", header: "Total", render: (b) => money(b.final_amount, b.currency), className: "hidden text-right font-bold text-[#121826] xl:table-cell" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-tight font-black tracking-tight text-[#121826]">Bookings</h1>
          <p className="mt-2 text-sm font-medium text-[#667085]">All bookings created on behalf of your customers.</p>
        </div>
        <Link
          href="/agent/bookings/create"
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] hover:bg-[#2F9FE9] transition-all hover:-translate-y-0.5"
        >
          <Plus size={18} strokeWidth={2.5} /> New Booking
        </Link>
      </div>

      {/* Status Filter */}
      <div className="mt-8 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatus(s)}
            className={`rounded-2xl px-5 py-2.5 text-sm font-bold capitalize transition-all shadow-[0_2px_8px_rgb(0,0,0,0.02)] ${
              statusFilter === s
                ? "bg-[#43A9F6] text-white shadow-[#43A9F6]/20"
                : "border border-[#E7EAF0]/80 bg-white text-[#667085] hover:border-[#43A9F6]/30 hover:text-[#43A9F6]"
            }`}
          >
            {s === "all" ? "All" : s.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-6">
        <DataTable
          ariaLabel="Bookings"
          columns={columns}
          rows={bookings}
          loading={loading}
          page={page}
          pageSize={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyTitle="No bookings found"
          emptyDescription="Create a booking for a customer to see it here."
          emptyAction={
              <Link
                href="/agent/bookings/create"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2F9FE9] transition-all shadow-sm"
              >
                <Plus size={16} strokeWidth={2.5} /> Create Booking
              </Link>
          }
          actions={(b) => (
            <div className="flex justify-end gap-2">
              <Link
                href={`/agent/bookings/${b.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7EAF0] bg-white px-3 py-1.5 text-xs font-semibold text-[#344054] shadow-sm hover:bg-[#F3F8FC] hover:text-[#43A9F6] transition-all"
              >
                <Eye size={14} /> View
              </Link>
            </div>
          )}
        />
      </div>
    </div>
  );
}
