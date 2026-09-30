"use client";

import { LuSearch as Search, LuRotateCcw as RotateCcw } from "react-icons/lu";

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
  "h-10.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm font-medium text-slate-800 outline-none transition hover:bg-white focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs";

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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_220px_220px_auto] items-end">
        {/* Search */}
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Search
          </span>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="h-10.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9.5 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition hover:bg-white focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10 shadow-2xs"
              placeholder="Booking ref, tour, customer, country…"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </label>

        {/* Booking Status */}
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Booking Status
          </span>
          <select
            className={selectClass}
            value={bookingStatus}
            onChange={(event) => onBookingStatusChange(event.target.value)}
          >
            {bookingStatusOptions.map((option) => (
              <option key={option.value || "all-bookings"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {/* Payment Status */}
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Payment Status
          </span>
          <select
            className={selectClass}
            value={paymentStatus}
            onChange={(event) => onPaymentStatusChange(event.target.value)}
          >
            {paymentStatusOptions.map((option) => (
              <option key={option.value || "all-payments"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {/* Clear Button */}
        <button
          type="button"
          onClick={onClear}
          disabled={!hasActiveFilters}
          className="inline-flex h-10.5 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw size={14} className="shrink-0" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
