"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { LuArrowLeft as ArrowLeft, LuArrowRight as ArrowRight, LuCircleAlert as AlertCircle, LuCircleCheckBig as CheckCircle2, LuClock3 as Clock3, LuLoaderCircle as Loader2, LuShieldCheck as ShieldCheck } from "react-icons/lu";
import api from "@/lib/api/client";
import { AgentPageShell } from "@/components/agent/AgentPage";

type ReturnState = "verifying" | "success" | "failed";
type Receipt = { gateway: "stripe" | "paypal"; paymentCode?: string; gatewayReference?: string };

export default function AgentPaymentResultPage() {
  const { result } = useParams<{ result: string }>();
  const searchParams = useSearchParams();
  const processed = useRef(false);
  const bookingId = searchParams.get("booking_id");
  const provider = searchParams.get("provider");
  const [state, setState] = useState<ReturnState>(result === "success" ? "verifying" : "failed");
  const [message, setMessage] = useState(result === "success" ? "Verifying the secure payment authorization..." : "This payment was not completed. No payment was recorded.");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    if (processed.current || result !== "success") return;
    processed.current = true;
    const id = Number(bookingId);
    if (!Number.isSafeInteger(id) || id <= 0) { setState("failed"); setMessage("We could not identify the booking for this payment return."); return; }
    const verify = async () => {
      try {
        if (provider === "paypal") {
          const orderId = searchParams.get("token");
          const paymentId = sessionStorage.getItem(`paypal_pid_${id}`);
          if (!orderId) throw new Error("PayPal return details are missing.");
          const response = await api.post("/payments/paypal/capture", { order_id: orderId, payment_id: paymentId ? Number(paymentId) : undefined });
          const data = response.data?.data ?? {};
          if (data.paypal_status !== "COMPLETED") throw new Error("PayPal has not completed this authorization.");
          setReceipt({ gateway: "paypal", paymentCode: data.payment_code, gatewayReference: data.gateway_reference });
          sessionStorage.removeItem(`paypal_pid_${id}`);
        } else {
          const sessionId = searchParams.get("session_id");
          if (!sessionId) throw new Error("Stripe session details are missing.");
          const response = await api.post("/payments/stripe/confirm-return", { booking_id: id, session_id: sessionId });
          const data = response.data?.data ?? {};
          setReceipt({ gateway: "stripe", paymentCode: data.payment_code, gatewayReference: data.gateway_reference });
          sessionStorage.removeItem(`stripe_pid_${id}`);
        }
        setState("success");
        setMessage("Payment has been authorized securely. Tourvaa will capture it when the booking proceeds through confirmation.");
      } catch {
        setState("failed");
        setMessage("We could not verify this payment yet. Do not submit another payment until you review the booking or contact Tourvaa support.");
      }
    };
    void verify();
  }, [bookingId, provider, result, searchParams]);

  useEffect(() => {
    if (result !== "failed") return;
    const id = Number(bookingId);
    if (!Number.isSafeInteger(id) || id <= 0) return;
    const key = `${provider === "paypal" ? "paypal" : "stripe"}_pid_${id}`;
    const paymentId = sessionStorage.getItem(key);
    void api.post("/payments/abandon-pending", { booking_id: id, payment_id: paymentId ? Number(paymentId) : undefined }).finally(() => sessionStorage.removeItem(key));
  }, [bookingId, provider, result]);

  const bookingHref = bookingId && Number.isSafeInteger(Number(bookingId)) ? `/agent/bookings/${bookingId}` : "/agent/bookings";
  const verifying = state === "verifying";
  const success = state === "success";
  const failed = state === "failed";

  return <AgentPageShell className="flex items-center justify-center"><main className="my-8 w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#DDE7F3] bg-white shadow-[0_18px_55px_rgba(25,62,109,.10)]">
    <div className="border-b border-[#E7EEF6] px-6 py-3 sm:px-12">
      <Link href={bookingHref} className="inline-flex items-center gap-2 text-xs font-black text-[#315174] transition hover:text-[#1464F4]"><ArrowLeft size={15} /> Back to booking</Link>
    </div>
    <section className={`px-6 pb-9 pt-9 text-center sm:px-12 ${verifying ? "bg-[#F2F7FF]" : success ? "bg-[linear-gradient(135deg,#EDFDF5,#F7FFFB,#EEF7FF)]" : "bg-[linear-gradient(135deg,#FFF5F4,#FFFDFC,#FFF8EE)]"}`}>
      <span className={`mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border bg-white shadow-sm ${verifying ? "border-blue-100 text-[#1464F4]" : success ? "border-emerald-100 text-[#009A68]" : "border-rose-100 text-[#D64747]"}`}>{verifying ? <Loader2 size={38} className="animate-spin" /> : success ? <CheckCircle2 size={39} /> : <AlertCircle size={38} />}</span>
      <p className={`mt-6 text-[11px] font-black uppercase tracking-[.17em] ${success ? "text-[#008A5B]" : failed ? "text-[#C44747]" : "text-[#2475E8]"}`}>Agent payment {verifying ? "verification" : success ? "authorized" : "not completed"}</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0C2043]">{verifying ? "Verifying payment" : success ? "Payment authorized" : "Payment was not completed"}</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#52677F]">{message}</p>
      {success && <div className="mx-auto mt-6 max-w-md rounded-2xl border border-emerald-100 bg-white/85 text-left"><div className="flex items-start gap-3 border-b border-[#E7F1EC] p-4"><Clock3 size={19} className="mt-0.5 shrink-0 text-[#009A68]" /><div><p className="text-sm font-bold text-[#164B3A]">Awaiting Tourvaa confirmation</p><p className="mt-0.5 text-xs leading-5 text-[#548070]">The authorization is held securely while Tourvaa completes the booking confirmation process.</p></div></div><dl className="divide-y divide-[#EDF3F0] text-xs"><div className="flex justify-between gap-4 px-4 py-3"><dt className="text-[#668072]">Provider</dt><dd className="font-bold capitalize text-[#173C2C]">{receipt?.gateway ?? provider}</dd></div>{receipt?.paymentCode && <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-[#668072]">Payment reference</dt><dd className="font-mono font-bold text-[#173C2C]">{receipt.paymentCode}</dd></div>}{receipt?.gatewayReference && <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-[#668072]">Gateway transaction ID</dt><dd className="max-w-[185px] truncate font-mono font-bold text-[#173C2C]" title={receipt.gatewayReference}>{receipt.gatewayReference}</dd></div>}</dl></div>}
      {failed && <div className="mx-auto mt-6 max-w-md rounded-2xl border border-orange-100 bg-white/85 p-4 text-left text-xs leading-5 text-[#806B4D]">No duplicate charge was recorded. Review the booking before attempting payment again.</div>}
    </section>
    <section className="border-t border-[#E7EEF6] px-6 py-6 text-center sm:px-12"><p className="flex justify-center gap-2 text-xs font-semibold text-[#69809B]"><ShieldCheck size={16} className="text-[#009A68]" /> Secure checkout protected by Tourvaa and your payment provider</p>{!verifying && <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href={failed ? `${bookingHref}?pay=1` : bookingHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1464F4] px-5 py-3 text-sm font-bold text-white hover:bg-[#0B52D3]">{failed ? "Try payment again" : "View booking"}<ArrowRight size={16} /></Link><Link href="/agent/bookings" className="rounded-xl border border-[#C9D9ED] px-5 py-3 text-sm font-bold text-[#315174] hover:bg-[#F4F8FD]">All bookings</Link></div>}</section>
  </main></AgentPageShell>;
}
