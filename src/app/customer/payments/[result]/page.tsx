"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { LuCircleAlert as AlertCircle, LuCircleCheckBig as CheckCircle2, LuLoaderCircle as Loader2 } from "react-icons/lu";
import api from "@/lib/api/client";
import { BOOKING_PAYMENT_RECEIVED_MESSAGE } from "@/lib/constants/bookingStatus";
import { CustomerPageShell } from "@/components/customer/CustomerPage";

type ReturnState = "verifying" | "success" | "failed";

export default function CustomerPaymentResultPage() {
  const { result } = useParams<{ result: string }>();
  const searchParams = useSearchParams();
  const processed = useRef(false);
  const bookingId = searchParams.get("booking_id");
  const provider = searchParams.get("provider");
  const [state, setState] = useState<ReturnState>(result === "success" ? "verifying" : "failed");
  const [message, setMessage] = useState(result === "success" ? "Verifying your payment securely..." : "Your payment was not completed. No payment was recorded.");

  useEffect(() => {
    if (processed.current || result !== "success") return;
    processed.current = true;
    const id = Number(bookingId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      setState("failed");
      setMessage("We could not identify the booking for this payment return.");
      return;
    }

    const verify = async () => {
      try {
        if (provider === "paypal") {
          const paymentId = sessionStorage.getItem(`paypal_pid_${id}`);
          const orderId = searchParams.get("token");
          if (!orderId) throw new Error("PayPal return details are missing.");
          const response = await api.post("/payments/paypal/capture", {
            order_id: orderId,
            payment_id: paymentId ? Number(paymentId) : undefined,
          });
          if (response.data?.data?.paypal_status !== "COMPLETED") {
            throw new Error("PayPal has not completed this payment.");
          }
          sessionStorage.removeItem(`paypal_pid_${id}`);
        } else {
          const sessionId = searchParams.get("session_id");
          if (!sessionId) throw new Error("Stripe session details are missing.");
          await api.post("/payments/stripe/confirm-return", { booking_id: id, session_id: sessionId });
          sessionStorage.removeItem(`stripe_pid_${id}`);
        }
        setState("success");
        setMessage(BOOKING_PAYMENT_RECEIVED_MESSAGE);
      } catch {
        setState("failed");
        setMessage("We could not verify this payment yet. Please do not pay again until you have checked the booking or contacted support.");
      }
    };
    void verify();
  }, [bookingId, provider, result, searchParams]);

  useEffect(() => {
    if (result !== "failed") return;
    const id = Number(bookingId);
    if (!Number.isSafeInteger(id) || id <= 0) return;
    const storedPaymentId = sessionStorage.getItem(`${provider === "paypal" ? "paypal" : "stripe"}_pid_${id}`);
    void api.post("/payments/abandon-pending", {
      booking_id: id,
      payment_id: storedPaymentId ? Number(storedPaymentId) : undefined,
    }).finally(() => {
      sessionStorage.removeItem(`stripe_pid_${id}`);
      sessionStorage.removeItem(`paypal_pid_${id}`);
    });
  }, [bookingId, provider, result]);

  const bookingHref = bookingId && Number.isSafeInteger(Number(bookingId)) ? `/customer/bookings/${bookingId}` : "/customer/bookings";
  const success = state === "success";
  const verifying = state === "verifying";

  return (
    <CustomerPageShell>
      <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-[#DDE7F3] bg-white p-7 text-center shadow-sm sm:p-10">
        <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${verifying ? "bg-blue-50 text-blue-600" : success ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
          {verifying ? <Loader2 size={32} className="animate-spin" /> : success ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
        </span>
        <p className="mt-5 text-xs font-black uppercase tracking-[.16em] text-[#2475E8]">Secure payment return</p>
        <h1 className="mt-2 text-2xl font-black text-[#0C2043]">{verifying ? "Verifying payment" : success ? "Booking Successful — Awaiting Tourvaa Confirmation" : "Payment Required"}</h1>
        <p className="mt-3 text-sm leading-6 text-[#52677F]">{message}</p>
        {!verifying && <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={bookingHref} className="rounded-xl bg-[#1464F4] px-5 py-3 text-sm font-bold text-white hover:bg-[#0B52D3]">View booking</Link>
          <Link href="/customer/payments" className="rounded-xl border border-[#C9D9ED] px-5 py-3 text-sm font-bold text-[#315174] hover:bg-[#F4F8FD]">Payment history</Link>
        </div>}
      </div>
    </CustomerPageShell>
  );
}
