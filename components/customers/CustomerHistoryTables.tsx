"use client";

import {
  BookingHistory,
  CustomerCommunication,
  PaymentHistory,
} from "@/lib/services/customerService";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

function money(value: number) {
  return `$${Number(value || 0).toLocaleString()}`;
}

export function CustomerBookingHistory({ rows }: { rows: BookingHistory[] }) {
  const columns: DataTableColumn<BookingHistory>[] = [
    { key: "booking_code", header: "Booking ID", className: "font-bold text-[#121826]" },
    { key: "tour_name", header: "Tour", className: "text-[#667085]" },
    { key: "tour_date", header: "Date", className: "text-[#667085]" },
    { key: "supplier_name", header: "Supplier", className: "text-[#667085]" },
    { key: "booking_status", header: "Booking", className: "text-[#667085]" },
    { key: "payment_status", header: "Payment", className: "text-[#667085]" },
    { key: "tour_cost", header: "Total", className: "text-[#667085]", render: (row) => money(row.tour_cost) },
    { key: "amount_paid", header: "Paid", className: "text-emerald-600", render: (row) => money(row.amount_paid) },
    { key: "amount_pending", header: "Pending", className: "text-amber-700", render: (row) => money(row.amount_pending) },
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
  const columns: DataTableColumn<PaymentHistory>[] = [
    { key: "payment_code", header: "Payment ID", className: "font-bold text-[#121826]" },
    { key: "booking_code", header: "Booking", className: "text-[#667085]" },
    { key: "payment_method", header: "Method", className: "text-[#667085]" },
    { key: "payment_type", header: "Type", className: "text-[#667085]" },
    { key: "paid_amount", header: "Paid", className: "text-emerald-600", render: (row) => money(row.paid_amount) },
    { key: "pending_amount", header: "Pending", className: "text-amber-700", render: (row) => money(row.pending_amount) },
    { key: "gst_amount", header: "GST", className: "text-[#667085]", render: (row) => money(row.gst_amount) },
    { key: "payment_status", header: "Status", className: "text-[#667085]" },
    { key: "payment_date", header: "Date", className: "text-[#667085]" },
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
      <div className="rounded-2xl border border-[#E9EDF3] bg-white p-10 text-center text-sm text-[#667085] shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
        No communication found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.id}
          className="rounded-2xl border border-[#E9EDF3] bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold text-[#121826]">{row.subject}</p>
            <span className="rounded-full bg-[#EDF5FF] px-3 py-1 text-xs font-bold text-[#2F9FE9]">
              {row.email_status}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#667085]">{row.message}</p>
          <p className="mt-2 text-xs font-semibold text-[#98A2B3]">
            {row.message_type}
            {row.booking_id ? ` · Booking #${row.booking_id}` : ""}
            {row.created_at ? ` · ${new Date(row.created_at).toLocaleString()}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
