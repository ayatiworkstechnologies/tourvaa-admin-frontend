"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LuArrowLeft as ArrowLeft, LuCreditCard as CreditCard, LuDownload as Download, LuFileText as FileText, LuLoaderCircle as Loader2, LuRefreshCw as RefreshCw } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import BookingPaymentModal from "@/components/bookings/BookingPaymentModal";
import { AgentPageHeader, AgentPageShell } from "@/components/agent/AgentPage";

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
  customer?: { id: number; name?: string; email?: string };
  tour_name?: string;
  tour_date?: string | null;
  booking_status: string;
  payment_status: string;
  supplier_acceptance_status?: string;
  supplier?: { id: number; supplier_name?: string };
  final_amount?: string | number;
  amount_paid?: string | number;
  amount_pending?: string | number;
  currency?: string;
  no_of_adults?: number;
  no_of_children?: number;
  total_travellers?: number;
  payment_type?: "partial" | "full";
  agent_payment_method?: string | null;
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
};

type Invoice = {
  id: number;
  invoice_number?: string;
};

function money(value: string | number | undefined, currency = "USD") {
  if (!value && value !== 0) return "-";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}

function dateText(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

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
  const [booking, setBooking] = useState<Booking | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoiceError, setInvoiceError] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
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
    if (!booking || searchParams.get("pay") !== "1") return;
    if (Number(booking.amount_pending ?? 0) > 0) {
      setPaymentBanner({ type: "info", message: "Booking created successfully. Complete the payment to send it to the supplier." });
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
      setPaymentBanner({ type: "info", message: "Payment was cancelled. The booking is saved and can be paid when ready." });
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
        setPaymentBanner({ type: "success", message: "Payment completed successfully. Booking details have been refreshed." });
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
      const res = await api.get(`/invoices/${invoice.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoice_number ?? invoice.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setInvoiceError("Invoice could not be downloaded.");
    } finally {
      setDownloadLoading(false);
    }
  }

  if (loading) {
    return (
      <AgentPageShell className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-dash-muted">
          <Loader2 size={18} className="animate-spin text-dash-brand" /> Loading booking…
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
  const paymentComplete = ["paid", "authorized", "partially_paid", "partially_refunded"].includes((booking.payment_status || "").toLowerCase());
  const paymentValidationPending = ["credit_approval_pending", "bank_transfer_pending"].includes((booking.payment_status || "").toLowerCase());
  const supplierAccepted = booking.supplier_acceptance_status === "accepted";
  const bookingConfirmed = ["confirmed", "ongoing", "completed"].includes((booking.booking_status || "").toLowerCase());
  const workflow = [
    { label: "Payment / credit", detail: paymentComplete ? "Payment validated" : paymentValidationPending ? booking.payment_status.replaceAll("_", " ") : `${booking.payment_type === "partial" ? "Deposit" : "Full payment"} pending`, done: paymentComplete, active: !paymentComplete },
    { label: "Supplier decision", detail: supplierAccepted ? "Supplier accepted" : (booking.supplier_acceptance_status ?? "not assigned").replaceAll("_", " "), done: supplierAccepted, active: paymentComplete && !supplierAccepted },
    { label: "Confirmed", detail: bookingConfirmed ? booking.booking_status.replaceAll("_", " ") : "Waiting for validation and supplier", done: bookingConfirmed, active: paymentComplete && supplierAccepted && !bookingConfirmed },
  ];
  const completedStepStyles = [
    { card: "border-sky-200 bg-sky-50/80", label: "text-sky-700" },
    { card: "border-violet-200 bg-violet-50/80", label: "text-violet-700" },
    { card: "border-teal-200 bg-teal-50/80", label: "text-teal-700" },
  ];

  const travellerColumns: DataTableColumn<Traveller>[] = [
    { key: "index", header: "#", render: (_, idx) => idx + 1, className: "text-dash-muted" },
    { key: "name", header: "Name", className: "font-bold text-dash-text", render: (t) => t.name ?? t.full_name ?? "-" },
    { key: "type", header: "Type", className: "hidden capitalize text-dash-muted sm:table-cell", render: (t) => t.traveller_type ?? "adult" },
    { key: "nationality", header: "Nationality", className: "hidden text-dash-muted md:table-cell", render: (t) => t.nationality ?? "-" },
    { key: "passport", header: "Passport", className: "hidden text-dash-muted lg:table-cell", render: (t) => t.passport_number ?? "-" },
  ];

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
            <Pill status={booking.booking_status}>{booking.booking_status.replaceAll("_", " ")}</Pill>
            <Pill status={booking.payment_status}>{booking.payment_status.replaceAll("_", " ")}</Pill>
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
          </div>
        </div>
      </AgentPageHeader>

      {invoiceError && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{invoiceError}</div>}
      {paymentBanner && (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold ${paymentBanner.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : paymentBanner.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
          {paymentBanner.message}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_-24px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-dash-text">Booking Execution Flow</h2>
            <p className="mt-1 text-xs text-dash-muted">Online payment, approved credit, wallet settlement, or verified bank transfer makes the booking eligible for supplier processing.</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold capitalize text-indigo-700">Current: {booking.booking_status.replaceAll("_", " ")}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {workflow.map((step, index) => (
            <div key={step.label} className={`rounded-2xl border p-4 transition-colors ${step.done ? completedStepStyles[index].card : step.active ? "border-indigo-200 bg-indigo-50/80" : "border-slate-200 bg-slate-50/70"}`}>
              <p className={`text-xs font-black uppercase tracking-wide ${step.done ? completedStepStyles[index].label : step.active ? "text-indigo-700" : "text-slate-500"}`}>{step.done ? "✓" : index + 1} · {step.label}</p>
              <p className="mt-2 text-sm font-bold capitalize text-dash-text">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Booking Info */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_-24px_rgba(15,23,42,0.4)]">
          <h2 className="flex items-center gap-2 text-base font-black text-dash-text">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><FileText size={16} /></span> Booking Information
          </h2>
          <div className="mt-4">
            <InfoRow label="Booking Code" value={booking.booking_code} />
            <InfoRow label="Agent Reference" value={booking.agent_reference} />
            <InfoRow label="Tour" value={booking.tour_name} />
            <InfoRow label="Travel Date" value={dateText(booking.tour_date)} />
            <InfoRow label="Adults" value={booking.no_of_adults} />
            <InfoRow label="Children" value={booking.no_of_children ?? 0} />
            <InfoRow label="Total Travellers" value={booking.total_travellers ?? ((booking.no_of_adults ?? 0) + (booking.no_of_children ?? 0))} />
            <InfoRow label="Supplier" value={booking.supplier?.supplier_name} />
            <InfoRow label="Supplier Acceptance" value={(booking.supplier_acceptance_status ?? "-").replaceAll("_", " ")} />
            <InfoRow label="Source" value={booking.booking_source?.replaceAll("_", " ") ?? "-"} />
            <InfoRow label="Created" value={dateText(booking.created_at)} />
            {(booking.customer_notes || booking.notes) && <InfoRow label="Notes" value={booking.customer_notes ?? booking.notes} />}
          </div>
        </div>

        {/* Customer & Payment Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_-24px_rgba(15,23,42,0.4)]">
            <h2 className="text-base font-black text-dash-text">Customer</h2>
            <div className="mt-4">
              <InfoRow label="Name" value={booking.customer_name ?? booking.customer?.name} />
              <InfoRow label="Email" value={booking.customer_email ?? booking.customer?.email} />
              <InfoRow label="Phone" value={booking.customer_phone} />
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-linear-to-br from-white to-indigo-50/40 p-6 shadow-[0_10px_35px_-24px_rgba(49,46,129,0.35)]">
            <h2 className="text-base font-black text-dash-text">Payment</h2>
            <div className="mt-4">
              <InfoRow label="Total Amount" value={money(booking.final_amount, booking.currency)} />
              <InfoRow label="Amount Paid" value={money(booking.amount_paid, booking.currency)} />
              <InfoRow
                label="Balance Due"
                value={
                  <span className={Number(booking.amount_pending) > 0 ? "text-amber-700" : "text-emerald-700"}>
                    {money(booking.amount_pending, booking.currency)}
                  </span>
                }
              />
              <InfoRow label="Payment Status" value={<Pill status={booking.payment_status}>{booking.payment_status.replaceAll("_", " ")}</Pill>} />
              <InfoRow label="Payment Method" value={booking.agent_payment_method?.replaceAll("_", " ") ?? "Online"} />
              <InfoRow label="Payment Plan" value={booking.payment_type === "partial" ? "30% deposit" : "Full payment"} />
            </div>
          </div>

          {booking.price_breakdown && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_-24px_rgba(15,23,42,0.4)]">
              <h2 className="text-base font-black text-dash-text">Price Breakdown</h2>
              <div className="mt-4">
                <InfoRow label="Base tour" value={money(booking.price_breakdown.base_amount, booking.currency)} />
                <InfoRow label="Activities" value={money(booking.price_breakdown.optional_activity_amount, booking.currency)} />
                <InfoRow label="Accommodation" value={money(booking.price_breakdown.accommodation_amount, booking.currency)} />
                <InfoRow label="Extensions" value={money(booking.price_breakdown.extension_amount, booking.currency)} />
                <InfoRow label="Discount" value={money(booking.price_breakdown.discount_amount, booking.currency)} />
                <InfoRow label="Agent net price" value={money(booking.agent_net_price, booking.currency)} />
                <InfoRow label="Agent markup" value={money(booking.agent_markup, booking.currency)} />
                <InfoRow label="Customer selling price" value={money(booking.customer_selling_price ?? booking.price_breakdown.final_amount, booking.currency)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Travellers */}
      {travellers.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_-24px_rgba(15,23,42,0.4)]">
          <h2 className="text-base font-black text-dash-text mb-4">Travellers ({travellers.length})</h2>
          <div className="p-0">
            <DataTable
              ariaLabel="Travellers"
              columns={travellerColumns}
              rows={travellers}
            />
          </div>
        </div>
      )}

      {booking.status_history && booking.status_history.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_-24px_rgba(15,23,42,0.4)]">
          <h2 className="text-base font-black text-dash-text">Status Timeline</h2>
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

      {showPayment && Number(booking.amount_pending ?? 0) > 0 && (
        <BookingPaymentModal
          bookingId={booking.id}
          outstandingAmount={Number(booking.amount_pending ?? 0)}
          totalAmount={Number(booking.final_amount ?? 0)}
          amountPaid={Number(booking.amount_paid ?? 0)}
          preferredPaymentType={booking.payment_type}
          currency={booking.currency || "USD"}
          returnPath={`/agent/bookings/${booking.id}`}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setPaymentBanner({ type: "success", message: "Payment completed successfully. The booking is ready for supplier processing." });
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
    </AgentPageShell>
  );
}
