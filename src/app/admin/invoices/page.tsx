"use client";

import { useEffect, useState } from "react";
import { LuX as X } from "react-icons/lu";
import { LuPlus as Plus } from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { Invoice, getInvoices, downloadInvoicePdf, emailInvoice, generateInvoice, invoiceActionError, regenerateInvoicePdf } from "@/lib/api/services/invoiceService";
import { useToast } from "@/hooks/useToast";
import { useCurrency } from "@/hooks/useCurrency";

const PAGE_SIZE = 10;

export default function InvoicesPage() {
  const toast = useToast();
  const { formatExact: format } = useCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
  const [emailingId, setEmailingId] = useState<number | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genBookingId, setGenBookingId] = useState("");
  const [genPaymentId, setGenPaymentId] = useState("");
  const [genInvoiceType, setGenInvoiceType] = useState("auto");
  const [genGstRate, setGenGstRate] = useState("0.18");
  const [generateError, setGenerateError] = useState("");

  const refresh = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const invoiceResponse = await getInvoices({ page, limit: PAGE_SIZE });
      setInvoices(invoiceResponse.items || []);
      setTotalInvoices(invoiceResponse.total || 0);
      setTotalPages(invoiceResponse.total_pages || 1);
      setErrorMessage("");
    } catch {
      setErrorMessage("Could not load invoices.");
    } finally {
      setIsLoading(false);
    }
  };

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault();
    const bookingId = Number(genBookingId);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      setGenerateError("Enter a valid booking ID.");
      return;
    }
    setGenerating(true);
    setGenerateError("");
    try {
      await generateInvoice({
        booking_id: bookingId,
        payment_id: genPaymentId ? Number(genPaymentId) : undefined,
        invoice_type: genInvoiceType,
        gst_rate: Number(genGstRate) || 0,
      });
      toast.success("Invoice generated.");
      setGenerateOpen(false);
      setGenBookingId("");
      setGenPaymentId("");
      setGenInvoiceType("auto");
      setGenGstRate("0.18");
      await refresh();
    } catch (error) {
      setGenerateError(invoiceActionError(error, "Invoice generation failed. Check the booking ID and try again."));
    } finally {
      setGenerating(false);
    }
  }



  async function handleEmail(invoice: Invoice) {
    setEmailingId(invoice.id);
    try {
      const updated = await emailInvoice(invoice.id);
      setInvoices((prev) => prev.map((item) => (item.id === invoice.id ? updated : item)));
      toast.success("Invoice emailed to the customer.");
    } catch {
      toast.error("Invoice email delivery failed. Check Email Logs for details.");
    } finally {
      setEmailingId(null);
    }
  }

  async function handleDownload(invoice: Invoice) {
    setDownloadingId(invoice.id);
    try {
      await downloadInvoicePdf(invoice.id, `${invoice.invoice_number || invoice.id}.pdf`);
    } catch (error) {
      toast.error(invoiceActionError(error, "Could not download invoice PDF."));
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
    { key: "invoice_type", header: "Type", render: (invoice) => invoice.invoice_type.replaceAll("_", " ") },
    { key: "subtotal_amount", header: "Subtotal", render: (invoice) => format(invoice.subtotal_amount, invoice.currency) },
    { key: "gst_amount", header: "GST", render: (invoice) => format(invoice.gst_amount, invoice.currency) },
    { key: "total_amount", header: "Total", render: (invoice) => format(invoice.total_amount, invoice.currency) },
    { key: "amount_due", header: "Due", render: (invoice) => format(invoice.amount_due, invoice.currency) },
    { key: "balance_due_date", header: "Due date", render: (invoice) => invoice.balance_due_date ? new Date(invoice.balance_due_date).toLocaleDateString() : "Fully paid" },
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
          <button
            type="button"
            onClick={() => void handleEmail(invoice)}
            disabled={emailingId === invoice.id || !invoice.pdf_path}
            title={invoice.pdf_path ? "Email this PDF to the customer" : "Generate the PDF before emailing"}
            className="inline-flex items-center gap-1 rounded-lg border border-dash-border bg-white px-3 py-1.5 text-xs font-bold text-dash-brand transition-all hover:bg-sky-50 disabled:opacity-60"
          >
            {emailingId === invoice.id ? "Emailing…" : "Email"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModuleWrapper title="Invoices" requiredPermission="invoices.view">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-dash-text">Invoices</h1>
            <p className="text-sm text-dash-muted">Generated GST invoices and delivery status.</p>
          </div>
          <button
            type="button"
            onClick={() => { setGenerateOpen(true); setGenerateError(""); }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-dash-brand-hover"
          >
            <Plus size={16} /> Generate Invoice
          </button>
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
