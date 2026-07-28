"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LuArrowLeft as ArrowLeft } from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import { Payment, getPaymentDetail } from "@/lib/api/services/paymentService";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-lg bg-dash-bg p-4">
      <p className="text-xs font-bold uppercase text-dash-subtle">{label}</p>
      <p className="mt-1 text-sm font-semibold text-dash-text">{value ?? "-"}</p>
    </div>
  );
}

export default function PaymentDetailPage() {
  const params = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    getPaymentDetail(params.id)
      .then(setPayment)
      .catch(() => setPayment(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <ModuleWrapper title="Payment Detail" requiredPermission="payments.view">
      {loading ? (
        <Loader label="Loading payment..." />
      ) : payment ? (
        <div className="space-y-6">
          <Link href="/admin/payments" className="inline-flex items-center gap-2 text-sm font-bold text-dash-text hover:text-dash-brand-hover">
            <ArrowLeft size={16} /> Back to payments
          </Link>

          <section className="rounded-2xl border border-dash-border-soft bg-white p-6 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
            <h2 className="text-xl font-black text-dash-text">{payment.payment_code}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Row label="Booking" value={payment.booking_code} />
              <Row label="Customer" value={payment.customer_name} />
              <Row label="Status" value={payment.payment_status} />
              <Row label="Method" value={payment.payment_method} />
              <Row label="Gateway" value={payment.gateway || "manual"} />
              <Row label="Total Amount" value={`${payment.total_amount} ${payment.currency}`} />
              <Row label="Paid Amount" value={payment.paid_amount} />
              <Row label="Gateway Payment ID" value={payment.gateway_payment_id} />
              <Row label="Gateway Order ID" value={payment.gateway_order_id} />
            </div>
          </section>

          <section className="rounded-2xl border border-dash-border-soft bg-white p-6 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
            <h2 className="font-black text-dash-text">Payment Holds</h2>
            {!payment.holds || payment.holds.length === 0 ? (
              <p className="mt-3 rounded-lg bg-dash-bg p-4 text-sm text-dash-muted">No holds on this payment.</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {payment.holds.map((hold) => (
                  <div key={hold.id} className="rounded-xl border border-dash-border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-dash-text">Hold #{hold.id}</span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{hold.status}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-dash-muted">
                      <div><p className="font-bold uppercase text-dash-subtle">Held</p><p>{hold.hold_amount}</p></div>
                      <div><p className="font-bold uppercase text-dash-subtle">Captured</p><p>{hold.captured_amount}</p></div>
                      <div><p className="font-bold uppercase text-dash-subtle">Released</p><p>{hold.released_amount}</p></div>
                    </div>
                    {hold.expires_at && <p className="mt-2 text-xs text-dash-subtle">Expires: {new Date(hold.expires_at).toLocaleString()}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <p className="text-sm text-red-600">Payment not found.</p>
      )}
    </ModuleWrapper>
  );
}
