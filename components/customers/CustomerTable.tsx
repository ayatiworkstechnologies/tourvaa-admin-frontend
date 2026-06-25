"use client";

import Link from "next/link";
import { Eye, KeyRound, Lock, Unlock } from "lucide-react";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { Customer } from "@/lib/services/customerService";

const statusClass: Record<Customer["status"], string> = {
  active: "bg-emerald-50 text-emerald-600",
  inactive: "bg-amber-50 text-amber-700",
  blocked: "bg-red-50 text-red-600",
};

type Props = {
  customers: Customer[];
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  savingId?: number | null;
  canBlock?: boolean;
  canUnblock?: boolean;
  canReset?: boolean;
  onBlock: (customer: Customer) => void;
  onUnblock: (customer: Customer) => void;
  onReset: (customer: Customer) => void;
};

export default function CustomerTable({
  customers,
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  savingId,
  canBlock,
  canUnblock,
  canReset,
  onBlock,
  onUnblock,
  onReset,
}: Props) {
  const columns: DataTableColumn<Customer>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-[#667085]",
      render: (_, index) => (page - 1) * limit + index + 1,
    },
    {
      key: "customer",
      header: "Customer",
      render: (customer) => (
        <>
          <Link href={`/admin/customers/${customer.id}`} className="font-bold text-[#121826] hover:text-[#2F9FE9]">
            {customer.customer_code || `CUS-${customer.id}`} - {customer.full_name}
          </Link>
          <p className="mt-1 text-xs text-[#667085]">{customer.email}</p>
        </>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "text-[#667085]",
      render: (customer) => customer.phone || "-",
    },
    {
      key: "country",
      header: "Country",
      className: "text-[#667085]",
      render: (customer) => customer.country_name || customer.country || "-",
    },
    {
      key: "status",
      header: "Status",
      render: (customer) => (
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[customer.status]}`}>
          {customer.status}
        </span>
      ),
    },
    {
      key: "tours",
      header: "Tours",
      className: "text-[#667085]",
      render: (customer) => (
        <>
          <span className="font-bold text-[#121826]">{customer.total_bookings}</span>
          <span className="ml-2 text-xs">
            C {customer.completed_tours} / X {customer.cancelled_tours} / U {customer.upcoming_tours}
          </span>
        </>
      ),
    },
    {
      key: "paid",
      header: "Paid",
      className: "font-bold text-emerald-600",
      render: (customer) => `$${Number(customer.amount_paid || 0).toLocaleString()}`,
    },
    {
      key: "pending",
      header: "Pending",
      className: "font-bold text-amber-700",
      render: (customer) => `$${Number(customer.amount_pending || 0).toLocaleString()}`,
    },
    {
      key: "created",
      header: "Created",
      className: "text-[#667085]",
      render: (customer) => customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "-",
    },
  ];

  return (
    <DataTable
      ariaLabel="Customers table"
      columns={columns}
      rows={customers}
      page={page}
      pageSize={limit}
      total={total}
      totalPages={totalPages}
      onPageChange={onPageChange}
      emptyTitle="No customers found."
        actions={(customer) => (
          <div className="flex justify-end gap-2">
            <Link
              href={`/admin/customers/${customer.id}`}
              className="rounded-lg border border-[#E7EAF0] p-2 text-[#667085] hover:bg-sky-50 hover:text-[#2F9FE9]"
              title="View customer"
            >
              <Eye size={15} />
            </Link>
            {canReset && (
              <button
                type="button"
                disabled={savingId === customer.id}
                onClick={() => onReset(customer)}
                className="rounded-lg border border-[#E7EAF0] p-2 text-[#667085] hover:bg-sky-50 hover:text-[#2F9FE9] disabled:opacity-60"
                title="Reset password"
              >
                <KeyRound size={15} />
              </button>
            )}
            {customer.is_blocked
              ? canUnblock && (
                  <button
                    type="button"
                    disabled={savingId === customer.id}
                    onClick={() => onUnblock(customer)}
                    className="rounded-lg border border-[#E7EAF0] p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-60"
                    title="Unblock customer"
                  >
                    <Unlock size={15} />
                  </button>
                )
              : canBlock && (
                  <button
                    type="button"
                    disabled={savingId === customer.id}
                    onClick={() => onBlock(customer)}
                    className="rounded-lg border border-[#E7EAF0] p-2 text-red-600 hover:bg-red-50 disabled:opacity-60"
                    title="Block customer"
                  >
                    <Lock size={15} />
                  </button>
                )}
          </div>
        )}
    />
  );
}

