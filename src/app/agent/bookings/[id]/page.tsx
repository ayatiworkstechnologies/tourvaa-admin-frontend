"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LuArrowLeft as ArrowLeft, LuCalendarCheck as CalendarCheck, LuClock as Clock, LuCreditCard as CreditCard, LuDownload as Download, LuFileText as FileText, LuLoaderCircle as Loader2, LuRefreshCw as RefreshCw, LuUser as User, LuCircleX as XCircle } from "react-icons/lu";
import api from "@/lib/api/client";
import { downloadInvoicePdf, invoiceActionError } from "@/lib/api/services/invoiceService";
import BookingPaymentModal from "@/components/bookings/BookingPaymentModal";
import { AgentPageHeader, AgentPageShell } from "@/components/agent/AgentPage";
import BookingMessageThread from "@/components/messaging/BookingMessageThread";
import { useCurrency } from "@/hooks/useCurrency";
import Loader from "@/components/ui/Loader";

type Traveller = {
  id: number;
  name?: string;
  full_name?: string;
  passport_number?: string;
  nationality?: string;
  age?: number;
  traveller_type?: string;
};

type Booking = {
  id: number;
  booking_code: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer?: { id: number; name?: string; email?: string; phone?: string };
  tour_name?: string;
  tour_date?: string | null;
  booking_status: string;
  payment_status: string;
  supplier_acceptance_status?: string;
  // Never sent to the agent portal (see services.bookings.serialize_booking's
  // hide_supplier_identity) - suppliers are a Tourvaa back-office
  // relationship. supplier_id is still sent, purely as an unrendered "has a
  // supplier been assigned" signal.
  supplier_id?: number | null;
  final_amount?: string | number;
  amount_paid?: string | number;
  amount_pending?: string | number;
  currency?: string;
  no_of_adults?: number;
  no_of_children?: number;
  total_travellers?: number;
  payment_type?: "partial" | "full";
  agent_payment_method?: string | null;
  agent_payment_summary?: {
    transaction_type: "Full Payment" | "Booking Reserved";
    is_reserved: boolean;
    amount_paid: string;
    total_booking_amount: string;
    commission_percentage: string;
    commission_amount: string;
    commission_payable: string;
    commission_status: string;
    commission_payment_date?: string | null;
    agent_price_after_commission: string;
    invoice_status: string;
    payment_due_date?: string | null;
  } | null;
  agent_reference?: string | null;
  agent_net_price?: string | number;
  agent_markup?: string | number;
  customer_selling_price?: string | number;
  notes?: string;
  customer_notes?: string;
  booking_source?: string;
  created_at?: string;
  travellers?: Traveller[];
  status_history?: Array<{ id: number; old_status?: string | null; new_status: string; change_source?: string; reason?: string | null; created_at?: string }>;
  price_breakdown?: {
    base_amount?: string | number;
    optional_activity_amount?: string | number;
    accommodation_amount?: string | number;
    extension_amount?: string | number;
    discount_amount?: string | number;
    tax_amount?: string | number;
    surcharge_amount?: string | number;
    final_amount?: string | number;
  };
  deposit_config?: {
    deposit_type: "fixed" | "percentage";
    deposit_percentage: number | null;
    booking_deposit: string | null;
    still_available: boolean;
  } | null;
  cancellation_eligibility?: { is_free_cancellation_eligible: boolean; refund_percentage: string };
};

type Invoice = {
  id: number;
  invoice_number?: string;
};

function dateText(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

// Match the lifecycle language shown in the Customer Portal. Internal
// payment and supplier-processing states are not Agent-facing stages.
function customerFacingBookingStatus(status?: string): string {
  const value = (status || "").toLowerCase();
  if (["draft", "pending_payment", "pending_credit_approval", "pending_supplier_assignment", "payment_authorized", "pending_supplier_acceptance", "supplier_reassignment_required"].includes(value)) return "Booking Request Received";
  if (["confirmed", "ready_to_travel", "upcoming", "postponed"].includes(value)) return "Booking Confirmed";
  if (value === "ongoing") return "Ongoing";
  if (value === "completed") return "Completed";
  if (["cancellation_requested", "cancelled", "declined", "refunded"].includes(value)) return "Cancelled";
  return "Booking Request Received";
}

const BOOKING_REQUEST_RECEIVED_MESSAGE = "Your booking request has been received successfully. We will review the details and be in touch shortly with your booking confirmation.";

function statusClass(status?: string) {
  const v = (status || "").toLowerCase();
  if (["paid", "completed", "confirmed", "active"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "partial", "partially_paid", "pending_payment", "pending_credit_approval", "bank_transfer_pending", "credit_approval_pending"].includes(v)) return "bg-amber-50 text-amber-700";
  if (["cancelled", "failed"].includes(v)) return "bg-rose-50 text-rose-700";
  return "bg-slate-50 text-slate-700";
}

function Pill({ status, children }: { status?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(status)}`}>
      {children}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dash-border py-3 last:border-b-0">
      <span className="text-sm text-dash-muted">{label}</span>
      <span className="text-sm font-bold text-dash-text">{value ?? "-"}</span>
    </div>
  );
}

export default function AgentBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatExact: format } = useCurrency();
  const money = (value: string | number | undefined, currency = "USD") =>
    value || value === 0 ? format(value, currency) : "-";
  const [booking, setBooking] = useState<Booking | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoiceError, setInvoiceError] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCancellationConfirm, setShowCancellationConfirm] = useState(false);
  const [showCancellationForm, setShowCancellationForm] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [paymentBanner, setPaymentBanner] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const returnHandled = useRef(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [bookingRes, invoiceRes] = await Promise.allSettled([
          api.get(`/bookings/${id}`),
          api.get(`/invoices`, { params: { booking_id: id } }),
        ]);
        if (!active) return;
        if (bookingRes.status === "fulfilled") {
          setBooking(bookingRes.value.data?.data ?? bookingRes.value.data ?? null);
        } else {
          setError("Booking not found.");
        }
        if (invoiceRes.status === "fulfilled") {
          const items = invoiceRes.value.data?.items ?? invoiceRes.value.data?.data ?? [];
          if (items.length > 0) setInvoice(items[0]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id, refreshKey]);

  useEffect(() => {
    if (!booking || searchParams.get("new") !== "1") return;
    const method = booking.agent_payment_method?.replaceAll("_", " ");
    setPaymentBanner({
      type: "success",
      message: method
        ? `Booking Request Received. ${BOOKING_REQUEST_RECEIVED_MESSAGE} Payment method: ${method}.`
        : `Booking Request Received. ${BOOKING_REQUEST_RECEIVED_MESSAGE}`,
    });
    router.replace(`/agent/bookings/${id}`, { scroll: false });
  }, [booking, id, router, searchParams]);

  useEffect(() => {
    if (!booking || searchParams.get("pay") !== "1") return;
    if (Number(booking.amount_pending ?? 0) > 0) {
      setPaymentBanner({ type: "info", message: `Booking Request Received. ${BOOKING_REQUEST_RECEIVED_MESSAGE}` });
      setShowPayment(true);
    } else {
      setPaymentBanner({ type: "success", message: "Booking created and payment is already complete." });
    }
    router.replace(`/agent/bookings/${id}`, { scroll: false });
  }, [booking, id, router, searchParams]);

  useEffect(() => {
    const paymentReturn = searchParams.get("payment");
    if (!paymentReturn || returnHandled.current) return;
    returnHandled.current = true;

    if (paymentReturn === "cancelled") {
      setPaymentBanner({ type: "info", message: "Payment Required\nYour booking is not yet confirmed. Please complete your payment or reserve now to secure your booking." });
      const stripeKey = `stripe_pid_${id}`;
      const paypalKey = `paypal_pid_${id}`;
      const paymentId = sessionStorage.getItem(stripeKey) || sessionStorage.getItem(paypalKey);
      void api.post("/payments/abandon-pending", {
        booking_id: Number(id),
        payment_id: paymentId ? Number(paymentId) : undefined,
      }).finally(() => {
        sessionStorage.removeItem(stripeKey);
        sessionStorage.removeItem(paypalKey);
        setRefreshKey((value) => value + 1);
      });
      router.replace(`/agent/bookings/${id}`, { scroll: false });
      return;
    }

    async function confirmGatewayReturn() {
      try {
        if (paymentReturn === "stripe_success") {
          await api.post("/payments/stripe/confirm-return", {
            booking_id: Number(id),
            session_id: searchParams.get("session_id") || undefined,
          });
        } else if (paymentReturn === "paypal_approved") {
          const orderId = searchParams.get("token");
          const paymentId = sessionStorage.getItem(`paypal_pid_${id}`);
          if (!orderId || !paymentId) throw new Error("PayPal return details are missing.");
          await api.post("/payments/paypal/capture", { order_id: orderId, payment_id: Number(paymentId) });
          sessionStorage.removeItem(`paypal_pid_${id}`);
        } else {
          return;
        }
        setPaymentBanner({ type: "success", message: `Booking Request Received. ${BOOKING_REQUEST_RECEIVED_MESSAGE}` });
        setRefreshKey((value) => value + 1);
      } catch {
        setPaymentBanner({ type: "error", message: "Payment return could not be confirmed. Please retry or contact support before paying again." });
      } finally {
        router.replace(`/agent/bookings/${id}`, { scroll: false });
      }
    }

    void confirmGatewayReturn();
  }, [id, router, searchParams]);

  async function handleDownloadInvoice() {
    if (!invoice) return;
    setInvoiceError("");
    setDownloadLoading(true);
    try {
      await downloadInvoicePdf(invoice.id, `${invoice.invoice_number ?? `invoice-${invoice.id}`}.pdf`);
    } catch (error) {
      setInvoiceError(invoiceActionError(error, "Invoice could not be downloaded."));
    } finally {
      setDownloadLoading(false);
    }
  }

  async function submitCancellation(event: React.FormEvent) {
    event.preventDefault();
    if (!cancellationReason.trim()) return;
    setCancelling(true);
    try {
      await api.post(`/bookings/${id}/cancel-request`, { reason: cancellationReason.trim() });
      setShowCancellationForm(false);
      setCancellationReason("");
      setPaymentBanner({ type: "success", message: "Cancellation request submitted. Tourvaa will review it shortly." });
      setRefreshKey((value) => value + 1);
    } catch (exception: unknown) {
      const detail = (exception as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setPaymentBanner({ type: "error", message: typeof detail === "string" ? detail : "Cancellation request could not be submitted. Please contact Tourvaa Support for assistance." });
    } finally {
      setCancelling(false);
    }
  }

  async function removeUnpaidBooking() {
    setRemoving(true);
    try {
      await api.post(`/bookings/${id}/hide-from-agent`);
      router.replace("/agent/bookings");
    } catch (exception: unknown) {
      const detail = (exception as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setPaymentBanner({ type: "error", message: typeof detail === "string" ? detail : "This booking could not be removed from My Bookings." });
      setRemoving(false);
    }
  }

  if (loading) {
    return (
      <AgentPageShell className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-dash-muted">
          <Loader label="Loading booking..." />
        </div>
      </AgentPageShell>
    );
  }

  if (error || !booking) {
    return (
      <AgentPageShell>
        <Link href="/agent/bookings" className="flex items-center gap-2 text-sm font-bold text-dash-muted hover:text-dash-brand">
          <ArrowLeft size={15} /> Back to Bookings
        </Link>
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50 py-16 text-center">
          <p className="font-bold text-rose-700">{error || "Booking not found."}</p>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-rose-700 shadow-sm ring-1 ring-rose-200 hover:bg-rose-100"><RefreshCw size={14} />Retry</button>
        </div>
      </AgentPageShell>
    );
  }

  const travellers = booking.travellers ?? [];
  const bookingDisplayStatus = customerFacingBookingStatus(booking.booking_status);
  const isBookingRequestReceived = bookingDisplayStatus === "Booking Request Received";
  const canRequestCancellation = Number(booking.amount_paid ?? 0) > 0 && !["cancelled", "completed", "refunded", "declined", "cancellation_requested"].includes(booking.booking_status);
  const canRemoveUnpaidBooking = Number(booking.amount_paid ?? 0) <= 0
    && booking.booking_status === "pending_payment"
    && ["unpaid", "pending", "failed"].includes(booking.payment_status);
  const freeCancellationEligible = booking.cancellation_eligibility?.is_free_cancellation_eligible === true;

  return (
    <AgentPageShell>
      <AgentPageHeader
        title={booking.booking_code}
        description={`${booking.tour_name || "Tour booking"} for ${booking.customer_name || booking.customer?.name || "your customer"}.`}
        icon={FileText}
        eyebrow="Booking Details"
        actions={[{ label: "Back to Bookings", href: "/agent/bookings", icon: ArrowLeft, variant: "secondary" }]}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Pill status={booking.booking_status}>{bookingDisplayStatus}</Pill>
          </div>
          <div className="flex flex-wrap gap-2">
            {Number(booking.amount_pending ?? 0) > 0 && (
              <button type="button" onClick={() => setShowPayment(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1D4ED8]">
                <CreditCard size={15} /> Pay Now
              </button>
            )}
            {invoice && (
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={downloadLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D7E2F2] bg-white px-4 py-2.5 text-sm font-bold text-[#274A7A] shadow-sm transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-70"
              >
                {downloadLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Download Invoice
              </button>
            )}
            {canRequestCancellation && (
              <button type="button" onClick={() => freeCancellationEligible && setShowCancellationConfirm(true)} disabled={!freeCancellationEligible}
                title={!freeCancellationEligible ? "Self-service cancellation is available only during the free-cancellation period." : undefined}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400">
                <XCircle size={15} /> Request Cancellation
              </button>
            )}
            {canRemoveUnpaidBooking && (
              <button type="button" onClick={removeUnpaidBooking} disabled={removing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60">
                {removing ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Remove from Bookings
              </button>
            )}
          </div>
        </div>
      </AgentPageHeader>

      {invoiceError && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{invoiceError}</div>}
      {paymentBanner && (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${paymentBanner.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : paymentBanner.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
          {paymentBanner.message.split("\n").map((line, index) => <p key={line} className={index === 0 ? "font-bold" : "mt-1 leading-6"}>{line}</p>)}
        </div>
      )}
      {isBookingRequestReceived && !paymentBanner && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="font-bold">Booking Request Received</p>
          <p className="mt-1 leading-6">{BOOKING_REQUEST_RECEIVED_MESSAGE}</p>
        </div>
      )}
      {canRequestCancellation && !freeCancellationEligible && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">The free-cancellation period has ended. Please contact Tourvaa Support for cancellation assistance or a travel-date change.</div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Booking Info */}
        <div className="order-1 rounded-xl border border-dash-border bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-black text-dash-text">
            <CalendarCheck size={18} className="text-blue-600" /> Booking Information
          </h2>
          <div className="mt-4">
            <InfoRow label="Booking Code" value={booking.booking_code} />
            <InfoRow label="Agent Reference" value={booking.agent_reference} />
            <InfoRow label="Tour" value={booking.tour_name} />
            <InfoRow label="Travel Date" value={dateText(booking.tour_date)} />
            <InfoRow label="Adults" value={booking.no_of_adults} />
            <InfoRow label="Children" value={booking.no_of_children ?? 0} />
            <InfoRow label="Total Travellers" value={booking.total_travellers ?? ((booking.no_of_adults ?? 0) + (booking.no_of_children ?? 0))} />
            <InfoRow label="Booking Status" value={bookingDisplayStatus} />
            <InfoRow label="Source" value={booking.booking_source?.replaceAll("_", " ") ?? "-"} />
            <InfoRow label="Created" value={dateText(booking.created_at)} />
            {(booking.customer_notes || booking.notes) && <InfoRow label="Notes" value={booking.customer_notes ?? booking.notes} />}
          </div>
        </div>

        {/* Customer & Payment Info */}
        <div className="contents">
          <div className="order-3 rounded-xl border border-dash-border bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-black text-dash-text"><User size={18} className="text-blue-600" /> Customer</h2>
            <div className="mt-4">
              <InfoRow label="Name" value={booking.customer_name ?? booking.customer?.name} />
              <InfoRow label="Email" value={booking.customer_email ?? booking.customer?.email} />
              <InfoRow label="Phone" value={booking.customer_phone ?? booking.customer?.phone} />
            </div>
          </div>

          {booking.agent_payment_summary && <div className="order-2 rounded-xl border border-dash-border bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-black text-dash-text"><CreditCard size={18} className="text-blue-600" /> Agent Payments</h2>
            <div className="mt-4">
              <InfoRow label="Agent Transaction Type" value={booking.agent_payment_summary.transaction_type} />
              {booking.agent_payment_summary.is_reserved ? <>
                <InfoRow label="Total Booking Amount" value={money(booking.agent_payment_summary.total_booking_amount, booking.currency)} />
                <InfoRow label="Approved Agent Commission" value={`${booking.agent_payment_summary.commission_percentage}%`} />
                <InfoRow label="Agent Price After Commission" value={money(booking.agent_payment_summary.agent_price_after_commission, booking.currency)} />
                <InfoRow label="Agent Commission Amount" value={money(booking.agent_payment_summary.commission_amount, booking.currency)} />
                <InfoRow label="Invoice Status" value={<Pill status={booking.agent_payment_summary.invoice_status}>{booking.agent_payment_summary.invoice_status.replaceAll("_", " ")}</Pill>} />
                <InfoRow label="Payment Due Date" value={dateText(booking.agent_payment_summary.payment_due_date)} />
                <InfoRow label="Amount Paid by Agent" value={money(booking.agent_payment_summary.amount_paid, booking.currency)} />
              </> : <>
                <InfoRow label="Total Booking Amount" value={money(booking.agent_payment_summary.total_booking_amount, booking.currency)} />
                <InfoRow label="Amount Paid by Agent" value={money(booking.agent_payment_summary.amount_paid, booking.currency)} />
                <InfoRow label="Approved Agent Commission" value={`${booking.agent_payment_summary.commission_percentage}%`} />
                <InfoRow label="Agent Price After Commission" value={money(booking.agent_payment_summary.agent_price_after_commission, booking.currency)} />
                <InfoRow label="Agent Commission Amount" value={money(booking.agent_payment_summary.commission_amount, booking.currency)} />
                <InfoRow label="Commission Payable to Agent" value={money(booking.agent_payment_summary.commission_payable, booking.currency)} />
                <InfoRow label="Commission Status" value={<Pill status={booking.agent_payment_summary.commission_status}>{booking.agent_payment_summary.commission_status.replaceAll("_", " ")}</Pill>} />
                <InfoRow label="Commission Payment Date" value={dateText(booking.agent_payment_summary.commission_payment_date)} />
              </>}
            </div>
          </div>}

        </div>

      {/* Message Tourvaa support about this booking */}
      {booking.supplier_id && (
        <div className="order-6 lg:col-span-2">
          <BookingMessageThread bookingId={booking.id} compact />
        </div>
      )}

      {/* Travellers */}
      {travellers.length > 0 && (
        <div className="order-5 rounded-xl border border-dash-border bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-base font-black text-dash-text"><User size={18} className="text-blue-600" /> Travellers ({travellers.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {travellers.map((traveller, index) => (
              <div key={traveller.id ?? index} className="rounded-xl border border-dash-border p-3">
                <p className="font-semibold text-dash-text">{traveller.name ?? traveller.full_name ?? `Traveller ${index + 1}`}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-dash-muted">
                  <span className="capitalize">Type: {traveller.traveller_type ?? "adult"}</span>
                  {traveller.age != null && <span>Age: {traveller.age}</span>}
                  {traveller.nationality && <span>Nationality: {traveller.nationality}</span>}
                  {traveller.passport_number && <span>Passport: {traveller.passport_number}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {booking.status_history && booking.status_history.length > 0 && (
        <div className="order-4 rounded-xl border border-dash-border bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-black text-dash-text"><Clock size={18} className="text-blue-600" /> Status Timeline</h2>
          <div className="mt-4 space-y-3">
            {[...booking.status_history].reverse().map((entry) => (
              <div key={entry.id} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500 ring-4 ring-indigo-100" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black capitalize text-dash-text">{entry.new_status.replaceAll("_", " ")}</p>
                    <p className="text-xs text-dash-muted">{dateText(entry.created_at)}</p>
                  </div>
                  <p className="mt-1 text-xs capitalize text-dash-muted">Updated by {entry.change_source?.replaceAll("_", " ") || "system"}{entry.reason ? ` · ${entry.reason}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

      {showCancellationConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="agent-cancel-confirm-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 id="agent-cancel-confirm-title" className="text-lg font-black text-dash-text">Confirm cancellation request</h3>
            <p className="mt-3 text-sm leading-6 text-dash-muted">In accordance with the cancellation policy for this tour, you are eligible for a full refund, less any applicable transaction fees. Do you want to continue with the cancellation?</p>
            <p className="mt-3 text-xs font-medium text-dash-muted">For a travel-date change, please contact Tourvaa Support.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCancellationConfirm(false)} className="rounded-xl border border-dash-border bg-white px-4 py-2 text-sm font-bold text-dash-body hover:bg-dash-bg">No</button>
              <button type="button" onClick={() => { setShowCancellationConfirm(false); setShowCancellationForm(true); }} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700">Yes, continue</button>
            </div>
          </div>
        </div>
      )}

      {showCancellationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="agent-cancel-reason-title">
          <form onSubmit={submitCancellation} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 id="agent-cancel-reason-title" className="text-lg font-black text-dash-text">Request cancellation</h3>
            <textarea required value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} rows={4} placeholder="Please explain why you want to cancel this booking..." className="mt-4 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400" />
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowCancellationForm(false); setCancellationReason(""); }} className="rounded-xl border border-dash-border bg-white px-4 py-2 text-sm font-bold text-dash-body hover:bg-dash-bg">Cancel</button>
              <button type="submit" disabled={cancelling || !cancellationReason.trim()} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60">{cancelling && <Loader2 size={14} className="animate-spin" />} Submit Request</button>
            </div>
          </form>
        </div>
      )}

      {showPayment && Number(booking.amount_pending ?? 0) > 0 && (
        <BookingPaymentModal
          bookingId={booking.id}
          outstandingAmount={Number(booking.amount_pending ?? 0)}
          totalAmount={Number(booking.final_amount ?? 0)}
          amountPaid={Number(booking.amount_paid ?? 0)}
          preferredPaymentType={booking.payment_type}
          depositConfig={booking.deposit_config}
          allowPartialPayment={false}
          currency={booking.currency || "USD"}
          returnPath={`/agent/bookings/${booking.id}`}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setPaymentBanner({ type: "success", message: `Booking Request Received. ${BOOKING_REQUEST_RECEIVED_MESSAGE}` });
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
    </AgentPageShell>
  );
}
