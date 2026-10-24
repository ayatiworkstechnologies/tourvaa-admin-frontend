"use client";

import { LuSearch as Search, LuRotateCcw as RotateCcw } from "react-icons/lu";

export type BookingFilterValues = {
  search: string;
  bookingStatus: string;
  paymentStatus: string;
  cancellationSource: string;
};

type BookingFiltersProps = BookingFilterValues & {
  onSearchChange: (value: string) => void;
  onBookingStatusChange: (value: string) => void;
  onPaymentStatusChange: (value: string) => void;
  onCancellationSourceChange: (value: string) => void;
  onClear: () => void;
};

const bookingStatusGroups = [
  {
    label: "Action required",
    options: [
      { label: "Draft", value: "draft" },
      { label: "Pending payment", value: "pending_payment" },
      { label: "Pending supplier assignment", value: "pending_supplier_assignment" },
      { label: "Payment authorized", value: "payment_authorized" },
      { label: "Pending supplier acceptance", value: "pending_supplier_acceptance" },
      { label: "Supplier accepted - awaiting Tourvaa", value: "supplier_accepted" },
      { label: "Supplier reassignment required", value: "supplier_reassignment_required" },
      { label: "Cancellation requested", value: "cancellation_requested" },
    ],
  },
  {
    label: "Active tours",
    options: [
      { label: "Confirmed", value: "confirmed" },
      { label: "Ready to travel", value: "ready_to_travel" },
      { label: "Upcoming (legacy)", value: "upcoming" },
      { label: "Ongoing", value: "ongoing" },
      { label: "Postponed", value: "postponed" },
    ],
  },
  {
    label: "Closed",
    options: [
      { label: "Completed", value: "completed" },
      { label: "Cancelled", value: "cancelled" },
      { label: "Declined", value: "declined" },
      { label: "Refunded", value: "refunded" },
    ],
  },
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
  cancellationSource,
  onSearchChange,
  onBookingStatusChange,
  onPaymentStatusChange,
  onCancellationSourceChange,
  onClear,
}: BookingFiltersProps) {
  const hasActiveFilters = Boolean(search || bookingStatus || paymentStatus || cancellationSource);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_200px_190px_190px_auto] items-end">
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

        {/* Cancellation attribution */}
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Cancellation Origin
          </span>
          <select
            className={selectClass}
            value={cancellationSource}
            onChange={(event) => onCancellationSourceChange(event.target.value)}
          >
            <option value="">All cancellations</option>
            <option value="customer_request,customer_unpaid_removed">Cancelled by Customer</option>
            <option value="tourvaa_admin,system_expiry">Cancelled by Tourvaa</option>
          </select>
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
            <option value="">All bookings</option>
            {bookingStatusGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </optgroup>
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
