"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LuCircleAlert as AlertCircle, LuArrowLeft as ArrowLeft, LuCalendarCheck as CalendarCheck, LuCircleCheckBig as CheckCircle2, LuClock as Clock, LuCreditCard as CreditCard, LuReceiptText as FileText, LuHistory as History, LuLoaderCircle as Loader2, LuMapPinned as MapPinned, LuReceipt as Receipt, LuStar as Star, LuUsers as Users, LuX as X, LuCircleX as XCircle } from "react-icons/lu";
import axios from "axios";
import api from "@/lib/api/client";
import { CustomerPageShell } from "@/components/customer/CustomerPage";
import BookingMessageThread from "@/components/messaging/BookingMessageThread";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/lib/utils/currency";

type Traveller = {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  traveller_type: string;
  age?: number;
  is_primary_contact?: boolean;
  special_requirements?: string;
};

type StatusHistory = {
  id: number;
  old_status?: string;
  new_status: string;
  reason?: string;
  created_at?: string;
};

type Booking = {
  id: number;
  booking_code: string;
  tour_name?: string;
  tour_date?: string;
  country?: string;
  supplier_name?: string;
  booking_status: string;
  supplier_acceptance_status?: string;
  payment_status?: string;
  payment_type?: "partial" | "full";
  final_amount?: string | number;
  amount_paid?: string | number;
  amount_pending?: string | number;
  balance_due_date?: string | null;
  deposit_config?: {
    deposit_type: "fixed" | "percentage";
    deposit_percentage?: number | null;
    booking_deposit?: string | null;
    deposit_cutoff_days?: number | null;
    balance_payment_deadline_days?: number | null;
    still_available: boolean;
  } | null;
  currency?: string;
  no_of_adults?: number;
  no_of_children?: number;
  no_of_infants?: number;
  no_of_rooms?: number;
  total_travellers?: number;
  notes?: string;
  customer_notes?: string;
  created_at?: string;
  travellers?: Traveller[];
  status_history?: StatusHistory[];
};

function StatusIcon({ status }: { status: string }) {
  const v = (status || "").toLowerCase();
  if (["confirmed", "completed", "paid"].includes(v)) return <CheckCircle2 size={14} className="text-emerald-600" />;
  if (["cancelled", "declined", "failed"].includes(v)) return <XCircle size={14} className="text-red-500" />;
  return <Clock size={14} className="text-amber-500" />;
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-semibold text-slate-800">{value || "-"}</p>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  iconColor = "text-[#0B1527]",
  iconBg = "bg-slate-100",
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
  iconBg?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-center gap-2.5">
        {Icon && (
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon size={15} className={iconColor} />
          </div>
        )}
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1527]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

type GatewayStatus = { stripe: boolean; paypal: boolean; test_mode_available: boolean } | null;

function PayNowModal({
  bookingId,
  amount,
  totalAmount,
  amountPaid,
  preferredPaymentType,
  currency,
  depositConfig,
  onClose,
  onSuccess,
}: {
  bookingId: number;
  amount: number;
  totalAmount: number;
  amountPaid: number;
  preferredPaymentType?: "partial" | "full";
  currency: string;
  depositConfig?: Booking["deposit_config"];
  onClose: () => void;
  onSuccess: () => void;
}) {
  // The deposit option only makes sense before any payment has been made -
  // once a deposit is already on the booking, this modal is collecting the
  // remaining balance in full, not splitting it further.
  const depositDue = (() => {
    if (amountPaid > 0 || !depositConfig?.still_available) return 0;
    const raw = depositConfig.deposit_type === "percentage"
      ? depositConfig.deposit_percentage ? totalAmount * (depositConfig.deposit_percentage / 100) : 0
      : Number(depositConfig.booking_deposit || 0);
    return Math.min(amount, Math.max(0, Math.round(raw * 100) / 100));
  })();
  const partialAvailable = depositDue > 0 && depositDue < amount;
  const [loading, setLoading] = useState<"stripe" | "paypal" | "test" | null>(null);
  const [err, setErr] = useState("");
  const [gw, setGw] = useState<GatewayStatus>(null);
  const [gwLoading, setGwLoading] = useState(true);
  const [paymentType, setPaymentType] = useState<"partial" | "full">(
    preferredPaymentType === "partial" && partialAvailable ? "partial" : "full",
  );
  const paymentAmount = paymentType === "partial" ? depositDue : amount;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    api.get("/payments/gateways/status")
      .then(r => setGw(r.data?.data ?? { stripe: false, paypal: false, test_mode_available: false }))
      .catch(() => setGw({ stripe: false, paypal: false, test_mode_available: true }))
      .finally(() => setGwLoading(false));
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function payWithStripe() {
    setLoading("stripe"); setErr("");
    try {
      const origin = window.location.origin;
      const res = await api.post("/payments/stripe/create-session", {
        booking_id: bookingId, amount: paymentAmount, currency: currency || "USD",
        success_url: `${origin}/customer/bookings/${bookingId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/customer/bookings/${bookingId}?payment=cancelled`,
      });
      const { checkout_url } = res.data?.data ?? {};
      if (!checkout_url) throw new Error("No checkout URL returned");
      window.location.href = checkout_url;
    } catch (e: unknown) {
      setErr(axios.isAxiosError(e) ? (e.response?.data?.detail || e.response?.data?.message || "Could not start Stripe payment.") : "Could not start Stripe payment.");
      setLoading(null);
    }
  }

  async function payWithPayPal() {
    setLoading("paypal"); setErr("");
    try {
      const origin = window.location.origin;
      const res = await api.post("/payments/paypal/create-order", {
        booking_id: bookingId, amount: paymentAmount, currency: currency || "USD",
        return_url: `${origin}/customer/bookings/${bookingId}?payment=paypal_approved`,
        cancel_url: `${origin}/customer/bookings/${bookingId}?payment=cancelled`,
      });
      const { approve_url, payment_id } = res.data?.data ?? {};
      if (!approve_url) throw new Error("No PayPal approval URL returned");
      sessionStorage.setItem(`paypal_pid_${bookingId}`, String(payment_id));
      window.location.href = approve_url;
    } catch (e: unknown) {
      setErr(axios.isAxiosError(e) ? (e.response?.data?.detail || e.response?.data?.message || "Could not start PayPal payment.") : "Could not start PayPal payment.");
      setLoading(null);
    }
  }

  async function payWithTest() {
    setLoading("test"); setErr("");
    try {
      await api.post("/payments/test/simulate", { booking_id: bookingId, amount: paymentAmount, note: `${paymentType} test payment from UI` });
      onClose();
      onSuccess();
    } catch (e: unknown) {
      setErr(axios.isAxiosError(e) ? (e.response?.data?.detail || "Test payment failed.") : "Test payment failed.");
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Choose your payment">
      <div className="w-full max-w-md rounded-3xl border border-dash-border bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-dash-text">Choose your payment</h3>
            <p className="text-sm text-dash-muted">
              Booking balance: <strong className="text-dash-text">{formatCurrency(amount, currency)}</strong>
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} disabled={!!loading} aria-label="Close payment modal"
            className="rounded-xl p-1.5 text-dash-muted hover:bg-dash-bg hover:text-dash-text">
            <X size={18} />
          </button>
        </div>

        {err && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {err}
          </div>
        )}

        {partialAvailable && (
          <div className="mb-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Payment amount">
            {([
              {
                value: "partial" as const,
                label: depositConfig?.deposit_type === "percentage" && depositConfig.deposit_percentage
                  ? `Pay ${depositConfig.deposit_percentage}% deposit`
                  : "Pay deposit",
                amount: depositDue,
                note: "Balance later",
              },
              { value: "full" as const, label: "Pay in full", amount, note: "No balance" },
            ]).map((option) => {
              const selected = paymentType === option.value;
              return (
                <button key={option.value} type="button" role="radio" aria-checked={selected} onClick={() => setPaymentType(option.value)} disabled={!!loading}
                  className={`rounded-2xl border-2 p-3 text-left transition disabled:opacity-60 ${selected ? "border-emerald-600 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-200"}`}>
                  <span className="block text-xs font-black text-dash-text">{option.label}</span>
                  <span className="mt-1 block text-lg font-black text-emerald-700">{formatCurrency(option.amount, currency)}</span>
                  <span className="mt-0.5 block text-[11px] text-dash-subtle">{option.note}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-white">
          <span className="text-xs font-bold">Pay securely now</span>
          <span className="text-lg font-black">{formatCurrency(paymentAmount, currency)}</span>
        </div>

        {gwLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={20} className="animate-spin text-dash-subtle" />
          </div>
        ) : (
        <div className="space-y-3">
          {/* Stripe */}
          <button type="button" onClick={payWithStripe} disabled={!!loading || !gw?.stripe}
            title={!gw?.stripe ? "Stripe is not configured" : undefined}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#635BFF] bg-[#635BFF] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#4f49cc] disabled:cursor-not-allowed disabled:opacity-40 transition-colors">
            {loading === "stripe" ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
            Pay {formatCurrency(paymentAmount, currency)} with Stripe
            {!gw?.stripe && <span className="ml-auto text-[10px] font-bold opacity-70">Not configured</span>}
          </button>

          {/* PayPal */}
          <button type="button" onClick={payWithPayPal} disabled={!!loading || !gw?.paypal}
            title={!gw?.paypal ? "PayPal is not configured" : undefined}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#003087] bg-[#0070BA] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#003087] disabled:cursor-not-allowed disabled:opacity-40 transition-colors">
            {loading === "paypal" ? <Loader2 size={18} className="animate-spin" /> : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.825l-1.073 6.815h3.267c.524 0 .968-.382 1.05-.9l.983-6.228c.082-.518.526-.9 1.05-.9h1.876c4.298 0 7.664-1.747 8.647-6.797.237-1.218.17-2.227-.403-2.985z"/></svg>
            )}
            Pay {formatCurrency(paymentAmount, currency)} with PayPal
            {!gw?.paypal && <span className="ml-auto text-[10px] font-bold opacity-70">Not configured</span>}
          </button>

          {/* Test mode */}
          {false && gw?.test_mode_available && (
            <>
              <div className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-amber-200" />
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-700">
                  Test Mode
                </span>
                <div className="h-px flex-1 bg-amber-200" />
              </div>
              <button type="button" onClick={payWithTest} disabled={!!loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 px-5 py-3.5 text-sm font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-60 transition-colors">
                {loading === "test" ? <Loader2 size={18} className="animate-spin" /> : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
                  </svg>
                )}
                Simulate {formatCurrency(paymentAmount, currency)} Payment
              </button>
            </>
          )}
        </div>
        )}

        <p className="mt-4 text-center text-xs text-dash-subtle">
          {gw?.test_mode_available
            ? "Test mode active - no real money will be charged."
            : "Payment is secured and your booking remains pending until the supplier accepts it."}
        </p>
      </div>
    </div>
  );
}

// Main Page
export default function CustomerBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { format } = useCurrency();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentBanner, setPaymentBanner] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
  const [capturingPayPal, setCapturingPayPal] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/customer/bookings/${params.id}`);
      setBooking(res.data?.data ?? res.data);
    } catch {
      setError("Could not load booking details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setPaymentBanner({
        type: "info",
        msg: "Booking request created. Complete payment to place the amount on hold while the supplier reviews your request.",
      });
    }
    if (searchParams.get("pay") === "1") setShowPayModal(true);
  }, [searchParams]);

  // Handle Stripe / PayPal return from redirect
  useEffect(() => {
    const payment = searchParams.get("payment");
    const token = searchParams.get("token"); // PayPal order ID on return

    if (payment === "success") {
      const sessionId = searchParams.get("session_id");
      setPaymentBanner({ type: "info", msg: "Confirming payment..." });
      api.post("/payments/stripe/confirm-return", {
        booking_id: Number(params.id),
        session_id: sessionId || undefined,
      })
        .then(() => {
          setPaymentBanner({ type: "success", msg: "Payment received. Final confirmation is pending supplier acceptance." });
          void load();
        })
        .catch(() => {
          setPaymentBanner({ type: "error", msg: "Payment succeeded, but booking update is still pending. Please refresh or contact support." });
          void load();
        });
    } else if (payment === "cancelled") {
      setPaymentBanner({ type: "info", msg: "Payment was cancelled. You can try again when ready." });
    } else if (payment === "paypal_approved" && token) {
      // Capture the PayPal order
      const pidKey = `paypal_pid_${params.id}`;
      const savedPid = sessionStorage.getItem(pidKey);
      if (savedPid) {
        setCapturingPayPal(true);
        api.post("/payments/paypal/capture", { order_id: token, payment_id: parseInt(savedPid) })
          .then(() => {
            sessionStorage.removeItem(pidKey);
            setPaymentBanner({ type: "success", msg: "PayPal payment received. Final confirmation is pending supplier acceptance." });
            void load();
          })
          .catch(() => {
            setPaymentBanner({ type: "error", msg: "PayPal capture failed. Please contact support." });
          })
          .finally(() => setCapturingPayPal(false));
      } else {
        setPaymentBanner({ type: "info", msg: "PayPal approved - processing payment..." });
      }
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      await api.post(`/customer/bookings/${params.id}/cancel`, { reason: cancelReason });
      setCancelSuccess(true);
      setShowCancel(false);
      await load();
    } catch {
      setError("Failed to submit cancellation request.");
    } finally {
      setCancelling(false);
    }
  }

  const canCancel = booking && !["cancelled", "completed", "refunded", "declined", "cancellation_requested"].includes(booking.booking_status);
  const pendingAmount = Number(booking?.amount_pending ?? 0);
  const canPay = booking && pendingAmount > 0 && !["cancelled", "declined", "completed", "cancellation_requested", "postponed"].includes(booking.booking_status);
  const canReview = booking && booking.booking_status === "completed" && !reviewSubmitted;

  useEffect(() => {
    if (searchParams.get("action") === "pay" && canPay) setShowPayModal(true);
  }, [canPay, searchParams]);

  async function handleReviewSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!booking) return;
    setReviewSubmitting(true);
    setReviewError("");
    try {
      await api.post("/customer/reviews", { booking_id: booking.id, rating: reviewRating, review_text: reviewText.trim() || undefined });
      setReviewSubmitted(true);
      setShowReview(false);
    } catch (exception) {
      setReviewError(axios.isAxiosError(exception) ? exception.response?.data?.detail || "Could not submit your review." : "Could not submit your review.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  return (
    <CustomerPageShell>
      <button type="button" onClick={() => router.push("/customer/bookings")}
        className="mb-4 flex items-center gap-1.5 rounded-xl border border-[#D5E1EF] bg-white px-3 py-2 text-sm font-bold text-[#315174] hover:border-blue-300 hover:text-[#0865D9] transition-all">
        <ArrowLeft size={16} /> Back to bookings
      </button>

      {/* Payment status banner */}
      {paymentBanner && (
        <div className={`mb-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
          paymentBanner.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
          paymentBanner.type === "error" ? "border-red-200 bg-red-50 text-red-600" :
          "border-blue-200 bg-blue-50 text-blue-700"
        }`}>
          {paymentBanner.type === "success" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> :
           paymentBanner.type === "error" ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> :
           <Clock size={16} className="mt-0.5 shrink-0" />}
          {paymentBanner.msg}
          <button type="button" onClick={() => setPaymentBanner(null)} className="ml-auto shrink-0" aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {capturingPayPal && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Loader2 size={16} className="animate-spin" /> Capturing PayPal payment...
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-dash-brand" size={32} />
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {cancelSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={16} />
          Cancellation request submitted. Our team will review it shortly.
        </div>
      )}

      {!loading && booking && (
        <>
          {/* Booking header */}
          <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)] md:p-7">
            <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  BOOKING CODE: <span className="font-mono text-[#1B64F2]">#{booking.booking_code.replace(/^#/, "")}</span>
                </p>
                <h2 className="mt-1 text-xl font-black leading-tight text-[#0B1527] md:text-2xl">
                  {booking.tour_name || "Tour Booking"}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                    <StatusIcon status={booking.booking_status} />
                    {booking.booking_status.replaceAll("_", " ")}
                  </span>
                  {booking.payment_status && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                      {booking.payment_status.replaceAll("_", " ")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {canPay && (
                  <button
                    type="button"
                    onClick={() => setShowPayModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-[#0B1527] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#15233C] transition"
                  >
                    <CreditCard size={15} />
                    Pay Now ({format(pendingAmount, booking.currency)})
                  </button>
                )}
                {canCancel && !showCancel && (
                  <button
                    type="button"
                    onClick={() => setShowCancel(true)}
                    className="flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                  >
                    <XCircle size={15} /> Request Cancellation
                  </button>
                )}
                {canReview && !showReview && (
                  <button
                    type="button"
                    onClick={() => setShowReview(true)}
                    className="flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50 transition"
                  >
                    <Star size={15} /> Submit Review
                  </button>
                )}
              </div>
            </div>
          </div>

          {reviewSubmitted && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={16} />
              Thanks for your review - it will appear on the tour page once approved.
            </div>
          )}

          {/* Review form */}
          {showReview && (
            <form onSubmit={handleReviewSubmit} className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="mb-3 font-bold text-amber-800">Rate your trip</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button key={value} type="button" onClick={() => setReviewRating(value)} aria-label={`${value} star${value === 1 ? "" : "s"}`}>
                    <Star size={26} className={value <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                  </button>
                ))}
              </div>
              <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell other travellers about your experience (optional)..."
                rows={3} className="mt-3 w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400" />
              {reviewError && <p className="mt-2 text-xs font-semibold text-red-600">{reviewError}</p>}
              <div className="mt-3 flex gap-3">
                <button type="submit" disabled={reviewSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-60">
                  {reviewSubmitting ? <Loader2 className="animate-spin" size={14} /> : null}
                  Submit Review
                </button>
                <button type="button" onClick={() => setShowReview(false)}
                  className="rounded-xl border border-dash-border bg-white px-4 py-2 text-sm font-bold text-dash-body hover:bg-[#F3F8FC]">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {booking.supplier_acceptance_status === "pending" && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
              <Clock size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Pending supplier acceptance</p>
                <p className="mt-1 text-sm">Your request is received, but it is not a final booking confirmation yet. We will notify you when the supplier responds.</p>
              </div>
            </div>
          )}

          {/* Cancel form */}
          {showCancel && (
            <form onSubmit={handleCancel} className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="mb-3 font-bold text-red-700">Request Cancellation</p>
              <textarea required value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please explain why you want to cancel this booking..."
                rows={3} className="w-full resize-none rounded-xl border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400" />
              <div className="mt-3 flex gap-3">
                <button type="submit" disabled={cancelling}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                  {cancelling ? <Loader2 className="animate-spin" size={14} /> : null}
                  Submit Request
                </button>
                <button type="button" onClick={() => { setShowCancel(false); setCancelReason(""); }}
                  className="rounded-xl border border-dash-border bg-white px-4 py-2 text-sm font-bold text-dash-body hover:bg-[#F3F8FC]">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Detail panels */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Tour Info" icon={MapPinned}>
              <div className="space-y-3">
                <Field label="Tour" value={<span className="flex items-center gap-1"><MapPinned size={14} className="text-dash-brand" />{booking.tour_name}</span>} />
                <Field label="Travel Date" value={<span className="flex items-center gap-1"><CalendarCheck size={14} className="text-dash-brand" />{booking.tour_date || "-"}</span>} />
                <Field label="Country" value={booking.country} />
                <Field label="Supplier" value={booking.supplier_name} />
                <a href={`/api/customer/bookings/${booking.id}/itinerary`} className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dash-border px-3 py-2 text-xs font-bold text-dash-body hover:bg-[#F3F8FC]">
                  <FileText size={13} /> Download Itinerary
                </a>
              </div>
            </Panel>

            <Panel title="Travellers" icon={Users}>
              <div className="space-y-3">
                <Field label="Adults" value={booking.no_of_adults ?? "-"} />
                <Field label="Children" value={booking.no_of_children ?? 0} />
                <Field label="Infants" value={booking.no_of_infants ?? 0} />
                {booking.no_of_rooms != null && <Field label="Rooms" value={booking.no_of_rooms} />}
                <Field label="Total" value={<span className="flex items-center gap-1"><Users size={14} className="text-dash-brand" />{booking.total_travellers ?? "-"}</span>} />
              </div>
            </Panel>

            <Panel title="Payment" icon={Receipt} iconColor="text-emerald-600" iconBg="bg-emerald-50">
              <div className="space-y-3">
                <Field label="Total Amount" value={format(booking.final_amount, booking.currency)} />
                <Field label="Amount Paid" value={<span className="text-emerald-700">{format(booking.amount_paid, booking.currency)}</span>} />
                <Field label="Amount Pending" value={
                  <span className={pendingAmount > 0 ? "text-red-600 font-bold" : "text-emerald-700"}>
                    {format(booking.amount_pending, booking.currency)}
                  </span>
                } />
                {pendingAmount > 0 && booking.balance_due_date && (
                  <Field label="Balance Due By" value={
                    <span className="text-amber-600">{new Date(booking.balance_due_date).toLocaleDateString()}</span>
                  } />
                )}
                <Field label="Payment Status" value={booking.payment_status?.replaceAll("_", " ")} />
                {canPay && (
                  <button type="button" onClick={() => setShowPayModal(true)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors">
                    <CreditCard size={13} /> Pay Now
                  </button>
                )}
              </div>
            </Panel>
          </div>

          {/* Message the supplier */}
          {booking.supplier_name && (
            <div className="mt-4">
              <BookingMessageThread bookingId={booking.id} />
            </div>
          )}

          {/* Traveller list */}
          {booking.travellers && booking.travellers.length > 0 && (
            <div className="mt-4">
              <Panel title="Traveller Details" icon={Users}>
                <div className="space-y-3">
                  {booking.travellers.map((t) => (
                    <div key={t.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-dash-border px-4 py-3">
                      <div>
                        <p className="font-semibold text-dash-text">
                          {t.full_name || `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() || "-"}
                          {t.is_primary_contact && <span className="ml-2 rounded-full bg-[var(--portal-soft)] px-2 py-0.5 text-[10px] font-bold text-dash-brand">Primary</span>}
                        </p>
                        <p className="mt-0.5 text-xs text-dash-muted">{t.traveller_type}{t.age ? ` - Age ${t.age}` : ""}</p>
                      </div>
                      {t.special_requirements && <p className="text-xs text-amber-600">Note: {t.special_requirements}</p>}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {/* Status history */}
          {booking.status_history && booking.status_history.length > 0 && (
            <div className="mt-4">
              <Panel title="Status History" icon={History} iconColor="text-amber-600" iconBg="bg-amber-50">
                <div className="space-y-3">
                  {booking.status_history.map((h) => (
                    <div key={h.id} className="border-l-2 border-dash-brand/30 pl-3">
                      <p className="text-sm font-bold text-dash-text">
                        {h.old_status ? `${h.old_status.replaceAll("_", " ")} -> ` : ""}
                        {h.new_status.replaceAll("_", " ")}
                      </p>
                      {h.reason && <p className="mt-0.5 text-xs text-dash-muted">{h.reason}</p>}
                      {h.created_at && <p className="mt-0.5 text-[10px] text-dash-subtle">{new Date(h.created_at).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {(booking.customer_notes || booking.notes) && (
            <div className="mt-4">
              <Panel title="Notes" icon={FileText} iconColor="text-slate-600" iconBg="bg-slate-100">
                <p className="text-sm text-dash-muted">{booking.customer_notes || booking.notes}</p>
              </Panel>
            </div>
          )}

          <div className="mt-4 text-center">
            <Link href="/customer/bookings" className="inline-flex items-center justify-center gap-1.5 text-sm font-bold text-dash-brand hover:underline">
              <ArrowLeft size={14} /> Back to all bookings
            </Link>
          </div>
        </>
      )}

      {showPayModal && booking && (
        <PayNowModal
          bookingId={booking.id}
          amount={pendingAmount}
          totalAmount={Number(booking.final_amount ?? pendingAmount)}
          amountPaid={Number(booking.amount_paid ?? 0)}
          preferredPaymentType={booking.payment_type}
          currency={booking.currency || "USD"}
          depositConfig={booking.deposit_config}
          onClose={() => setShowPayModal(false)}
          onSuccess={() => {
            setShowPayModal(false);
            setPaymentBanner({ type: "success", msg: "Test payment recorded. Final confirmation is pending supplier acceptance." });
            void load();
          }}
        />
      )}
    </CustomerPageShell>
  );
}
