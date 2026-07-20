"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { LuCircleAlert as AlertCircle, LuCreditCard as CreditCard, LuLoaderCircle as Loader2, LuX as X } from "react-icons/lu";
import api from "@/lib/api/client";

type GatewayStatus = { stripe: boolean; paypal: boolean; test_mode_available: boolean } | null;

export default function BookingPaymentModal({
  bookingId, outstandingAmount, totalAmount, amountPaid, preferredPaymentType,
  currency, returnPath, onClose, onSuccess,
}: {
  bookingId: number;
  outstandingAmount: number;
  totalAmount: number;
  amountPaid: number;
  preferredPaymentType?: "partial" | "full";
  currency: string;
  returnPath: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const depositDue = Math.min(outstandingAmount, Math.max(0, Math.round((totalAmount * 0.3 - amountPaid) * 100) / 100));
  const partialAvailable = depositDue > 0 && depositDue < outstandingAmount;
  const [paymentType, setPaymentType] = useState<"partial" | "full">(
    preferredPaymentType === "partial" && partialAvailable ? "partial" : "full",
  );
  const [gateways, setGateways] = useState<GatewayStatus>(null);
  const [gatewayLoading, setGatewayLoading] = useState(true);
  const [loading, setLoading] = useState<"stripe" | "paypal" | "test" | null>(null);
  const [error, setError] = useState("");
  const paymentAmount = paymentType === "partial" ? depositDue : outstandingAmount;

  useEffect(() => {
    api.get("/payments/gateways/status")
      .then((response) => setGateways(response.data?.data ?? { stripe: false, paypal: false, test_mode_available: false }))
      .catch(() => setGateways({ stripe: false, paypal: false, test_mode_available: true }))
      .finally(() => setGatewayLoading(false));
  }, []);

  function paymentError(error: unknown, fallback: string) {
    return axios.isAxiosError(error)
      ? error.response?.data?.detail || error.response?.data?.message || fallback
      : fallback;
  }

  async function payWithStripe() {
    setLoading("stripe"); setError("");
    try {
      const origin = window.location.origin;
      const response = await api.post("/payments/stripe/create-session", {
        booking_id: bookingId, amount: paymentAmount, currency,
        success_url: `${origin}${returnPath}?payment=stripe_success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${returnPath}?payment=cancelled`,
      });
      const checkoutUrl = response.data?.data?.checkout_url;
      if (!checkoutUrl) throw new Error("No checkout URL returned");
      window.location.href = checkoutUrl;
    } catch (requestError) {
      setError(paymentError(requestError, "Could not start Stripe payment."));
      setLoading(null);
    }
  }

  async function payWithPayPal() {
    setLoading("paypal"); setError("");
    try {
      const origin = window.location.origin;
      const response = await api.post("/payments/paypal/create-order", {
        booking_id: bookingId, amount: paymentAmount, currency,
        return_url: `${origin}${returnPath}?payment=paypal_approved`,
        cancel_url: `${origin}${returnPath}?payment=cancelled`,
      });
      const { approve_url: approveUrl, payment_id: paymentId } = response.data?.data ?? {};
      if (!approveUrl) throw new Error("No PayPal approval URL returned");
      sessionStorage.setItem(`paypal_pid_${bookingId}`, String(paymentId));
      window.location.href = approveUrl;
    } catch (requestError) {
      setError(paymentError(requestError, "Could not start PayPal payment."));
      setLoading(null);
    }
  }

  async function payWithTestGateway() {
    setLoading("test"); setError("");
    try {
      await api.post("/payments/test/simulate", {
        booking_id: bookingId, amount: paymentAmount,
        note: `${paymentType} test payment from agent booking flow`,
      });
      onClose();
      onSuccess();
    } catch (requestError) {
      setError(paymentError(requestError, "Test payment failed."));
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-dash-border bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-orange-600">Step 5 · Payment</p>
            <h2 className="mt-1 text-xl font-black text-dash-text">Complete this booking</h2>
            <p className="mt-1 text-sm text-dash-muted">Outstanding: <strong>{currency} {outstandingAmount.toLocaleString()}</strong></p>
          </div>
          <button type="button" onClick={onClose} disabled={Boolean(loading)} aria-label="Close payment" className="rounded-xl p-2 text-dash-muted hover:bg-dash-bg-muted"><X size={18} /></button>
        </div>

        {error && <div className="mt-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}

        {partialAvailable && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { value: "partial" as const, label: "30% deposit", amount: depositDue },
              { value: "full" as const, label: "Full payment", amount: outstandingAmount },
            ].map((option) => (
              <button key={option.value} type="button" onClick={() => setPaymentType(option.value)} disabled={Boolean(loading)} className={`rounded-2xl border-2 p-3 text-left ${paymentType === option.value ? "border-orange-500 bg-orange-50" : "border-dash-border"}`}>
                <span className="block text-xs font-black text-dash-text">{option.label}</span>
                <span className="mt-1 block text-lg font-black text-orange-700">{currency} {option.amount.toLocaleString()}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-white">
          <span className="text-xs font-bold">Pay securely now</span>
          <span className="text-lg font-black">{currency} {paymentAmount.toLocaleString()}</span>
        </div>

        {gatewayLoading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-orange-600" /></div> : (
          <div className="mt-4 space-y-3">
            <button type="button" onClick={payWithStripe} disabled={Boolean(loading) || !gateways?.stripe} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#635BFF] px-4 py-3 text-sm font-black text-white disabled:opacity-40">
              {loading === "stripe" ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />} Pay with Stripe
            </button>
            <button type="button" onClick={payWithPayPal} disabled={Boolean(loading) || !gateways?.paypal} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0070BA] px-4 py-3 text-sm font-black text-white disabled:opacity-40">
              {loading === "paypal" ? <Loader2 size={17} className="animate-spin" /> : null} Pay with PayPal
            </button>
            {gateways?.test_mode_available && (
              <button type="button" onClick={payWithTestGateway} disabled={Boolean(loading)} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 disabled:opacity-50">
                {loading === "test" ? <Loader2 size={17} className="animate-spin" /> : null} Simulate test payment
              </button>
            )}
          </div>
        )}
        <p className="mt-4 text-center text-xs text-dash-muted">After payment, the supplier receives the booking for acceptance.</p>
      </div>
    </div>
  );
}
