"use client";

import Link from "next/link";

type BookingActionMenuProps = {
  bookingId: number;
  bookingStatus?: string;
  paymentStatus?: string;
  onCancel?: (bookingId: number) => void;
  onConfirm?: (bookingId: number) => void;
};

export default function BookingActionMenu({
  bookingId,
  bookingStatus,
  paymentStatus,
  onCancel,
  onConfirm,
}: BookingActionMenuProps) {
  const canConfirm = bookingStatus && !["confirmed", "cancelled"].includes(bookingStatus);
  const canCancel = bookingStatus !== "cancelled";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        href={`/bookings/${bookingId}`}
      >
        View
      </Link>

      {canConfirm && onConfirm ? (
        <button
          className="rounded-md border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          type="button"
          onClick={() => onConfirm(bookingId)}
        >
          Confirm
        </button>
      ) : null}

      {canCancel && onCancel ? (
        <button
          className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          type="button"
          onClick={() => onCancel(bookingId)}
        >
          Cancel
        </button>
      ) : null}

      {paymentStatus ? (
        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
          {paymentStatus.replaceAll("_", " ")}
        </span>
      ) : null}
    </div>
  );
}
