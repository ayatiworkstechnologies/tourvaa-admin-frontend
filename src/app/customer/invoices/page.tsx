"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuDownload as Download, LuReceiptText as ReceiptText } from "react-icons/lu";
import api from "@/lib/api/client";
import { downloadInvoicePdf, invoiceActionError } from "@/lib/api/services/invoiceService";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { CustomerPageHeader, CustomerPageShell } from "@/components/customer/CustomerPage";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/useToast";

type Invoice = {
  id: number;
  invoice_number?: string;
  booking_id?: number;
  booking_code?: string;
  status?: string;
  invoice_type?: string;
  total_amount?: string | number;
  grand_total?: string | number;
  currency?: string;
  created_at?: string;
  amount_due?: string | number;
  balance_due_date?: string;
};

function dateText(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CustomerInvoicesPage() {
  const { formatExact } = useCurrency();
  const toast = useToast();
  const money = (value: string | number | undefined, currency = "USD") =>
    value == null || value === "" ? "-" : formatExact(value, currency);
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const limit = 10;

  async function handleDownload(invoice: Invoice) {
    setDownloadingId(invoice.id);
    try {
      await downloadInvoicePdf(invoice.id, `${invoice.invoice_number || `invoice-${invoice.id}`}.pdf`, true);
    } catch (error) {
      toast.error(invoiceActionError(error, "Could not download the invoice PDF."));
    } finally {
      setDownloadingId(null);
    }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get("/customer/invoices", { params: { page, limit } })
      .then((res) => {
        if (!active) return;
        setRows(res.data?.items ?? res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
      })
      .catch(() => active && setRows([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [page]);

  const columns: DataTableColumn<Invoice>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (page - 1) * limit + index + 1,
    },
    { key: "invoice", header: "Invoice", render: (i) => i.invoice_number || `#${i.id}`, className: "font-bold text-dash-text" },
    { key: "booking", header: "Booking", render: (i) => i.booking_id ? <Link className="font-semibold text-dash-brand hover:underline" href={`/customer/bookings/${i.booking_id}`}>{i.booking_code || `Booking #${i.booking_id}`}</Link> : "-" },
    { key: "status", header: "Status", render: (i) => <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-bold capitalize text-slate-700">{(i.status || "generated").replaceAll("_", " ")}</span> },
    { key: "type", header: "Type", render: (i) => (i.invoice_type || "tax_invoice").replaceAll("_", " "), className: "capitalize" },
    { key: "amount", header: "Amount", render: (i) => money(i.grand_total ?? i.total_amount, i.currency), className: "text-right font-bold text-dash-text" },
    { key: "due", header: "Balance", render: (i) => money(i.amount_due, i.currency), className: "text-right" },
    { key: "due_date", header: "Due date", render: (i) => i.amount_due && Number(i.amount_due) > 0 ? dateText(i.balance_due_date) : "Fully paid", className: "hidden text-dash-muted lg:table-cell" },
    { key: "date", header: "Date", render: (i) => dateText(i.created_at), className: "hidden text-dash-muted md:table-cell" },
  ];

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Invoices"
        description="View and access invoices generated for your confirmed Tourvaa bookings."
        icon={ReceiptText}
        action={{ label: "View Bookings", href: "/customer/bookings" }}
      />
      <div className="mt-4">
        <DataTable ariaLabel="Customer invoices" columns={columns} rows={rows} loading={loading} page={page} pageSize={limit} total={total} totalPages={Math.ceil(total / limit) || 1} onPageChange={setPage} emptyTitle="No invoices found" emptyDescription="Invoices will appear here after booking confirmation." actions={(i) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleDownload(i)}
              disabled={downloadingId === i.id}
              className="inline-flex items-center gap-1 rounded-lg border border-[#D5E1EF] bg-white px-3 py-1.5 text-xs font-bold text-[#315174] hover:border-blue-300 hover:text-[#0865D9] disabled:opacity-60"
            >
              <Download size={13} />
              {downloadingId === i.id ? "Downloading..." : "PDF"}
            </button>
            {i.booking_id ? <Link href={`/customer/bookings/${i.booking_id}`} className="inline-flex items-center gap-1 rounded-lg border border-[#D5E1EF] bg-white px-3 py-1.5 text-xs font-bold text-[#315174] hover:border-blue-300 hover:text-[#0865D9]">Booking</Link> : null}
          </div>
        )} />
      </div>
    </CustomerPageShell>
  );
}
