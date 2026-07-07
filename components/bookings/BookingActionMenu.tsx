"use client";

import Link from "next/link";
import { LuCircleCheckBig as CheckCircle2, LuEye as Eye, LuCircleX as XCircle } from "react-icons/lu";

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
  onCancel,
  onConfirm,
}: BookingActionMenuProps) {
  const canConfirm = bookingStatus && !["confirmed", "cancelled"].includes(bookingStatus);
  const canCancel = bookingStatus !== "cancelled";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7EAF0] px-3 py-1.5 text-xs font-bold text-[#2F9FE9] hover:bg-[#E7F5FF]"
        href={`/admin/bookings/${bookingId}`}
      >
        <Eye size={13} /> View
      </Link>

      {canConfirm && onConfirm ? (
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
          type="button"
          onClick={() => onConfirm(bookingId)}
        >
          <CheckCircle2 size={13} /> Confirm
        </button>
      ) : null}

      {canCancel && onCancel ? (
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
          type="button"
          onClick={() => onCancel(bookingId)}
        >
          <XCircle size={13} /> Cancel
        </button>
      ) : null}
    </div>
  );
}
