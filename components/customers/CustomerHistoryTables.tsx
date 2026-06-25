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
    <section className="rounded-xl border border-[#E7EAF0] bg-white p-6">
      <h3 className="text-lg font-bold text-[#121826]">Booking History</h3>
      <div className="mt-4 p-0">
        <DataTable
          ariaLabel="Booking History"
          columns={columns}
          rows={rows}
          emptyTitle="No booking history"
        />
      </div>
    </section>
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
    <section className="rounded-xl border border-[#E7EAF0] bg-white p-6">
      <h3 className="text-lg font-bold text-[#121826]">Payment History</h3>
      <div className="mt-4 p-0">
        <DataTable
          ariaLabel="Payment History"
          columns={columns}
          rows={rows}
          emptyTitle="No payment history"
        />
      </div>
    </section>
  );
}

export function CustomerCommunicationHistory({ rows }: { rows: CustomerCommunication[] }) {
  return (
    <section className="rounded-xl border border-[#E7EAF0] bg-white p-6">
      <h3 className="text-lg font-bold text-[#121826]">Communication History</h3>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl bg-[#F7F9FC] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-bold text-[#121826]">{row.subject}</p>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#2F9FE9]">
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
        {rows.length === 0 && (
          <p className="rounded-xl bg-[#F7F9FC] p-5 text-sm text-[#667085]">No communication found.</p>
        )}
      </div>
    </section>
  );
}
