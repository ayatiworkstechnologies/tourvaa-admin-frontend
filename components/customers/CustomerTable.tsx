"use client";

import Link from "next/link";
import { Eye, KeyRound, Lock, Unlock } from "lucide-react";

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
  savingId,
  canBlock,
  canUnblock,
  canReset,
  onBlock,
  onUnblock,
  onReset,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
        <thead className="bg-[#F7F9FC] text-xs uppercase text-[#667085]">
          <tr>
            <th className="w-20 px-5 py-4">No</th>
            <th className="px-5 py-4">Customer</th>
            <th className="px-5 py-4">Phone</th>
            <th className="px-5 py-4">Country</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Tours</th>
            <th className="px-5 py-4">Paid</th>
            <th className="px-5 py-4">Pending</th>
            <th className="px-5 py-4">Created</th>
            <th className="px-5 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2F6]">
          {customers.map((customer, index) => (
            <tr key={customer.id} className="hover:bg-[#FAFBFC]">
              <td className="px-5 py-4 font-bold text-[#667085]">
                {(page - 1) * limit + index + 1}
              </td>
              <td className="px-5 py-4">
                <Link href={`/customers/${customer.id}`} className="font-bold text-[#121826] hover:text-[#238DD7]">
                  {customer.customer_code || `CUS-${customer.id}`} · {customer.full_name}
                </Link>
                <p className="mt-1 text-xs text-[#667085]">{customer.email}</p>
              </td>
              <td className="px-5 py-4 text-[#667085]">{customer.phone || "-"}</td>
              <td className="px-5 py-4 text-[#667085]">{customer.country || "-"}</td>
              <td className="px-5 py-4">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[customer.status]}`}>
                  {customer.status}
                </span>
              </td>
              <td className="px-5 py-4 text-[#667085]">
                <span className="font-bold text-[#121826]">{customer.total_bookings}</span>
                <span className="ml-2 text-xs">
                  C {customer.completed_tours} / X {customer.cancelled_tours} / U {customer.upcoming_tours}
                </span>
              </td>
              <td className="px-5 py-4 font-bold text-emerald-600">
                ₹{Number(customer.amount_paid || 0).toLocaleString()}
              </td>
              <td className="px-5 py-4 font-bold text-amber-700">
                ₹{Number(customer.amount_pending || 0).toLocaleString()}
              </td>
              <td className="px-5 py-4 text-[#667085]">
                {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "-"}
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="rounded-lg border border-[#E7EAF0] p-2 text-[#667085] hover:bg-sky-50 hover:text-[#238DD7]"
                    title="View customer"
                  >
                    <Eye size={15} />
                  </Link>
                  {canReset && (
                    <button
                      type="button"
                      disabled={savingId === customer.id}
                      onClick={() => onReset(customer)}
                      className="rounded-lg border border-[#E7EAF0] p-2 text-[#667085] hover:bg-sky-50 hover:text-[#238DD7] disabled:opacity-60"
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
              </td>
            </tr>
          ))}
          {customers.length === 0 && (
            <tr>
              <td colSpan={10} className="px-5 py-12 text-center text-[#98A2B3]">
                No customers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
