"use client";

import { useEffect, useState } from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { Payment, getPayments } from "@/lib/services/paymentService";

const PAGE_SIZE = 10;

function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-[#F2F4F7] px-3 py-1 text-xs font-bold capitalize text-[#475467]">
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let shouldUpdateState = true;

    async function fetchPayments() {
      setIsLoading(true);
      try {
        const paymentResponse = await getPayments({
          page: currentPage,
          limit: PAGE_SIZE,
          search: searchTerm,
        });

        if (!shouldUpdateState) return;

        setPayments(paymentResponse.items || []);
        setTotalPayments(paymentResponse.total || 0);
        setTotalPages(paymentResponse.total_pages || 1);
        setErrorMessage("");
      } catch {
        if (shouldUpdateState) setErrorMessage("Could not load payments.");
      } finally {
        if (shouldUpdateState) setIsLoading(false);
      }
    }

    void fetchPayments();

    return () => {
      shouldUpdateState = false;
    };
  }, [currentPage, searchTerm]);

  const paymentColumns: DataTableColumn<Payment>[] = [
    { key: "payment_code", header: "Payment" },
    { key: "booking_id", header: "Booking" },
    { key: "payment_method", header: "Method" },
    { key: "payment_type", header: "Type" },
    {
      key: "payment_status",
      header: "Status",
      render: (payment) => <PaymentStatusBadge status={payment.payment_status} />,
    },
    { key: "authorized_amount", header: "Authorized" },
    { key: "captured_amount", header: "Captured" },
    { key: "refunded_amount", header: "Refunded" },
    { key: "pending_amount", header: "Pending" },
  ];

  function updateSearchTerm(nextSearchTerm: string) {
    setCurrentPage(1);
    setSearchTerm(nextSearchTerm);
  }

  return (
    <ModuleWrapper title="Payments" requiredPermission="payments.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#121826]">Payments</h1>
          <p className="text-sm text-[#667085]">
            Monitor authorizations, captures, refunds, holds, and transaction history.
          </p>
        </div>

        <DataTable
          ariaLabel="Payments"
          columns={paymentColumns}
          rows={payments}
          loading={isLoading}
          error={errorMessage}
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={totalPayments}
          totalPages={totalPages}
          search={searchTerm}
          onSearchChange={updateSearchTerm}
          onPageChange={setCurrentPage}
          emptyTitle="No payments found"
        />
      </div>
    </ModuleWrapper>
  );
}
