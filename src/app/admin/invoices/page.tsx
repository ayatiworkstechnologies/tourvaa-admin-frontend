"use client";

import { useEffect, useState } from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { Invoice, getInvoices, downloadInvoicePdf, regenerateInvoicePdf } from "@/lib/api/services/invoiceService";
import { useToast } from "@/hooks/useToast";

const PAGE_SIZE = 10;

export default function InvoicesPage() {
  const toast = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);

  async function handleDownload(invoice: Invoice) {
    setDownloadingId(invoice.id);
    try {
      await downloadInvoicePdf(invoice.id, `${invoice.invoice_number || invoice.id}.pdf`);
    } catch {
      toast.error("Could not download invoice PDF.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleRegenerate(invoice: Invoice) {
    setRegeneratingId(invoice.id);
    try {
      const updated = await regenerateInvoicePdf(invoice.id);
      setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? { ...i, pdf_path: updated.pdf_path } : i)));
      toast.success("Invoice PDF regenerated.");
    } catch {
      toast.error("Could not regenerate invoice PDF.");
    } finally {
      setRegeneratingId(null);
    }
  }

  useEffect(() => {
    let shouldUpdateState = true;

    async function fetchInvoices() {
      setIsLoading(true);
      try {
        const invoiceResponse = await getInvoices({ page: currentPage, limit: PAGE_SIZE });

        if (!shouldUpdateState) return;

        setInvoices(invoiceResponse.items || []);
        setTotalInvoices(invoiceResponse.total || 0);
        setTotalPages(invoiceResponse.total_pages || 1);
        setErrorMessage("");
      } catch {
        if (shouldUpdateState) setErrorMessage("Could not load invoices.");
      } finally {
        if (shouldUpdateState) setIsLoading(false);
      }
    }

    void fetchInvoices();

    return () => {
      shouldUpdateState = false;
    };
  }, [currentPage]);

  const invoiceColumns: DataTableColumn<Invoice>[] = [
    { key: "invoice_number", header: "Invoice" },
    { key: "booking_id", header: "Booking" },
    { key: "status", header: "Status" },
    { key: "subtotal_amount", header: "Subtotal" },
    { key: "gst_amount", header: "GST" },
    { key: "total_amount", header: "Total" },
    { key: "amount_due", header: "Due" },
    {
      key: "pdf_path",
      header: "Actions",
      render: (invoice) => (
        <div className="flex items-center gap-2">
          {invoice.pdf_path ? (
            <button
              type="button"
              onClick={() => handleDownload(invoice)}
              disabled={downloadingId === invoice.id}
              className="inline-flex items-center gap-1 rounded-lg border border-dash-border bg-white px-3 py-1.5 text-xs font-bold text-dash-body transition-all hover:bg-[#F3F8FC] disabled:opacity-60"
            >
              {downloadingId === invoice.id ? "Downloading…" : "Download PDF"}
            </button>
          ) : (
            <span className="text-xs text-dash-subtle">Not generated</span>
          )}
          <button
            type="button"
            onClick={() => handleRegenerate(invoice)}
            disabled={regeneratingId === invoice.id}
            title="Re-render the PDF from the invoice's current data"
            className="inline-flex items-center gap-1 rounded-lg border border-dash-border bg-white px-3 py-1.5 text-xs font-bold text-dash-brand transition-all hover:bg-sky-50 disabled:opacity-60"
          >
            {regeneratingId === invoice.id ? "Regenerating…" : invoice.pdf_path ? "Regenerate" : "Generate PDF"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModuleWrapper title="Invoices" requiredPermission="invoices.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Invoices</h1>
          <p className="text-sm text-dash-muted">Generated GST invoices and delivery status.</p>
        </div>

        <DataTable
          ariaLabel="Invoices"
          columns={invoiceColumns}
          rows={invoices}
          loading={isLoading}
          error={errorMessage}
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={totalInvoices}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          emptyTitle="No invoices found"
        />
      </div>
    </ModuleWrapper>
  );
}
