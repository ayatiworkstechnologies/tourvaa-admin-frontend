"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LuCircleAlert as AlertCircle, LuArrowLeft as ArrowLeft, LuBan as Ban, LuBell as Bell, LuCalendarDays as CalendarDays, LuCalendarCheck as CalendarCheck, LuCircleCheckBig as CheckCircle2, LuClock as Clock, LuLoaderCircle as Loader2, LuMessageSquare as MessageSquare, LuPlay as Play, LuSend as Send, LuUser as User, LuCircleX as XCircle, LuX as X } from "react-icons/lu";
import api from "@/lib/api/client";
import {
  SupplierPageHeader,
  SupplierPageShell,
} from "@/components/supplier/SupplierPage";
import { useCurrency } from "@/hooks/useCurrency";
import { useMessagingSocket } from "@/hooks/useMessagingSocket";
import { useToast } from "@/hooks/useToast";
import {
  BookingConversationThread,
  BookingMessage,
  getSupplierBookingConversationForBooking,
  replySupplierBookingConversation,
} from "@/lib/api/services/messagingService";

type Traveller = {
  id?: number;
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  passport_number?: string;
  nationality?: string;
  date_of_birth?: string;
  is_primary_contact?: boolean;
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
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  travellers?: Traveller[];
  created_at?: string;
  cancellation_reason?: string;
  supplier_payment_summary?: {
    currency: string;
    gross_amount: string;
    commission_percentage: string;
    commission_amount: string;
    net_payable: string;
    payment_status: string;
    payment_date?: string | null;
  } | null;
  supplier_cancellation_terms?: {
    tier: "no_charge" | "full_liability" | "partial_liability";
    liability_percentage: string;
    refund_percentage: string;
  };
};

type ActionType = "confirm" | "decline" | "ongoing" | "complete" | "cancel";

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
  supplierAcceptanceStatus,
  cancellationTerms,
  onAction,
  busy,
}: {
  status: string;
  supplierAcceptanceStatus?: string;
  cancellationTerms?: Booking["supplier_cancellation_terms"];
  onAction: (type: ActionType, payload?: Record<string, string>) => void;
  busy: ActionType | null;
}) {
  const [showCancel, setShowCancel] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [declineReason, setDeclineReason] = useState("");

  useEffect(() => {
    if (!showCancel && !showCancelConfirm && !showDecline) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShowCancel(false);
      setShowCancelConfirm(false);
      setShowDecline(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showCancel, showCancelConfirm, showDecline]);

  const v = status.toLowerCase();
  const acceptance = (supplierAcceptanceStatus || "").toLowerCase();
  const isPending = acceptance === "pending" && v === "pending_supplier_acceptance";
  const isConfirmed = v === "confirmed";
  const isOngoing = v === "ongoing";

  if (v === "postponed") {
    return (
      <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-blue-800">
          <Clock size={16} /> This booking has been postponed. Please contact Tourvaa support for the next steps.
        </p>
      </div>
    );
  }

  if (v === "completed") {
    return (
      <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
          <CheckCircle2 size={16} /> This booking is already completed.
        </p>
      </div>
    );
  }

  if (!isPending && !isConfirmed && !isOngoing) return null;

  return (
    <div className="mb-5 rounded-2xl border border-[#D9ECFF] bg-[#F0F7FF] p-5">
      <p className="mb-4 text-sm font-bold text-dash-text">
        {isPending ? "This booking requires your action:" : isOngoing ? "This tour is ongoing:" : "This booking is confirmed and ready to start:"}
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

        {isConfirmed && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => onAction("ongoing")}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-60 transition-all"
          >
            {busy === "ongoing" ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            Start Tour
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

        {(isConfirmed || isOngoing) && (
          <>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setShowCancelConfirm(true)}
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

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="supplier-cancel-confirm-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 id="supplier-cancel-confirm-title" className="text-lg font-black text-dash-text">Confirm booking cancellation</h3>
            <p className="mt-3 text-sm leading-6 text-dash-muted">
              {cancellationTerms?.tier === "no_charge"
                ? "In accordance with the terms and conditions, no cancellation charge will apply to this booking. Do you want to continue with the cancellation?"
                : cancellationTerms?.tier === "partial_liability"
                  ? `In accordance with the terms and conditions, cancelling this booking will result in a charge equivalent to ${cancellationTerms.liability_percentage}% of the applicable booking amount, less any applicable transaction fees. Do you want to continue with the cancellation?`
                  : "In accordance with the terms and conditions, cancelling this booking will result in a charge equivalent to 100% of the applicable booking amount, less any applicable transaction fees. Do you want to continue with the cancellation?"}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCancelConfirm(false)} className="rounded-xl border border-dash-border bg-white px-4 py-2 text-sm font-bold text-dash-body hover:bg-dash-bg">No</button>
              <button type="button" onClick={() => { setShowCancelConfirm(false); setShowCancel(true); }} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">Yes, continue</button>
            </div>
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
  const router = useRouter();
  const bookingId = params.id as string;
  const { formatExact: format } = useCurrency();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<ActionType | null>(null);
  const toast = useToast();
  const [showNotify, setShowNotify] = useState(false);
  const [downloadingIcs, setDownloadingIcs] = useState(false);
  const [messageThread, setMessageThread] = useState<BookingConversationThread | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [bookRes, histRes, messageRes] = await Promise.allSettled([
        api.get(`/supplier/bookings/${bookingId}`),
        api.get(`/supplier/bookings/${bookingId}/status-history`),
        getSupplierBookingConversationForBooking(bookingId),
      ]);
      if (bookRes.status === "fulfilled") setBooking(bookRes.value.data?.data ?? bookRes.value.data);
      if (histRes.status === "fulfilled") setHistory(histRes.value.data?.data ?? []);
      if (messageRes.status === "fulfilled") setMessageThread(messageRes.value);
      else setMessageThread(null);
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
        toast.success("Booking accepted. The customer has been notified.");
      } else if (type === "decline") {
        await api.post(`/supplier/bookings/${bookingId}/decline`, { reason: payload?.reason });
        toast.success("Booking declined and the payment hold has been released.");
      } else if (type === "ongoing") {
        await api.patch(`/supplier/bookings/${bookingId}/ongoing`, { reason: payload?.reason || "Tour started by supplier" });
        toast.success("Tour marked as ongoing. Customer and agent have been notified.");
      } else if (type === "complete") {
        await api.patch(`/supplier/bookings/${bookingId}/complete`, {});
        toast.success("Booking marked as completed. Customer has been notified.");
      } else if (type === "cancel") {
        await api.patch(`/supplier/bookings/${bookingId}/cancel`, { reason: payload?.reason });
        toast.success("Tourvaa has been notified. The booking is awaiting internal supplier reassignment.");
        // The record remains in the Operations queue, but leaves this
        // supplier's work queue immediately after the withdrawal is filed.
        router.replace("/supplier/bookings");
        return;
      }
      void load();
    } catch (e: unknown) {
      const responseData = (e as { response?: { data?: { detail?: string; message?: string } } })?.response?.data;
      const detail = responseData?.detail || responseData?.message;
      toast.error(typeof detail === "string" ? detail : "Action failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const downloadCalendarEvent = async () => {
    setDownloadingIcs(true);
    try {
      await api.post(`/bookings/${bookingId}/calendar-sync`);
      const res = await api.get(`/bookings/${bookingId}/calendar-event/download`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/calendar" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${booking?.booking_code || bookingId}.ics`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download the calendar event.");
    } finally {
      setDownloadingIcs(false);
    }
  };

  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useMessagingSocket(
    useCallback((event) => {
      if (event.type !== "new_booking_message" || event.conversation.booking_id !== Number(bookingId)) return;
      setMessageThread((previous) => (
        previous && previous.id === event.conversation.id
          ? {
              ...event.conversation,
              messages: previous.messages.some((message) => message.id === event.message.id)
                ? previous.messages
                : [...previous.messages, event.message],
            }
          : previous
      ));
    }, [bookingId])
  );

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const thread = messageThread ?? await getSupplierBookingConversationForBooking(bookingId);
      if (!messageThread) setMessageThread(thread);
      const message = await replySupplierBookingConversation(thread.id, newMessage.trim());
      setNewMessage("");
      setMessageThread((previous) => previous
        ? { ...previous, messages: previous.messages.some((item) => item.id === message.id) ? previous.messages : [...previous.messages, message] }
        : previous);
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string | Array<{ msg?: string }> } } })?.response?.data?.detail;
      const message = Array.isArray(detail) ? detail.map((item) => item.msg).filter(Boolean).join(" ") : detail;
      toast.error(message || "Could not send message.");
    } finally {
      setSendingMessage(false);
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
  // Prefer the explicitly selected primary contact.  For older booking
  // payloads, a one-person booking is naturally its own lead traveller;
  // customer fields remain a final fallback for legacy records.
  const leadTraveller = booking.travellers?.find((traveller) => traveller.is_primary_contact)
    ?? (booking.travellers?.length === 1 ? booking.travellers[0] : undefined);
  const leadName = booking.contact_name ?? leadTraveller?.full_name ?? leadTraveller?.name ?? booking.customer_name;
  const leadEmail = booking.contact_email ?? leadTraveller?.email ?? booking.customer_email;
  const leadPhone = booking.contact_phone ?? leadTraveller?.phone ?? booking.customer_phone;
  const chatMessages = messageThread?.messages ?? [];
  const messageGroups = chatMessages.reduce<{ date: string; messages: BookingMessage[] }[]>((groups, message) => {
    const date = message.created_at ? new Date(message.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Unknown date";
    const previous = groups[groups.length - 1];
    if (previous?.date === date) previous.messages.push(message);
    else groups.push({ date, messages: [message] });
    return groups;
  }, []);

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
            onClick={() => void downloadCalendarEvent()}
            disabled={downloadingIcs}
            className="flex items-center gap-2 rounded-xl border border-dash-border bg-white px-4 py-2.5 text-sm font-bold text-dash-body shadow-sm transition-all hover:bg-[#F3F8FC] disabled:opacity-60"
          >
            {downloadingIcs ? <Loader2 className="animate-spin" size={14} /> : <CalendarDays size={14} />}
            Add to Calendar
          </button>
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

      {/* Action banner */}
      <ActionBanner status={booking.booking_status} supplierAcceptanceStatus={booking.supplier_acceptance_status} cancellationTerms={booking.supplier_cancellation_terms} onAction={handleAction} busy={busy} />

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
          {booking.payment_status && <InfoRow label="Payment Status" value={booking.payment_status} />}
          <InfoRow label="Booked On" value={dateStr(booking.created_at)} />
        </div>

        {/* Supplier settlement information */}
        <div className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-emerald-600 font-black text-lg">$</span>
            <h2 className="font-black text-dash-text">Supplier Gross Amount</h2>
          </div>
          <InfoRow label="Supplier Gross Amount" value={format(booking.supplier_payment_summary?.gross_amount ?? 0, booking.supplier_payment_summary?.currency ?? booking.currency)} />
          <InfoRow label="Commission to Tourvaa" value={booking.supplier_payment_summary ? `${booking.supplier_payment_summary.commission_percentage}%` : "-"} />
          <InfoRow label="Commission Amount" value={format(booking.supplier_payment_summary?.commission_amount ?? 0, booking.supplier_payment_summary?.currency ?? booking.currency)} />
          <InfoRow label="Supplier Net Payable" value={format(booking.supplier_payment_summary?.net_payable ?? 0, booking.supplier_payment_summary?.currency ?? booking.currency)} />
          <InfoRow label="Supplier Payment Status" value={booking.supplier_payment_summary?.payment_status.replace(/_/g, " ") ?? "pending"} />
          <InfoRow label="Supplier Payment Date" value={dateStr(booking.supplier_payment_summary?.payment_date)} />
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
          <InfoRow label="Name" value={leadName} />
          <InfoRow label="Email" value={leadEmail} />
          <InfoRow label="Phone" value={leadPhone} />
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

        {/* Supplier booking messages are private to Tourvaa Admin. */}
        <div className="flex h-[500px] flex-col overflow-hidden rounded-2xl border border-dash-border bg-white shadow-sm lg:col-span-2">
          <div className="flex items-start gap-2 border-b border-dash-border-soft px-5 py-4">
            <MessageSquare size={18} className="mt-0.5 text-emerald-600" />
            <div>
              <h2 className="font-black text-dash-text">Message Tourvaa Admin</h2>
              <p className="mt-0.5 text-xs text-dash-subtle">Private booking messages with the Tourvaa Admin team.</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-dash-bg/40 px-5 py-4">
          {chatMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-dash-border bg-white py-10 text-center">
              <MessageSquare size={28} className="text-dash-subtle" />
              <p className="mt-3 text-sm font-bold text-dash-text">No messages yet</p>
              <p className="mt-1 text-xs text-dash-muted">Messages sent to or received from Tourvaa Admin will appear here.</p>
            </div>
          ) : (
            messageGroups.map((group) => (
              <div key={group.date} className="space-y-2">
                <div className="sticky top-0 z-10 flex justify-center py-1"><span className="rounded-full border border-dash-border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-dash-muted shadow-sm">{group.date}</span></div>
                {group.messages.map((message) => {
                  const isSupplierMessage = message.sender_role === "supplier";
                  return <div key={message.id} className={`flex ${isSupplierMessage ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${isSupplierMessage ? "bg-emerald-600 text-white" : "bg-white text-dash-text"}`}>
                      <p className={`text-[10px] font-bold ${isSupplierMessage ? "text-emerald-100" : "text-dash-subtle"}`}>{isSupplierMessage ? "You" : "Tourvaa Admin"}</p>
                      <p className={`mt-1 whitespace-pre-wrap ${isSupplierMessage ? "text-sm" : "text-xs"}`}>{message.is_deleted ? "This message was deleted." : message.body}</p>
                      <p className={`mt-1 text-[10px] ${isSupplierMessage ? "text-emerald-100" : "text-dash-subtle"}`}>{message.created_at ? new Date(message.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : ""}</p>
                    </div>
                  </div>;
                })}
              </div>
            ))
          )}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-dash-border-soft bg-white px-4 py-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write a message to Tourvaa Admin..."
              className="flex-1 rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={sendingMessage || !newMessage.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {sendingMessage ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
              Send
            </button>
          </form>
        </div>
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



