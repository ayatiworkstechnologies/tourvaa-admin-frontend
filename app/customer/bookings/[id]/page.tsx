"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Loader2,
  MapPinned,
  Users,
  XCircle,
} from "lucide-react";
import api from "@/lib/api";

type Traveller = {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  traveller_type: string;
  age?: number;
  email?: string;
  phone?: string;
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
  payment_status?: string;
  supplier_acceptance_status?: string;
  final_amount?: string | number;
  amount_paid?: string | number;
  amount_pending?: string | number;
  currency?: string;
  no_of_adults?: number;
  no_of_children?: number;
  no_of_infants?: number;
  total_travellers?: number;
  notes?: string;
  customer_notes?: string;
  created_at?: string;
  travellers?: Traveller[];
  status_history?: StatusHistory[];
};

function fmt(v?: string | number, currency = "AED") {
  if (v == null) return "—";
  return `${currency} ${Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function statusChip(s: string) {
  const v = (s || "").toLowerCase();
  if (["confirmed", "completed", "paid"].includes(v))
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  if (["pending", "pending_payment", "pending_supplier_acceptance", "payment_authorized"].includes(v))
    return "bg-amber-50 text-amber-700 border border-amber-100";
  if (["cancelled", "declined", "failed", "refunded"].includes(v))
    return "bg-red-50 text-red-600 border border-red-100";
  if (["ongoing"].includes(v))
    return "bg-blue-50 text-blue-700 border border-blue-100";
  return "bg-slate-50 text-slate-600 border border-slate-100";
}

function StatusIcon({ status }: { status: string }) {
  const v = (status || "").toLowerCase();
  if (["confirmed", "completed", "paid"].includes(v)) return <CheckCircle2 size={14} className="text-emerald-600" />;
  if (["cancelled", "declined", "failed"].includes(v)) return <XCircle size={14} className="text-red-500" />;
  return <Clock size={14} className="text-amber-500" />;
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-[#98A2B3]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#121826]">{value || "—"}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E7EAF0]/80 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
      <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-[#667085]">{title}</h3>
      {children}
    </div>
  );
}

export default function CustomerBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

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

  const canCancel = booking && !["cancelled", "completed", "refunded", "declined"].includes(booking.booking_status);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/customer/bookings")}
          className="flex items-center gap-1.5 rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-sm font-bold text-[#344054] hover:bg-[#F3F8FC] transition-all"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="text-2xl font-black text-[#121826]">Booking Details</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-[#43A9F6]" size={32} />
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} />
          {error}
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
          {/* Header card */}
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-[#E7EAF0]/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-sm font-bold text-[#667085]">{booking.booking_code}</p>
              <h2 className="mt-1 text-xl font-black text-[#121826]">{booking.tour_name || "Tour Booking"}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusChip(booking.booking_status)}`}>
                  <StatusIcon status={booking.booking_status} />
                  {booking.booking_status.replaceAll("_", " ")}
                </span>
                {booking.payment_status && (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusChip(booking.payment_status)}`}>
                    {booking.payment_status.replaceAll("_", " ")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {canCancel && !showCancel && (
                <button
                  type="button"
                  onClick={() => setShowCancel(true)}
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 transition-all"
                >
                  <XCircle size={16} />
                  Request Cancellation
                </button>
              )}
            </div>
          </div>

          {/* Cancel form */}
          {showCancel && (
            <form onSubmit={handleCancel} className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="mb-3 font-bold text-red-700">Request Cancellation</p>
              <textarea
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please explain why you want to cancel this booking..."
                rows={3}
                className="w-full resize-none rounded-xl border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400"
              />
              <div className="mt-3 flex gap-3">
                <button type="submit" disabled={cancelling}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                  {cancelling ? <Loader2 className="animate-spin" size={14} /> : null}
                  Submit Request
                </button>
                <button type="button" onClick={() => { setShowCancel(false); setCancelReason(""); }}
                  className="rounded-xl border border-[#E7EAF0] bg-white px-4 py-2 text-sm font-bold text-[#344054] hover:bg-[#F3F8FC]">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Detail panels */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Tour Info">
              <div className="space-y-3">
                <Field label="Tour" value={<span className="flex items-center gap-1"><MapPinned size={14} className="text-[#43A9F6]" />{booking.tour_name}</span>} />
                <Field label="Travel Date" value={<span className="flex items-center gap-1"><CalendarCheck size={14} className="text-[#43A9F6]" />{booking.tour_date || "—"}</span>} />
                <Field label="Country" value={booking.country} />
                <Field label="Supplier" value={booking.supplier_name} />
              </div>
            </Panel>

            <Panel title="Travellers">
              <div className="space-y-3">
                <Field label="Adults" value={booking.no_of_adults ?? "—"} />
                <Field label="Children" value={booking.no_of_children ?? 0} />
                <Field label="Infants" value={booking.no_of_infants ?? 0} />
                <Field label="Total" value={<span className="flex items-center gap-1"><Users size={14} className="text-[#43A9F6]" />{booking.total_travellers ?? "—"}</span>} />
              </div>
            </Panel>

            <Panel title="Payment">
              <div className="space-y-3">
                <Field label="Total Amount" value={fmt(booking.final_amount, booking.currency)} />
                <Field label="Amount Paid" value={<span className="text-emerald-700">{fmt(booking.amount_paid, booking.currency)}</span>} />
                <Field label="Amount Pending" value={<span className={Number(booking.amount_pending) > 0 ? "text-red-600" : "text-emerald-700"}>{fmt(booking.amount_pending, booking.currency)}</span>} />
                <Field label="Payment Status" value={booking.payment_status?.replaceAll("_", " ")} />
              </div>
            </Panel>
          </div>

          {/* Traveller list */}
          {booking.travellers && booking.travellers.length > 0 && (
            <Panel title="Traveller Details">
              <div className="space-y-3">
                {booking.travellers.map((t) => (
                  <div key={t.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-[#E7EAF0] px-4 py-3">
                    <div>
                      <p className="font-semibold text-[#121826]">
                        {t.full_name || `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() || "—"}
                        {t.is_primary_contact && <span className="ml-2 rounded-full bg-[#F0F7FF] px-2 py-0.5 text-[10px] font-bold text-[#43A9F6]">Primary</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-[#667085]">{t.traveller_type} {t.age ? `· Age ${t.age}` : ""}</p>
                    </div>
                    {t.special_requirements && (
                      <p className="text-xs text-amber-600">Note: {t.special_requirements}</p>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Status history */}
          {booking.status_history && booking.status_history.length > 0 && (
            <div className="mt-4">
              <Panel title="Status History">
                <div className="space-y-3">
                  {booking.status_history.map((h) => (
                    <div key={h.id} className="border-l-2 border-[#43A9F6]/30 pl-3">
                      <p className="text-sm font-bold text-[#121826]">
                        {h.old_status ? `${h.old_status.replaceAll("_", " ")} → ` : ""}{h.new_status.replaceAll("_", " ")}
                      </p>
                      {h.reason && <p className="mt-0.5 text-xs text-[#667085]">{h.reason}</p>}
                      {h.created_at && <p className="mt-0.5 text-[10px] text-[#98A2B3]">{new Date(h.created_at).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {/* Notes */}
          {(booking.customer_notes || booking.notes) && (
            <div className="mt-4">
              <Panel title="Notes">
                <p className="text-sm text-[#667085]">{booking.customer_notes || booking.notes}</p>
              </Panel>
            </div>
          )}

          <div className="mt-4 text-center">
            <Link href="/customer/bookings" className="text-sm font-bold text-[#43A9F6] hover:underline">
              ← Back to all bookings
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
