"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuFileText as FileText } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { CustomerPageHeader, CustomerPageShell } from "@/components/customer/CustomerPage";

type Cancellation = {
  id: number;
  booking_id: number;
  booking_code?: string;
  tour_name?: string;
  reason?: string;
  status?: string;
  refund_percentage?: string | number;
  refund_amount?: string | number;
  currency?: string;
  refund_processed_at?: string;
  admin_notes?: string;
  created_at?: string;
};

function dateText(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function refundText(value?: string | number, currency = "USD") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function statusClass(status?: string) {
  const value = (status || "").toLowerCase();
  if (["approved", "refund_processed"].includes(value)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["pending", "refund_processing"].includes(value)) return "bg-amber-50 text-amber-700 border-amber-200";
  if (["rejected"].includes(value)) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function CustomerCancellationsPage() {
  const [rows, setRows] = useState<Cancellation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get("/customer/cancellations")
      .then((res) => active && setRows(res.data?.items ?? res.data?.data ?? []))
      .catch(() => active && setRows([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const columns: DataTableColumn<Cancellation>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (page - 1) * pageSize + index + 1,
    },
    { key: "booking", header: "Booking", render: (c) => <Link className="font-bold text-dash-brand hover:underline" href={`/customer/bookings/${c.booking_id}`}>{c.booking_code || `Booking #${c.booking_id}`}</Link> },
    { key: "tour", header: "Tour", render: (c) => c.tour_name || "-", className: "text-dash-muted" },
    { key: "reason", header: "Reason", render: (c) => c.reason || "-", className: "hidden max-w-xs truncate text-dash-muted md:table-cell" },
    {
      key: "refund",
      header: "Refund",
      className: "text-dash-muted",
      render: (c) => {
        const amount = Number(c.refund_amount);
        if (Number.isFinite(amount) && amount === 0 && c.status === "refund_processed") return <span className="font-medium">No refund</span>;
        return (
          <div>
            <p className="font-semibold text-dash-text">{refundText(c.refund_amount, c.currency)}</p>
            {c.refund_percentage != null && <p className="text-xs">{c.refund_percentage}% of amount paid</p>}
          </div>
        );
      },
    },
    { key: "status", header: "Status", render: (c) => <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${statusClass(c.status)}`}>{(c.status || "pending").replaceAll("_", " ")}</span> },
    { key: "processed", header: "Processed", render: (c) => dateText(c.refund_processed_at), className: "hidden text-dash-muted lg:table-cell" },
    { key: "date", header: "Requested", render: (c) => dateText(c.created_at), className: "hidden text-dash-muted sm:table-cell" },
  ];

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Cancellations"
        description="Track cancellation requests, review progress, and follow refund decisions."
        icon={FileText}
        action={{ label: "Request from Booking", href: "/customer/bookings", icon: FileText }}
      />
      <div className="mt-4">
        <DataTable
          ariaLabel="Customer cancellations"
          columns={columns}
          rows={paginatedRows}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={rows.length}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyTitle="No cancellation requests"
          emptyDescription="Cancellation requests submitted from booking details will appear here."
        />
      </div>
    </CustomerPageShell>
  );
}
