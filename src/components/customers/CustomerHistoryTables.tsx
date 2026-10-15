"use client";

import Link from "next/link";
import { LuArrowUpRight as ArrowUpRight, LuCopy as Copy, LuEye as Eye } from "react-icons/lu";
import {
  BookingHistory,
  CustomerCommunication,
  PaymentHistory,
} from "@/lib/api/services/customerService";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import StatusBadge from "@/components/operations/StatusBadge";
import { useAuthContext } from "@/providers/AuthProvider";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/useToast";

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function CustomerBookingHistory({ rows }: { rows: BookingHistory[] }) {
  const { hasPermission } = useAuthContext();
  const { formatExact } = useCurrency();
  const toast = useToast();
  const money = (value: number | string, currency?: string) =>
    formatExact(Number(value || 0), currency || "USD");
  const canViewTour = hasPermission("tours.view") || hasPermission("view-tours");

  const columns: DataTableColumn<BookingHistory>[] = [
    {
      key: "booking_code",
      header: "Booking ID",
      className: "font-bold text-dash-text",
      render: (row) => {
        const code = row.booking_code || (row.id ? `#${row.id}` : "-");
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-dash-brand-hover">
            <Link
              href={`/admin/bookings/${row.id}`}
              className="inline-flex items-center gap-1 hover:underline"
            >
              {code}
              <ArrowUpRight size={12} className="opacity-70" />
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void navigator.clipboard.writeText(code);
                toast.success(`Copied ${code}`);
              }}
              className="text-dash-subtle hover:text-dash-brand transition-colors"
              title="Copy Booking ID"
            >
              <Copy size={11} />
            </button>
          </div>
        );
      },
    },
    {
      key: "tour_name",
      header: "Tour",
      className: "text-dash-muted",
      render: (row) =>
        canViewTour && row.tour_id ? (
          <Link
            href={`/admin/tours/${row.tour_id}/edit`}
            className="inline-flex items-center gap-1.5 font-semibold text-dash-brand-hover hover:underline"
          >
            <Eye size={14} className="shrink-0" />
            {row.tour_name || "View tour"}
          </Link>
        ) : (
          <span className="font-medium text-dash-text">{row.tour_name || "-"}</span>
        ),
    },
    {
      key: "tour_date",
      header: "Tour Date",
      className: "text-dash-muted whitespace-nowrap",
      render: (row) => {
        const rawDate = row.tour_date || row.booking_date || row.created_at;
        return (
          <div>
            <p className="font-medium text-dash-text">{formatDate(rawDate)}</p>
            {row.tour_date && row.created_at && (
              <p className="text-[11px] text-dash-subtle">Booked: {formatDate(row.created_at)}</p>
            )}
          </div>
        );
      },
    },
    {
      key: "supplier_name",
      header: "Supplier",
      className: "text-dash-muted",
      render: (row) => (
        <span className="font-medium text-slate-700">{row.supplier_name || "Direct / Tourvaa"}</span>
      ),
    },
    {
      key: "booking_status",
      header: "Booking Status",
      className: "text-dash-muted",
      render: (row) => <StatusBadge value={row.booking_status} />,
    },
    {
      key: "payment_status",
      header: "Payment Status",
      className: "text-dash-muted",
      render: (row) => <StatusBadge value={row.payment_status} />,
    },
    {
      key: "tour_cost",
      header: "Total",
      className: "text-dash-muted",
      render: (row) => money(row.tour_cost, row.currency),
    },
    {
      key: "amount_paid",
      header: "Paid",
      className: "text-emerald-600 font-medium",
      render: (row) => money(row.amount_paid, row.currency),
    },
    {
      key: "amount_pending",
      header: "Pending",
      className: "text-amber-700 font-medium",
      render: (row) => money(row.amount_pending, row.currency),
    },
  ];

  return (
    <DataTable
      ariaLabel="Booking History"
      columns={columns}
      rows={rows}
      emptyTitle="No booking history"
      emptyDescription="This customer hasn't made any bookings yet."
    />
  );
}

export function CustomerPaymentHistory({ rows }: { rows: PaymentHistory[] }) {
  const { formatExact } = useCurrency();
  const toast = useToast();
  const money = (value: number | string, currency?: string) =>
    formatExact(Number(value || 0), currency || "USD");

  const columns: DataTableColumn<PaymentHistory>[] = [
    {
      key: "payment_code",
      header: "Payment ID",
      className: "font-bold text-dash-text",
      render: (row) => {
        const rawCode =
          row.payment_code ||
          (row.id ? `PAY-${row.id}` : row.gateway_payment_id || row.transaction_id || "-");
        const displayCode =
          row.payment_code && !row.payment_code.startsWith("PAY-")
            ? `PAY-${row.payment_code}`
            : rawCode;

        return (
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-dash-brand-hover">
            {row.id ? (
              <Link
                href={`/admin/payments/${row.id}`}
                className="inline-flex items-center gap-1 hover:underline"
              >
                {displayCode}
                <ArrowUpRight size={12} className="opacity-70" />
              </Link>
            ) : (
              <span className="text-dash-text">{displayCode}</span>
            )}
            {displayCode !== "-" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void navigator.clipboard.writeText(displayCode);
                  toast.success(`Copied ${displayCode}`);
                }}
                className="text-dash-subtle hover:text-dash-brand transition-colors"
                title="Copy Payment ID"
              >
                <Copy size={11} />
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: "booking_code",
      header: "Booking",
      className: "text-dash-muted",
      render: (row) => {
        const code = row.booking_code || (row.booking_id ? `TVAC-${row.booking_id}` : "-");
        if (code === "-") return "-";
        return (
          <Link
            href={`/admin/bookings/${row.booking_id || row.booking_code}`}
            className="font-mono text-xs font-bold text-dash-brand-hover hover:underline"
          >
            {code}
          </Link>
        );
      },
    },
    {
      key: "payment_method",
      header: "Method",
      className: "text-dash-muted",
      render: (row) => (
        <span className="capitalize font-medium text-dash-text">{row.payment_method || "-"}</span>
      ),
    },
    {
      key: "payment_type",
      header: "Type",
      className: "text-dash-muted",
      render: (row) => (
        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-700">
          {row.payment_type || "-"}
        </span>
      ),
    },
    {
      key: "paid_amount",
      header: "Paid",
      className: "text-emerald-600 font-medium",
      render: (row) => money(row.paid_amount ?? 0, row.currency),
    },
    {
      key: "pending_amount",
      header: "Pending",
      className: "text-amber-700 font-medium",
      render: (row) => money(row.pending_amount ?? 0, row.currency),
    },
    {
      key: "gst_amount",
      header: "GST",
      className: "text-dash-muted",
      render: (row) => money(row.gst_amount ?? 0, row.currency),
    },
    {
      key: "payment_status",
      header: "Status",
      className: "text-dash-muted",
      render: (row) => <StatusBadge value={row.payment_status || "pending"} />,
    },
    {
      key: "payment_date",
      header: "Date",
      className: "text-dash-muted whitespace-nowrap",
      render: (row) => {
        const rawDate = row.payment_date || row.created_at;
        return (
          <span className="text-xs font-medium text-dash-text">
            {formatDateTime(rawDate)}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      ariaLabel="Payment History"
      columns={columns}
      rows={rows}
      emptyTitle="No payment history"
      emptyDescription="No payments have been recorded for this customer."
    />
  );
}

export function CustomerCommunicationHistory({ rows }: { rows: CustomerCommunication[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dash-border-soft bg-white p-10 text-center text-sm text-dash-muted shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
        No communication found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.id}
          className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold text-dash-text">{row.subject}</p>
            <span className="rounded-full bg-[#EDF5FF] px-3 py-1 text-xs font-bold text-dash-brand-hover">
              {row.email_status}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-dash-muted">{row.message}</p>
          <p className="mt-2 text-xs font-semibold text-dash-subtle">
            {row.message_type}
            {row.booking_id ? ` · Booking #${row.booking_id}` : ""}
            {row.created_at ? ` · ${formatDateTime(row.created_at)}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
