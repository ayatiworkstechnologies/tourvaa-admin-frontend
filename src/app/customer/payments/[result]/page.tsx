"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  LuArrowRight as ArrowRight,
  LuBadgeCheck as BadgeCheck,
  LuCircleAlert as AlertCircle,
  LuCircleCheckBig as CheckCircle2,
  LuClock3 as Clock3,
  LuCreditCard as CreditCard,
  LuLoaderCircle as Loader2,
  LuShieldCheck as ShieldCheck,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { BOOKING_PAYMENT_AUTHORIZED_MESSAGE } from "@/lib/constants/bookingStatus";
import { CustomerPageShell } from "@/components/customer/CustomerPage";

type ReturnState = "verifying" | "success" | "failed";
type PaymentReceipt = {
  gateway: "stripe" | "paypal";
  paymentCode?: string;
  gatewayReference?: string;
};

export default function CustomerPaymentResultPage() {
  const { result } = useParams<{ result: string }>();
  const searchParams = useSearchParams();
  const processed = useRef(false);
  const bookingId = searchParams.get("booking_id");
  const provider = searchParams.get("provider");
  const [state, setState] = useState<ReturnState>(result === "success" ? "verifying" : "failed");
  const [message, setMessage] = useState(result === "success" ? "Verifying your payment securely..." : "Your payment was not completed. No payment was recorded.");
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

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
          const data = response.data?.data ?? {};
          setReceipt({
            gateway: "paypal",
            paymentCode: data.payment_code,
            gatewayReference: data.gateway_reference,
          });
          sessionStorage.removeItem(`paypal_pid_${id}`);
        } else {
          const sessionId = searchParams.get("session_id");
          if (!sessionId) throw new Error("Stripe session details are missing.");
          const response = await api.post("/payments/stripe/confirm-return", { booking_id: id, session_id: sessionId });
          const data = response.data?.data ?? {};
          setReceipt({
            gateway: "stripe",
            paymentCode: data.payment_code,
            gatewayReference: data.gateway_reference,
          });
          sessionStorage.removeItem(`stripe_pid_${id}`);
        }
        setState("success");
        setMessage(BOOKING_PAYMENT_AUTHORIZED_MESSAGE);
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
  const failed = state === "failed";
  const title = verifying ? "Verifying your payment" : success ? "Payment authorized" : "Payment was not completed";
  const eyebrow = verifying ? "Secure payment check" : success ? "Payment authorization received" : "Payment not completed";

  return (
    <CustomerPageShell>
      <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-[28px] border border-[#DDE7F3] bg-white shadow-[0_18px_55px_rgba(25,62,109,0.10)]">
        <div className={`relative overflow-hidden px-6 pb-10 pt-9 text-center sm:px-12 ${verifying ? "bg-[#F2F7FF]" : success ? "bg-[linear-gradient(135deg,#EDFDF5_0%,#F7FFFB_54%,#EEF7FF_100%)]" : "bg-[linear-gradient(135deg,#FFF5F4_0%,#FFFDFC_58%,#FFF8EE_100%)]"}`}>
          <span className={`mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border shadow-sm ${verifying ? "border-blue-100 bg-white text-[#1464F4]" : success ? "border-emerald-100 bg-white text-[#009A68]" : "border-rose-100 bg-white text-[#D64747]"}`}>
            {verifying ? <Loader2 size={38} className="animate-spin" /> : success ? <CheckCircle2 size={39} strokeWidth={2.4} /> : <AlertCircle size={38} strokeWidth={2.2} />}
          </span>
          <p className={`mt-6 text-[11px] font-black uppercase tracking-[.17em] ${verifying ? "text-[#2475E8]" : success ? "text-[#008A5B]" : "text-[#C44747]"}`}>{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0C2043] sm:text-[34px]">{title}</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#52677F]">{message}</p>

          {success && (
            <div className="mx-auto mt-6 max-w-md space-y-3 text-left">
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/80 p-4">
                <Clock3 size={19} className="mt-0.5 shrink-0 text-[#009A68]" />
                <div><p className="text-sm font-bold text-[#164B3A]">Awaiting supplier acceptance</p><p className="mt-0.5 text-xs leading-5 text-[#548070]">Your card or PayPal account is authorized, not charged. Tourvaa captures payment only after the supplier accepts your tour.</p></div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#D9E9E3] bg-white/90">
                <div className="flex items-center justify-between border-b border-[#E7F1EC] px-4 py-3"><span className="text-xs font-black uppercase tracking-[.13em] text-[#507260]">Payment receipt</span><span className="rounded-full bg-[#EEF9F3] px-2.5 py-1 text-[11px] font-bold text-[#008A5B]">Authorized</span></div>
                <dl className="divide-y divide-[#EDF3F0] text-xs">
                  <div className="flex items-center justify-between gap-4 px-4 py-3"><dt className="text-[#668072]">Provider</dt><dd className="font-bold capitalize text-[#173C2C]">{receipt?.gateway ?? provider ?? "Payment"}</dd></div>
                  {receipt?.paymentCode && <div className="flex items-center justify-between gap-4 px-4 py-3"><dt className="text-[#668072]">Payment reference</dt><dd className="font-mono text-[11px] font-bold text-[#173C2C]">{receipt.paymentCode}</dd></div>}
                  {receipt?.gatewayReference && <div className="flex items-center justify-between gap-4 px-4 py-3"><dt className="text-[#668072]">Gateway transaction ID</dt><dd className="max-w-[190px] truncate font-mono text-[11px] font-bold text-[#173C2C]" title={receipt.gatewayReference}>{receipt.gatewayReference}</dd></div>}
                </dl>
              </div>
            </div>
          )}
          {failed && (
            <div className="mx-auto mt-6 flex max-w-md items-start gap-3 rounded-2xl border border-orange-100 bg-white/80 p-4 text-left">
              <CreditCard size={19} className="mt-0.5 shrink-0 text-[#E17A00]" />
              <div><p className="text-sm font-bold text-[#704400]">No duplicate charge</p><p className="mt-0.5 text-xs leading-5 text-[#806B4D]">No payment was recorded from this return. Review your booking before trying again.</p></div>
            </div>
          )}
        </div>

        <div className="border-t border-[#E7EEF6] px-6 py-6 sm:px-12">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#69809B]"><ShieldCheck size={16} className="text-[#009A68]" /> Secure checkout protected by Tourvaa and your payment provider</div>
          {!verifying && <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {failed ? (
              <Link href={`${bookingHref}${bookingHref.includes("?") ? "&" : "?"}pay=1`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1464F4] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B52D3]">Try payment again <ArrowRight size={16} /></Link>
            ) : (
              <Link href={bookingHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1464F4] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B52D3]">View booking <ArrowRight size={16} /></Link>
            )}
            <Link href="/customer/payments" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#C9D9ED] px-5 py-3 text-sm font-bold text-[#315174] transition hover:bg-[#F4F8FD]"><BadgeCheck size={16} /> Payment history</Link>
          </div>}
        </div>
      </div>
    </CustomerPageShell>
  );
}
