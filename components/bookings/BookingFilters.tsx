"use client";

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

export default function BookingFilters({
  search,
  bookingStatus,
  paymentStatus,
  onSearchChange,
  onBookingStatusChange,
  onPaymentStatusChange,
  onClear,
}: BookingFiltersProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Search
        <input
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="Booking, tour, country"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Booking status
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Payment status
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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

      <button
        className="self-end rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        type="button"
        onClick={onClear}
      >
        Clear
      </button>
    </div>
  );
}
