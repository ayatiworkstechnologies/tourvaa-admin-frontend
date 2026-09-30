"use client";

import Link from "next/link";
import { LuCalendar as Calendar } from "react-icons/lu";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { Booking } from "@/lib/api/services/bookingService";
import BookingActionMenu from "./BookingActionMenu";
import BookingStatusBadge from "./BookingStatusBadge";

type BookingTableProps = {
  rows: Booking[];
  loading: boolean;
  page: number;
  total: number;
  totalPages: number;
  pageSize: number;
  error?: string;
  onPageChange: (page: number) => void;
  onCancel?: (bookingId: number) => void;
  onConfirm?: (bookingId: number) => void;
  busyBookingId?: number | null;
};

function money(value: string | number | undefined, currency: string) {
  const amount = Number(value || 0).toLocaleString();
  return `${currency || "USD"} ${amount}`.trim();
}

function dueDateText(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name?: string | null): string {
  if (!name) return "C";
  const parts = name.replace(/[^a-zA-Z0-9 ]/g, "").trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0]?.[0] || "C").toUpperCase();
}

export default function BookingTable({
  onCancel,
  onConfirm,
  busyBookingId,
  ...tableProps
}: BookingTableProps) {
  const { page, pageSize } = tableProps;

  const columns: DataTableColumn<Booking>[] = [
    {
      key: "no",
      header: "#",
      className: "w-12 text-center",
      render: (_row, index) => (
        <span className="text-xs font-semibold text-slate-400 tabular-nums">
          {(page - 1) * pageSize + index + 1}
        </span>
      ),
    },
    {
      key: "booking_code",
      header: "Booking Ref",
      className: "whitespace-nowrap",
      render: (booking) => (
        <Link
          href={`/admin/bookings/${booking.id}`}
          className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-slate-50/70 px-2.5 py-1 font-mono text-xs font-bold text-slate-800 shadow-2xs transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700"
          title="View booking details"
        >
          <span>{booking.booking_code || `BK-${booking.id}`}</span>
        </Link>
      ),
    },
    {
      key: "customer_name",
      header: "Customer",
      className: "min-w-[190px]",
      render: (booking) => {
        const name =
          booking.customer_name || `Customer #${booking.customer_id}`;
        const initials = getInitials(booking.customer_name);
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700 border border-slate-200/80 shadow-2xs">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate">
                {name}
              </p>
              {booking.customer_email && (
                <p className="text-xs text-slate-500 truncate max-w-[180px]">
                  {booking.customer_email}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "tour_name",
      header: "Tour & Date",
      className: "min-w-[180px]",
      render: (booking) => (
        <div>
          {booking.tour_name ? (
            <>
              <p className="font-semibold text-slate-900 text-sm line-clamp-1">
                {booking.tour_name}
              </p>
              {booking.tour_date && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <Calendar size={12} className="shrink-0 text-slate-400" />
                  <span>{booking.tour_date}</span>
                </p>
              )}
            </>
          ) : (
            <span className="inline-flex items-center text-xs text-slate-400 italic">
              Unspecified tour
            </span>
          )}
        </div>
      ),
    },
    {
      key: "booking_status",
      header: "Booking Status",
      className: "whitespace-nowrap",
      render: (booking) => <BookingStatusBadge value={booking.booking_status} />,
    },
    {
      key: "supplier_acceptance_status",
      header: "Supplier",
      className: "whitespace-nowrap",
      render: (booking) => (
        <BookingStatusBadge
          value={booking.supplier_acceptance_status || "not_assigned"}
        />
      ),
    },
    {
      key: "payment_status",
      header: "Payment",
      className: "whitespace-nowrap",
      render: (booking) => <BookingStatusBadge value={booking.payment_status} />,
    },
    {
      key: "payment_due_date",
      header: "Due Date",
      className: "whitespace-nowrap text-xs text-slate-500 font-medium",
      render: (booking) => dueDateText(booking.payment_due_date),
    },
    {
      key: "final_amount",
      header: "Final",
      className: "whitespace-nowrap text-right font-bold text-slate-900 tabular-nums",
      render: (booking) => money(booking.final_amount, booking.currency),
    },
    {
      key: "amount_pending",
      header: "Pending",
      className: "whitespace-nowrap text-right tabular-nums",
      render: (booking) => {
        const val = Number(booking.amount_pending || 0);
        if (val > 0) {
          return (
            <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200/80">
              {money(booking.amount_pending, booking.currency)}
            </span>
          );
        }
        return (
          <span className="text-xs font-medium text-slate-400">
            {money(0, booking.currency)}
          </span>
        );
      },
    },
    {
      key: "id",
      header: "Actions",
      className: "whitespace-nowrap text-right min-w-[130px]",
      render: (booking) => (
        <BookingActionMenu
          bookingId={booking.id}
          bookingStatus={booking.booking_status}
          paymentStatus={booking.payment_status}
          onCancel={onCancel}
          onConfirm={onConfirm}
          busy={busyBookingId === booking.id}
        />
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel="Bookings"
      columns={columns}
      emptyTitle="No bookings found"
      emptyDescription="Try adjusting your filters or search terms."
      minWidthClass="min-w-[1140px]"
      {...tableProps}
    />
  );
}
