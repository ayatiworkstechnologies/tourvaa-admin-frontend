"use client";

import { Customer } from "@/lib/services/customerService";

const statusClass: Record<Customer["status"], string> = {
  active: "bg-emerald-50 text-emerald-600",
  inactive: "bg-amber-50 text-amber-700",
  blocked: "bg-red-50 text-red-600",
};

export default function CustomerProfileCard({ customer }: { customer: Customer }) {
  const details = [
    ["Customer ID", customer.customer_code || String(customer.id)],
    ["Email", customer.email],
    ["Phone", customer.phone || "-"],
    ["Country", customer.country || "-"],
    ["City", customer.city || "-"],
    ["Address", customer.address || "-"],
    ["Created", customer.created_at ? new Date(customer.created_at).toLocaleString() : "-"],
    ["Last login", customer.last_login_at ? new Date(customer.last_login_at).toLocaleString() : "-"],
  ];

  return (
    <section className="rounded-xl border border-[#E7EAF0] bg-white p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-[#121826]">{customer.full_name}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[customer.status]}`}>
              {customer.status}
            </span>
          </div>
          {customer.blocked_reason && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              Blocked reason: {customer.blocked_reason}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {details.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[#F7F9FC] p-4">
            <p className="text-xs font-bold uppercase text-[#98A2B3]">{label}</p>
            <p className="mt-2 break-words text-sm font-bold text-[#121826]">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
