"use client";

import { useEffect, useState } from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { Invoice, getInvoices } from "@/lib/services/invoiceService";

const PAGE_SIZE = 10;

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
    { key: "pdf_path", header: "File", render: (invoice) => (invoice.pdf_path ? "Generated" : "-") },
  ];

  return (
    <ModuleWrapper title="Invoices" requiredPermission="invoices.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#121826]">Invoices</h1>
          <p className="text-sm text-[#667085]">Generated GST invoices and delivery status.</p>
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
