"use client";

import { useEffect, useState } from "react";
import { LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuDownload as Download, LuFileText as FileText, LuLoaderCircle as Loader2 } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type Invoice = {
  id: number;
  invoice_number?: string;
  booking_code?: string;
  customer_name?: string;
  amount?: string | number;
  currency?: string;
  status?: string;
  issued_at?: string;
  due_date?: string;
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
  if (["paid", "completed"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "draft", "unpaid"].includes(v)) return "bg-amber-50 text-amber-700";
  if (["overdue", "cancelled"].includes(v)) return "bg-rose-50 text-rose-700";
  return "bg-slate-50 text-slate-700";
}

function Pill({ status, children }: { status?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClass(status)}`}>
      {children}
    </span>
  );
}

export default function AgentInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [downloading, setDownloading] = useState<number | null>(null);
  const limit = 10;

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/invoices", { params: { limit, page } });
        if (!active) return;
        setInvoices(res.data?.items ?? res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
      } catch {
        if (active) setInvoices([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [page]);

  const totalPages = Math.ceil(total / limit) || 1;

  async function downloadInvoice(inv: Invoice) {
    setDownloading(inv.id);
    try {
      const res = await api.get(`/invoices/${inv.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${inv.invoice_number ?? inv.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      if (inv.download_url) window.open(inv.download_url, "_blank");
    } finally {
      setDownloading(null);
    }
  }

  const columns: DataTableColumn<Invoice>[] = [
    { key: "invoice_number", header: "Invoice #", className: "font-bold text-dash-text", render: (inv) => inv.invoice_number ?? `INV-${inv.id}` },
    { key: "booking", header: "Booking", className: "hidden text-dash-muted sm:table-cell", render: (inv) => inv.booking_code ?? "—" },
    { key: "customer", header: "Customer", className: "hidden text-dash-muted md:table-cell", render: (inv) => inv.customer_name ?? "—" },
    { key: "date", header: "Date", className: "hidden text-dash-muted lg:table-cell", render: (inv) => dateText(inv.issued_at) },
    { key: "amount", header: "Amount", className: "text-right font-bold text-dash-text", render: (inv) => money(inv.amount, inv.currency) },
    { key: "status", header: "Status", render: (inv) => <Pill status={inv.status}>{inv.status ?? "pending"}</Pill> },
  ];

  return (
    <div className="p-6 md:p-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 to-orange-700 p-7 text-white shadow-xl shadow-orange-200/60 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">Invoices</h1>
          <p className="mt-2 max-w-md text-sm font-medium text-orange-100">Download and review invoices for all bookings.</p>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 rounded-xl border border-dash-border bg-white shadow-sm p-0">
        <DataTable
          ariaLabel="Invoices"
          columns={columns}
          rows={invoices}
          loading={loading}
          page={page}
          pageSize={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyTitle="No invoices yet"
          emptyDescription="Invoices will appear here after bookings are confirmed."
          actions={(inv) => (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => downloadInvoice(inv)}
                disabled={downloading === inv.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-orange-700 disabled:cursor-wait disabled:opacity-70"
              >
                {downloading === inv.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Download size={12} />
                )}
                PDF
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
