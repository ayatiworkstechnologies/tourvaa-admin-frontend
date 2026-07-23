"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuCircleAlert as AlertCircle, LuDownload as Download, LuFileText as FileText, LuLoaderCircle as Loader2, LuRefreshCw as RefreshCw } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { AgentPageHeader, AgentPageShell, AgentSection } from "@/components/agent/AgentPage";

type Invoice = {
  id: number;
  invoice_number?: string;
  booking_id?: number;
  customer_id?: number;
  customer_name?: string;
  booking_code?: string;
  total_amount?: string | number;
  amount_due?: string | number;
  currency?: string;
  status?: string;
  created_at?: string;
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
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const limit = 10;

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/invoices", { params: { limit, page } });
        if (!active) return;
        setInvoices(res.data?.items ?? res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
      } catch {
        if (active) {
          setInvoices([]);
          setTotal(0);
          setError("Invoices could not be loaded. Please retry.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [page, retryKey]);

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
      setError("The invoice PDF could not be downloaded.");
    } finally {
      setDownloading(null);
    }
  }

  const columns: DataTableColumn<Invoice>[] = [
    { key: "invoice_number", header: "Invoice #", className: "font-bold text-dash-text", render: (inv) => inv.invoice_number ?? `INV-${inv.id}` },
    { key: "booking", header: "Booking", className: "hidden text-dash-muted sm:table-cell", render: (inv) => inv.booking_id ? <Link href={`/agent/bookings/${inv.booking_id}`} className="font-bold text-dash-brand hover:underline">{inv.booking_code ?? `Booking #${inv.booking_id}`}</Link> : "-" },
    { key: "customer", header: "Customer", className: "hidden text-dash-muted md:table-cell", render: (inv) => inv.customer_name ?? (inv.customer_id ? `Customer #${inv.customer_id}` : "-") },
    { key: "date", header: "Date", className: "hidden text-dash-muted lg:table-cell", render: (inv) => dateText(inv.created_at) },
    { key: "amount", header: "Amount", className: "text-right font-bold text-dash-text", render: (inv) => money(inv.total_amount, inv.currency) },
    { key: "status", header: "Status", render: (inv) => <Pill status={inv.status}>{inv.status ?? "pending"}</Pill> },
  ];

  return (
    <AgentPageShell>
      <AgentPageHeader title="Invoices" description="Review and download invoices generated for your customer bookings." icon={FileText} eyebrow="Agent Finance" />

      {/* Table */}
      <AgentSection className="mt-4" title="Invoice History" description={`${total} invoice${total === 1 ? "" : "s"} available`}>
        {error && (
          <div className="m-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            <span className="flex items-center gap-2"><AlertCircle size={16} />{error}</span>
            <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs shadow-sm"><RefreshCw size={13} />Retry</button>
          </div>
        )}
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-dash-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-dash-brand-hover disabled:cursor-wait disabled:opacity-70"
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
      </AgentSection>
    </AgentPageShell>
  );
}
