"use client";

import { useEffect, useState } from "react";
import { LuReceiptText as FileText, LuDownload as Download, LuLoaderCircle as Loader2 } from "react-icons/lu";
import { SupplierPageHeader, SupplierPageShell } from "@/components/supplier/SupplierPage";
import { Invoice, getInvoices, downloadInvoicePdf, invoiceActionError } from "@/lib/api/services/invoiceService";
import { useCurrency } from "@/hooks/useCurrency";

export default function SupplierInvoicesPage() {
  const { format } = useCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getInvoices({ limit: 50 });
      setInvoices(res.items ?? res.data ?? []);
    } catch {
      setError("Could not load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  async function handleDownload(invoice: Invoice) {
    setDownloadingId(invoice.id);
    try {
      await downloadInvoicePdf(invoice.id, `${invoice.invoice_number}.pdf`);
    } catch (downloadError) {
      setError(invoiceActionError(downloadError, "Could not download the invoice PDF."));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <SupplierPageShell>
      <SupplierPageHeader title="Invoices" description="Invoices generated for your completed bookings." icon={FileText} eyebrow="Supplier Finance" />

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-dash-border bg-white" />)}
        </div>
      ) : invoices.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[#D0D5DD] py-16 text-center">
          <FileText size={36} className="mx-auto text-[#D0D5DD]" />
          <p className="mt-4 text-base font-bold text-dash-muted">No invoices yet</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex flex-col gap-3 rounded-xl border border-dash-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-dash-text">{invoice.invoice_number}</p>
                <p className="text-xs text-dash-muted">
                  {invoice.invoice_type} · {invoice.status}
                  {invoice.created_at ? ` · ${new Date(invoice.created_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-black text-dash-text">{format(Number(invoice.total_amount), invoice.currency)}</p>
                <button
                  type="button"
                  disabled={downloadingId === invoice.id}
                  onClick={() => void handleDownload(invoice)}
                  className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2 text-sm font-bold text-dash-body hover:bg-dash-bg disabled:opacity-60"
                >
                  {downloadingId === invoice.id ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SupplierPageShell>
  );
}
