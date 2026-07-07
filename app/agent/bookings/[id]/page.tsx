"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { LuArrowLeft as ArrowLeft, LuDownload as Download, LuFileText as FileText, LuLoaderCircle as Loader2 } from "react-icons/lu";
import api from "@/lib/api";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type Traveller = {
  id: number;
  name?: string;
  full_name?: string;
  passport_number?: string;
  nationality?: string;
  dob?: string;
  type?: string;
};

type Booking = {
  id: number;
  booking_code: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  tour_name?: string;
  tour_date?: string | null;
  booking_status: string;
  payment_status: string;
  final_amount?: string | number;
  amount_paid?: string | number;
  amount_pending?: string | number;
  currency?: string;
  adults?: number;
  children?: number;
  notes?: string;
  booking_source?: string;
  created_at?: string;
  travellers?: Traveller[];
};

type Invoice = {
  id: number;
  invoice_number?: string;
  download_url?: string;
};

function money(value: string | number | undefined, currency = "AED") {
  if (!value && value !== 0) return "—";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}

function dateText(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function statusClass(status?: string) {
  const v = (status || "").toLowerCase();
  if (["paid", "completed", "confirmed", "active"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "partial", "partially_paid", "pending_payment"].includes(v)) return "bg-amber-50 text-amber-700";
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
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7EAF0] py-3 last:border-b-0">
      <span className="text-sm text-[#667085]">{label}</span>
      <span className="text-sm font-bold text-[#121826]">{value ?? "—"}</span>
    </div>
  );
}

export default function AgentBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
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
  }, [id]);

  async function handleDownloadInvoice() {
    if (!invoice) return;
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
      // fallback — open in new tab
      if (invoice.download_url) window.open(invoice.download_url, "_blank");
    } finally {
      setDownloadLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[#667085]">
          <Loader2 size={18} className="animate-spin text-orange-600" /> Loading booking…
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-6 md:p-8">
        <Link href="/agent/bookings" className="flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-orange-600">
          <ArrowLeft size={15} /> Back to Bookings
        </Link>
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50 py-16 text-center">
          <p className="font-bold text-rose-700">{error || "Booking not found."}</p>
        </div>
      </div>
    );
  }

  const travellers = booking.travellers ?? [];

  const travellerColumns: DataTableColumn<Traveller>[] = [
    { key: "index", header: "#", render: (_, idx) => idx + 1, className: "text-[#667085]" },
    { key: "name", header: "Name", className: "font-bold text-[#121826]", render: (t) => t.name ?? t.full_name ?? "—" },
    { key: "type", header: "Type", className: "hidden capitalize text-[#667085] sm:table-cell", render: (t) => t.type ?? "adult" },
    { key: "nationality", header: "Nationality", className: "hidden text-[#667085] md:table-cell", render: (t) => t.nationality ?? "—" },
    { key: "passport", header: "Passport", className: "hidden text-[#667085] lg:table-cell", render: (t) => t.passport_number ?? "—" },
  ];

  return (
    <div className="p-6 md:p-8">
      <Link href="/agent/bookings" className="mb-5 inline-flex items-center gap-1.5 rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-sm font-bold text-[#344054] hover:bg-[#F3F8FC] transition-all">
        <ArrowLeft size={15} /> Back to bookings
      </Link>

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 to-orange-700 p-7 text-white shadow-xl shadow-orange-200/60 md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-sm font-bold text-orange-100">Booking details</p>
            <h1 className="mt-1 text-2xl font-black leading-tight md:text-3xl">{booking.booking_code}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill status={booking.booking_status}>{booking.booking_status.replaceAll("_", " ")}</Pill>
              <Pill status={booking.payment_status}>{booking.payment_status.replaceAll("_", " ")}</Pill>
            </div>
          </div>
          {invoice && (
            <button
              type="button"
              onClick={handleDownloadInvoice}
              disabled={downloadLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-orange-700 shadow-sm transition hover:bg-orange-50 disabled:cursor-wait disabled:opacity-70"
            >
              {downloadLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Download Invoice
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Booking Info */}
        <div className="rounded-xl border border-[#E7EAF0] bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-black text-[#121826]">
            <FileText size={16} className="text-orange-600" /> Booking Information
          </h2>
          <div className="mt-4">
            <InfoRow label="Booking Code" value={booking.booking_code} />
            <InfoRow label="Tour" value={booking.tour_name} />
            <InfoRow label="Travel Date" value={dateText(booking.tour_date)} />
            <InfoRow label="Adults" value={booking.adults} />
            <InfoRow label="Children" value={booking.children ?? 0} />
            <InfoRow label="Source" value={booking.booking_source?.replaceAll("_", " ") ?? "—"} />
            <InfoRow label="Created" value={dateText(booking.created_at)} />
            {booking.notes && <InfoRow label="Notes" value={booking.notes} />}
          </div>
        </div>

        {/* Customer & Payment Info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#E7EAF0] bg-white p-6 shadow-sm">
            <h2 className="text-base font-black text-[#121826]">Customer</h2>
            <div className="mt-4">
              <InfoRow label="Name" value={booking.customer_name} />
              <InfoRow label="Email" value={booking.customer_email} />
              <InfoRow label="Phone" value={booking.customer_phone} />
            </div>
          </div>

          <div className="rounded-xl border border-[#E7EAF0] bg-white p-6 shadow-sm">
            <h2 className="text-base font-black text-[#121826]">Payment</h2>
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
            </div>
          </div>
        </div>
      </div>

      {/* Travellers */}
      {travellers.length > 0 && (
        <div className="mt-6 rounded-xl border border-[#E7EAF0] bg-white p-6 shadow-sm">
          <h2 className="text-base font-black text-[#121826] mb-4">Travellers ({travellers.length})</h2>
          <div className="p-0">
            <DataTable
              ariaLabel="Travellers"
              columns={travellerColumns}
              rows={travellers}
            />
          </div>
        </div>
      )}
    </div>
  );
}
