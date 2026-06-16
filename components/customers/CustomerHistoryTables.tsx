"use client";

import {
  BookingHistory,
  CustomerCommunication,
  PaymentHistory,
} from "@/lib/services/customerService";

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString()}`;
}

export function CustomerBookingHistory({ rows }: { rows: BookingHistory[] }) {
  return (
    <section className="rounded-xl border border-[#E7EAF0] bg-white p-6">
      <h3 className="text-lg font-bold text-[#121826]">Booking History</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[#F7F9FC] text-xs uppercase text-[#667085]">
            <tr>
              {["Booking ID", "Tour", "Date", "Supplier", "Booking", "Payment", "Total", "Paid", "Pending"].map((item) => (
                <th key={item} className="px-4 py-3">{item}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F6]">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-bold text-[#121826]">{row.booking_code}</td>
                <td className="px-4 py-3 text-[#667085]">{row.tour_name}</td>
                <td className="px-4 py-3 text-[#667085]">{row.tour_date}</td>
                <td className="px-4 py-3 text-[#667085]">{row.supplier_name}</td>
                <td className="px-4 py-3 text-[#667085]">{row.booking_status}</td>
                <td className="px-4 py-3 text-[#667085]">{row.payment_status}</td>
                <td className="px-4 py-3 text-[#667085]">{money(row.tour_cost)}</td>
                <td className="px-4 py-3 text-emerald-600">{money(row.amount_paid)}</td>
                <td className="px-4 py-3 text-amber-700">{money(row.amount_pending)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CustomerPaymentHistory({ rows }: { rows: PaymentHistory[] }) {
  return (
    <section className="rounded-xl border border-[#E7EAF0] bg-white p-6">
      <h3 className="text-lg font-bold text-[#121826]">Payment History</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-[#F7F9FC] text-xs uppercase text-[#667085]">
            <tr>
              {["Payment ID", "Booking", "Method", "Type", "Paid", "Pending", "GST", "Status", "Date"].map((item) => (
                <th key={item} className="px-4 py-3">{item}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F6]">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-bold text-[#121826]">{row.payment_code}</td>
                <td className="px-4 py-3 text-[#667085]">{row.booking_code}</td>
                <td className="px-4 py-3 text-[#667085]">{row.payment_method}</td>
                <td className="px-4 py-3 text-[#667085]">{row.payment_type}</td>
                <td className="px-4 py-3 text-emerald-600">{money(row.paid_amount)}</td>
                <td className="px-4 py-3 text-amber-700">{money(row.pending_amount)}</td>
                <td className="px-4 py-3 text-[#667085]">{money(row.gst_amount)}</td>
                <td className="px-4 py-3 text-[#667085]">{row.payment_status}</td>
                <td className="px-4 py-3 text-[#667085]">{row.payment_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#238DD7]">
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
