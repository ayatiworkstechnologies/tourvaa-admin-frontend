"use client";

import { LuSearch as Search, LuX as X } from "react-icons/lu";

export type BookingFilterValues = {
  search: string;
  bookingStatus: string;
  paymentStatus: string;
};

type BookingFiltersProps = BookingFilterValues & {
  onSearchChange: (value: string) => void;
  onBookingStatusChange: (value: string) => void;
  onPaymentStatusChange: (value: string) => void;
  onClear: () => void;
};

const bookingStatusOptions = [
  { label: "All bookings", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Pending payment", value: "pending_payment" },
  { label: "Payment authorized", value: "payment_authorized" },
  { label: "Pending supplier", value: "pending_supplier_acceptance" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Declined", value: "declined" },
  { label: "Postponed", value: "postponed" },
  { label: "Cancelled", value: "cancelled" },
];

const paymentStatusOptions = [
  { label: "All payments", value: "" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Authorized", value: "authorized" },
  { label: "Partially paid", value: "partially_paid" },
  { label: "Paid", value: "paid" },
  { label: "Refunded", value: "refunded" },
];

const selectClass =
  "w-full rounded-xl border border-dash-border bg-white px-3.5 py-2.5 text-sm font-medium text-dash-body outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10";

export default function BookingFilters({
  search,
  bookingStatus,
  paymentStatus,
  onSearchChange,
  onBookingStatusChange,
  onPaymentStatusChange,
  onClear,
}: BookingFiltersProps) {
  const hasActiveFilters = Boolean(search || bookingStatus || paymentStatus);

  return (
    <div className="grid gap-3 rounded-2xl border border-dash-border-soft bg-white p-4 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] md:grid-cols-[minmax(220px,1fr)_200px_200px_auto]">
      <label className="relative block">
        <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Search</span>
        <Search size={15} className="pointer-events-none absolute left-3 top-[calc(50%+8px)] -translate-y-1/2 text-[#B0B9C6]" />
        <input
          className="w-full rounded-xl border border-dash-border py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
          placeholder="Booking, tour, customer, country..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Booking status</span>
        <select className={selectClass} value={bookingStatus} onChange={(event) => onBookingStatusChange(event.target.value)}>
          {bookingStatusOptions.map((option) => (
            <option key={option.value || "all-bookings"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Payment status</span>
        <select className={selectClass} value={paymentStatus} onChange={(event) => onPaymentStatusChange(event.target.value)}>
          {paymentStatusOptions.map((option) => (
            <option key={option.value || "all-payments"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <button
        className="inline-flex items-center justify-center gap-1.5 self-end rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-muted transition hover:bg-dash-bg disabled:cursor-not-allowed disabled:opacity-40"
        type="button"
        onClick={onClear}
        disabled={!hasActiveFilters}
      >
        <X size={14} /> Clear
      </button>
    </div>
  );
}

