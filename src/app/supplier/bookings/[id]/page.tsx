"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LuCircleAlert as AlertCircle, LuArrowLeft as ArrowLeft, LuBan as Ban, LuBell as Bell, LuCalendarDays as CalendarDays, LuCalendarCheck as CalendarCheck, LuCircleCheckBig as CheckCircle2, LuClock as Clock, LuLoaderCircle as Loader2, LuMessageSquare as MessageSquare, LuPlay as Play, LuSend as Send, LuUser as User, LuCircleX as XCircle, LuX as X } from "react-icons/lu";
import api from "@/lib/api/client";
import DatePicker from "@/components/ui/DatePicker";
import {
  SupplierPageHeader,
  SupplierPageShell,
} from "@/components/supplier/SupplierPage";

type Traveller = {
  id?: number;
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  passport_number?: string;
  nationality?: string;
  date_of_birth?: string;
};

type StatusHistory = {
  id: number;
  old_status: string | null;
  new_status: string;
  change_source: string;
  reason: string | null;
  created_at: string;
};

type Booking = {
  id: number;
  booking_code: string;
  tour_name?: string;
  tour_title?: string;
  tour_id?: number;
  tour_date?: string;
  travel_date?: string;
  num_travellers?: number;
  total_pax?: number;
  total_travellers?: number;
  adults_count?: number;
  booking_status: string;
  supplier_acceptance_status?: string;
  payment_status?: string;
  final_amount?: string | number;
  total_amount?: string | number;
  currency?: string;
  special_requests?: string;
  customer_notes?: string;
  notes?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  travellers?: Traveller[];
  created_at?: string;
  cancellation_reason?: string;
};

type ActionType = "confirm" | "decline" | "ongoing" | "complete" | "cancel" | "postpone";

function statusDot(s: string) {
  const v = (s || "").toLowerCase();
  if (["confirmed", "completed"].includes(v)) return "bg-emerald-500";
  if (["pending", "pending_payment", "pending_supplier_acceptance"].includes(v)) return "bg-amber-500";
  if (["postponed", "ongoing"].includes(v)) return "bg-blue-500";
  if (["cancelled", "declined"].includes(v)) return "bg-red-500";
  return "bg-slate-400";
}

function dateStr(val?: string | null) {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function timeStr(val?: string | null) {
  if (!val) return "";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between border-b border-dash-bg-muted py-2.5 text-sm last:border-b-0">
      <span className="text-dash-muted">{label}</span>
      <span className="font-semibold text-dash-text">{value ?? "-"}</span>
    </div>
  );
}

function ActionBanner({
  status,
  paymentStatus,
  supplierAcceptanceStatus,
  onAction,
  busy,
}: {
  status: string;
  paymentStatus?: string;
  supplierAcceptanceStatus?: string;
  onAction: (type: ActionType, payload?: Record<string, string>) => void;
  busy: ActionType | null;
}) {
  const [showCancel, setShowCancel] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [showPostpone, setShowPostpone] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [postponeReason, setPostponeReason] = useState("");
  const [newDate, setNewDate] = useState("");

  const v = status.toLowerCase();
  const payment = (paymentStatus || "").toLowerCase();
  const acceptance = (supplierAcceptanceStatus || "").toLowerCase();
  const paymentReady = ["authorized", "paid", "partially_paid", "partial"].includes(payment);
  const isPending = acceptance === "pending" && paymentReady && ["pending_payment", "payment_authorized", "pending_supplier_acceptance"].includes(v);
  const isAwaitingPayment = acceptance === "pending" && !paymentReady && v === "pending_payment";
  const isConfirmed = v === "confirmed";
  const isOngoing = v === "ongoing";
  const isPostponed = v === "postponed";

  if (v === "completed") {
    return (
      <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
          <CheckCircle2 size={16} /> This booking is already completed.
        </p>
      </div>
    );
  }

  if (isAwaitingPayment) {
    return (
      <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
          <Clock size={16} /> Waiting for customer payment authorization.
        </p>
        <p className="mt-1 text-sm text-amber-700">Accept and decline actions will be available after the payment hold is ready.</p>
      </div>
    );
  }

  if (!isPending && !isConfirmed && !isOngoing && !isPostponed) return null;

  return (
    <div className="mb-5 rounded-2xl border border-[#D9ECFF] bg-[#F0F7FF] p-5">
      <p className="mb-4 text-sm font-bold text-dash-text">
        {isPending ? "This booking requires your action:" : isPostponed ? "This booking is postponed - resume it when the tour starts:" : isOngoing ? "This tour is ongoing:" : "This booking is confirmed and ready to start:"}
      </p>

      <div className="flex flex-wrap gap-3">
        {isPending && (
          <>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => onAction("confirm")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition-all"
            >
              {busy === "confirm" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Accept Booking
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setShowDecline(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 transition-all"
            >
              <XCircle size={15} /> Decline
            </button>
          </>
        )}

        {(isConfirmed || isPostponed) && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => onAction("ongoing")}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-60 transition-all"
          >
            {busy === "ongoing" ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {isPostponed ? "Resume Tour" : "Start Tour"}
          </button>
        )}

        {isOngoing && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => onAction("complete")}
              className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60 transition-all"
            >
              {busy === "complete" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Mark Completed
            </button>
        )}

        {(isConfirmed || isOngoing || isPostponed) && (
          <>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setShowPostpone(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-dash-border bg-white px-4 py-2.5 text-sm font-bold text-dash-body hover:bg-white/70 disabled:opacity-60 transition-all"
            >
              <CalendarDays size={15} /> Postpone
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setShowCancel(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 transition-all"
            >
              <Ban size={15} /> Cancel
            </button>
          </>
        )}
      </div>

      {showDecline && (
        <div className="mt-4 rounded-xl border border-red-100 bg-white p-4">
          <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="Explain why this booking cannot be accepted..." rows={3} className="w-full resize-none rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-red-400" />
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={!declineReason.trim() || busy !== null} onClick={() => onAction("decline", { reason: declineReason })} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              {busy === "decline" ? "Declining..." : "Confirm Decline"}
            </button>
            <button type="button" onClick={() => setShowDecline(false)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-bold text-dash-body">Close</button>
          </div>
        </div>
      )}

      {showPostpone && (
        <div className="mt-4 rounded-xl border border-[#D9ECFF] bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <DatePicker value={newDate} onChange={setNewDate} minDate={new Date().toISOString().split("T")[0]} placeholder="Select new tour date" />
            <input value={postponeReason} onChange={(e) => setPostponeReason(e.target.value)} placeholder="Reason for postponement" className="rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-dash-brand" />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={!postponeReason.trim() || busy !== null} onClick={() => onAction("postpone", { reason: postponeReason, new_tour_date: newDate })} className="rounded-xl bg-dash-text px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              {busy === "postpone" ? "Postponing..." : "Confirm Postpone"}
            </button>
            <button type="button" onClick={() => setShowPostpone(false)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-bold text-dash-body">Close</button>
          </div>
        </div>
      )}

      {showCancel && (
        <div className="mt-4 rounded-xl border border-red-100 bg-white p-4">
          <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Explain why this booking is being cancelled..." rows={3} className="w-full resize-none rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-red-400" />
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={!cancelReason.trim() || busy !== null} onClick={() => onAction("cancel", { reason: cancelReason })} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              {busy === "cancel" ? "Cancelling..." : "Confirm Cancellation"}
            </button>
            <button type="button" onClick={() => setShowCancel(false)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-bold text-dash-body">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
function NotifyModal({
  bookingCode,
  onClose,
  onSend,
}: {
  bookingCode: string;
  onClose: () => void;
  onSend: (msg: string, notifyCustomer: boolean, notifyAgent: boolean) => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [notifyAgent, setNotifyAgent] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await onSend(message, notifyCustomer, notifyAgent);
      setSent(true);
      setMessage("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-dash-border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-dash-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-dash-brand" />
            <h2 className="text-base font-bold text-dash-text">Send Update</h2>
          </div>
          <button type="button" title="Close" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#F3F8FC]">
            <X size={18} className="text-dash-muted" />
          </button>
        </div>

        {sent ? (
          <div className="px-6 py-8 text-center">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
            <p className="mt-3 font-bold text-dash-text">Update sent!</p>
            <p className="mt-1 text-sm text-dash-muted">Customer and agent have been notified.</p>
            <button type="button" onClick={onClose} className="mt-5 rounded-xl bg-dash-brand px-6 py-2 text-sm font-bold text-white hover:bg-dash-brand-hover">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 px-6 py-5">
            <p className="text-xs text-dash-muted">
              Send an update message about booking <span className="font-bold text-dash-body">{bookingCode}</span> to the customer and/or agent.
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dash-muted">Message *</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="e.g. Your pickup time has been confirmed for 08:00 AM. Please be ready at the hotel lobby."
                className="w-full rounded-xl border border-dash-border px-3.5 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10 resize-none transition-all"
              />
            </div>
            <div className="flex gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-dash-body">
                <input type="checkbox" checked={notifyCustomer} onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="h-4 w-4 rounded border-[#D0D5DD] text-dash-brand accent-dash-brand" />
                Notify Customer
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-dash-body">
                <input type="checkbox" checked={notifyAgent} onChange={(e) => setNotifyAgent(e.target.checked)}
                  className="h-4 w-4 rounded border-[#D0D5DD] text-dash-brand accent-dash-brand" />
                Notify Agent
              </label>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl border border-dash-border py-2.5 text-sm font-bold text-dash-body hover:bg-[#F3F8FC] transition-all">
                Cancel
              </button>
              <button type="submit" disabled={sending}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-dash-brand py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60 transition-all">
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? "Sending..." : "Send Update"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function StatusHistory({ history }: { history: StatusHistory[] }) {
  if (history.length === 0) return null;
  return (
    <div className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Clock size={18} className="text-dash-brand" />
        <h2 className="font-black text-dash-text">Status History</h2>
      </div>
      <ol className="relative ml-2 border-l-2 border-dash-border">
        {history.map((h) => (
          <li key={h.id} className="mb-5 ml-4 last:mb-0">
            <span className={`absolute -left-[9px] mt-0.5 h-4 w-4 rounded-full border-2 border-white ${statusDot(h.new_status)}`} />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-bold text-dash-text capitalize">{h.new_status.replace(/_/g, " ")}</p>
              {h.reason && <p className="text-xs text-dash-muted">{h.reason}</p>}
              <p className="text-[11px] text-dash-subtle">
                {h.change_source} - {dateStr(h.created_at)} {timeStr(h.created_at)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function SupplierBookingDetailPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<ActionType | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showNotify, setShowNotify] = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [bookRes, histRes] = await Promise.allSettled([
        api.get(`/supplier/bookings/${bookingId}`),
        api.get(`/supplier/bookings/${bookingId}/status-history`),
      ]);
      if (bookRes.status === "fulfilled") setBooking(bookRes.value.data?.data ?? bookRes.value.data);
      if (histRes.status === "fulfilled") setHistory(histRes.value.data?.data ?? []);
      if (bookRes.status === "rejected") setError("Failed to load booking details.");
      else if (histRes.status === "rejected") setError("Booking loaded, but status history could not be loaded.");
    } catch {
      setError("Failed to load booking details.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { void load(); }, [load]);

  const handleAction = async (type: ActionType, payload?: Record<string, string>) => {
    setBusy(type);
    try {
      if (type === "confirm") {
        await api.post(`/supplier/bookings/${bookingId}/accept`, {});
        showToast("success", "Booking accepted. The customer has been notified.");
      } else if (type === "decline") {
        await api.post(`/supplier/bookings/${bookingId}/decline`, { reason: payload?.reason });
        showToast("success", "Booking declined and the payment hold has been released.");
      } else if (type === "ongoing") {
        await api.patch(`/supplier/bookings/${bookingId}/ongoing`, { reason: payload?.reason || "Tour started by supplier" });
        showToast("success", "Tour marked as ongoing. Customer and agent have been notified.");
      } else if (type === "complete") {
        await api.patch(`/supplier/bookings/${bookingId}/complete`, {});
        showToast("success", "Booking marked as completed. Customer has been notified.");
      } else if (type === "cancel") {
        await api.patch(`/supplier/bookings/${bookingId}/cancel`, { reason: payload?.reason });
        showToast("success", "Booking cancelled. Customer has been notified.");
      } else if (type === "postpone") {
        await api.patch(`/supplier/bookings/${bookingId}/postpone`, {
          reason: payload?.reason,
          new_tour_date: payload?.new_tour_date || undefined,
        });
        showToast("success", "Booking postponed. Customer and agent have been notified.");
      }
      void load();
    } catch (e: unknown) {
      const responseData = (e as { response?: { data?: { detail?: string; message?: string } } })?.response?.data;
      const detail = responseData?.detail || responseData?.message;
      showToast("error", typeof detail === "string" ? detail : "Action failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleNotify = async (msg: string, notifyCustomer: boolean, notifyAgent: boolean) => {
    await api.post(`/supplier/bookings/${bookingId}/notify`, {
      message: msg,
      notify_customer: notifyCustomer,
      notify_agent: notifyAgent,
    });
  };

  if (loading) {
    return (
      <SupplierPageShell>
        <div className="mb-6 h-5 w-24 animate-pulse rounded bg-dash-border" />
        <div className="mb-6 h-8 w-64 animate-pulse rounded-lg bg-dash-border" />
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border border-dash-border bg-white" />
          ))}
        </div>
      </SupplierPageShell>
    );
  }

  if (error || !booking) {
    return (
      <SupplierPageShell>
        <Link href="/supplier/bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-dash-muted hover:text-dash-text">
          <ArrowLeft size={15} /> Bookings
        </Link>
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-red-400" />
          <p className="mt-3 font-bold text-red-700">{error || "Booking not found"}</p>
          <button type="button" onClick={load}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">
            Retry
          </button>
        </div>
      </SupplierPageShell>
    );
  }

  const pax = booking.total_travellers ?? booking.num_travellers ?? booking.total_pax;

  return (
    <SupplierPageShell>
      <SupplierPageHeader
        eyebrow={`Booking ${booking.booking_code}`}
        title={booking.tour_name ?? booking.tour_title ?? "Tour booking"}
        description="Review traveller details, payment status and every booking update from one workspace."
        icon={CalendarCheck}
        actions={[
          { label: "Back to bookings", href: "/supplier/bookings", icon: ArrowLeft },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black capitalize text-emerald-700">
            {booking.booking_status.replace(/_/g, " ")}
          </span>
          <button
            type="button"
            onClick={() => setShowNotify(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
          >
            <MessageSquare size={14} />
            Send Update
          </button>
        </div>
      </SupplierPageHeader>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"}`}>
          <span className="flex items-center gap-2">
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </span>
          <button type="button" title="Dismiss" onClick={() => setToast(null)} className="hover:opacity-70"><X size={14} /></button>
        </div>
      )}

      {/* Action banner */}
      <ActionBanner status={booking.booking_status} paymentStatus={booking.payment_status} supplierAcceptanceStatus={booking.supplier_acceptance_status} onAction={handleAction} busy={busy} />

      {/* Details grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Booking Info */}
        <div className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarCheck size={18} className="text-emerald-600" />
            <h2 className="font-black text-dash-text">Booking Details</h2>
          </div>
          <InfoRow label="Booking Code" value={booking.booking_code} />
          <InfoRow label="Tour" value={booking.tour_name ?? booking.tour_title} />
          <InfoRow label="Travel Date" value={dateStr(booking.tour_date ?? booking.travel_date)} />
          <InfoRow label="Travellers" value={pax ?? "-"} />
          <InfoRow label="Adults" value={booking.adults_count} />
          <InfoRow label="Booking Status" value={booking.booking_status.replace(/_/g, " ")} />
          <InfoRow label="Supplier Decision" value={(booking.supplier_acceptance_status ?? "-").replace(/_/g, " ")} />
          <InfoRow label="Payment Status" value={booking.payment_status ?? "-"} />
          <InfoRow label="Booked On" value={dateStr(booking.created_at)} />
        </div>

        {/* Payment Info */}
        <div className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-emerald-600 font-black text-lg">$</span>
            <h2 className="font-black text-dash-text">Payment Information</h2>
          </div>
          <InfoRow
            label="Total Amount"
            value={`${booking.currency ?? "USD"} ${Number(booking.final_amount ?? booking.total_amount ?? 0).toLocaleString()}`}
          />
          <InfoRow label="Payment Status" value={booking.payment_status ?? "-"} />
          {booking.cancellation_reason && (
            <div className="mt-3 rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-xs font-bold text-red-600">Cancellation Reason</p>
              <p className="mt-1 text-sm text-red-700">{booking.cancellation_reason}</p>
            </div>
          )}
          {(booking.special_requests || booking.customer_notes) && (
            <div className="mt-3 rounded-xl bg-dash-bg-muted p-3">
              <p className="text-xs font-bold text-dash-muted">Special Requests</p>
              <p className="mt-1 text-sm text-dash-body">{booking.special_requests ?? booking.customer_notes}</p>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <User size={18} className="text-emerald-600" />
            <h2 className="font-black text-dash-text">Lead Contact</h2>
          </div>
          <InfoRow label="Name" value={booking.contact_name} />
          <InfoRow label="Email" value={booking.contact_email} />
          <InfoRow label="Phone" value={booking.contact_phone} />
        </div>

        {/* Status History */}
        <StatusHistory history={history} />

        {/* Travellers */}
        {booking.travellers && booking.travellers.length > 0 && (
          <div className="rounded-xl border border-dash-border bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <User size={18} className="text-emerald-600" />
              <h2 className="font-black text-dash-text">Travellers ({booking.travellers.length})</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {booking.travellers.map((t, i) => (
                <div key={t.id ?? i} className="rounded-xl border border-dash-border p-3">
                  <p className="font-semibold text-dash-text">{t.full_name ?? t.name ?? `Traveller ${i + 1}`}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-dash-muted">
                    {t.email && <span>{t.email}</span>}
                    {t.phone && <span>{t.phone}</span>}
                    {t.nationality && <span>Nationality: {t.nationality}</span>}
                    {t.passport_number && <span>Passport: {t.passport_number}</span>}
                    {t.date_of_birth && <span>DOB: {t.date_of_birth}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notify modal */}
      {showNotify && (
        <NotifyModal
          bookingCode={booking.booking_code}
          onClose={() => setShowNotify(false)}
          onSend={handleNotify}
        />
      )}
    </SupplierPageShell>
  );
}



