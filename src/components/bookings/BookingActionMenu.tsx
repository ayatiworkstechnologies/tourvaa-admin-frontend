"use client";

import Link from "next/link";
import {
  LuCircleCheckBig as CheckCircle2,
  LuEye as Eye,
  LuCircleX as XCircle,
} from "react-icons/lu";

type BookingActionMenuProps = {
  bookingId: number;
  bookingStatus?: string;
  paymentStatus?: string;
  onCancel?: (bookingId: number) => void;
  onConfirm?: (bookingId: number) => void;
  onApproveCancellation?: (bookingId: number) => void;
  busy?: boolean;
};

export default function BookingActionMenu({
  bookingId,
  bookingStatus,
  onCancel,
  onConfirm,
  onApproveCancellation,
  busy,
}: BookingActionMenuProps) {
  const isCancellationRequested = bookingStatus === "cancellation_requested";
  const canConfirm = bookingStatus && !["confirmed", "cancelled", "cancellation_requested"].includes(bookingStatus);
  const canCancel = bookingStatus !== "cancelled" && !isCancellationRequested;

  return (
    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
      <Link
        href={`/admin/bookings/${bookingId}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-blue-700"
        title="View booking details"
      >
        <Eye size={13} className="shrink-0 text-slate-500" />
        <span>View</span>
      </Link>

      {canConfirm && onConfirm ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onConfirm(bookingId)}
          title="Confirm booking"
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 size={13} className="shrink-0" />
          <span>Confirm</span>
        </button>
      ) : null}

      {isCancellationRequested && onApproveCancellation ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onApproveCancellation(bookingId)}
          title="Approve cancellation request"
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 size={13} className="shrink-0" />
          <span>Confirm</span>
        </button>
      ) : null}

      {canCancel && onCancel ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onCancel(bookingId)}
          title="Cancel booking"
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XCircle size={13} className="shrink-0" />
          <span>Cancel</span>
        </button>
      ) : null}
    </div>
  );
}
