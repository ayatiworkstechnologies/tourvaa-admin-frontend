"use client";

import Link from "next/link";
import { LuEye as Eye, LuKeyRound as KeyRound, LuLock as Lock, LuLockOpen as Unlock } from "react-icons/lu";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import StatusBadge from "@/components/operations/StatusBadge";
import { Customer } from "@/lib/api/services/customerService";
import { useCurrency } from "@/hooks/useCurrency";

type Props = {
  customers: Customer[];
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
  loading?: boolean;
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
  loading,
  onPageChange,
  savingId,
  canBlock,
  canUnblock,
  canReset,
  onBlock,
  onUnblock,
  onReset,
}: Props) {
  const { formatExact: money } = useCurrency();
  const columns: DataTableColumn<Customer>[] = [
    {
      key: "no",
      header: "No",
      className: "w-16 font-bold text-slate-400 text-center",
      render: (_, index) => (
        <span className="font-mono text-xs text-slate-500">
          {(page - 1) * limit + index + 1}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (customer) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
            {(customer.full_name || "C").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/customers/${customer.id}`}
              className="font-bold text-slate-900 hover:text-blue-600 transition block truncate"
            >
              {customer.full_name || "Unnamed"}
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
              <span className="font-mono text-[11px] text-slate-400 font-medium">
                {customer.customer_code || `CUS-${customer.id}`}
              </span>
              {customer.email && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="truncate max-w-[180px]">{customer.email}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "text-slate-600 font-mono text-xs whitespace-nowrap",
      render: (customer) => customer.phone || "—",
    },
    {
      key: "country",
      header: "Country",
      className: "text-slate-700 whitespace-nowrap",
      render: (customer) => customer.country_name || customer.country || "—",
    },
    {
      key: "status",
      header: "Status",
      className: "whitespace-nowrap",
      render: (customer) => <StatusBadge value={customer.status} />,
    },
    {
      key: "tours",
      header: "Bookings",
      className: "whitespace-nowrap",
      render: (customer) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 tabular-nums">
            {customer.total_bookings ?? 0}
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            ({customer.completed_tours ?? 0} done · {customer.upcoming_tours ?? 0} up)
          </span>
        </div>
      ),
    },
    {
      key: "paid",
      header: "Paid",
      className: "font-bold text-emerald-600 tabular-nums whitespace-nowrap",
      render: (customer) => money(customer.amount_paid || 0),
    },
    {
      key: "pending",
      header: "Pending",
      className: "font-bold text-amber-700 tabular-nums whitespace-nowrap",
      render: (customer) => money(customer.amount_pending || 0),
    },
    {
      key: "created",
      header: "Created",
      className: "text-slate-500 text-xs whitespace-nowrap tabular-nums",
      render: (customer) =>
        customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "—",
    },
  ];

  return (
    <DataTable
      ariaLabel="Customers table"
      columns={columns}
      rows={customers}
      loading={loading}
      page={page}
      pageSize={limit}
      total={total}
      totalPages={totalPages}
      onPageChange={onPageChange}
      emptyTitle="No customers found."
      actions={(customer) => (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          <Link
            href={`/admin/customers/${customer.id}`}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
            aria-label="View customer"
            title="View customer"
          >
            <Eye size={13} className="text-slate-400" />
            <span>View</span>
          </Link>
          {canReset && (
            <button
              type="button"
              disabled={savingId === customer.id}
              onClick={() => onReset(customer)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-sky-50 hover:border-sky-200 hover:text-sky-600 transition disabled:opacity-50"
              aria-label="Reset password"
              title="Reset password"
            >
              <KeyRound size={14} />
            </button>
          )}
          {customer.is_blocked
            ? canUnblock && (
                <button
                  type="button"
                  disabled={savingId === customer.id}
                  onClick={() => onUnblock(customer)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-2xs hover:bg-emerald-100 transition"
                  aria-label="Unblock customer"
                  title="Unblock customer"
                >
                  <Unlock size={14} />
                </button>
              )
            : canBlock && (
                <button
                  type="button"
                  disabled={savingId === customer.id}
                  onClick={() => onBlock(customer)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-2xs hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition"
                  aria-label="Block customer"
                  title="Block customer"
                >
                  <Lock size={14} />
                </button>
              )}
        </div>
      )}
    />
  );
}

