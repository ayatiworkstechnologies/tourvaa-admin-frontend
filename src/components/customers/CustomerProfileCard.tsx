"use client";

import { LuCalendar as Calendar, LuMail as Mail, LuMapPin as MapPin, LuPhone as Phone } from "react-icons/lu";

import { Customer } from "@/lib/api/services/customerService";

const statusClass: Record<Customer["status"], string> = {
  active: "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200",
  inactive: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  blocked: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200",
};

const statusDot: Record<Customer["status"], string> = {
  active: "bg-emerald-500",
  inactive: "bg-amber-500",
  blocked: "bg-red-500",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function CustomerProfileCard({ customer }: { customer: Customer }) {
  const location = [customer.city_name || customer.city, customer.state_name || customer.state, customer.country_name || customer.country]
    .filter(Boolean)
    .join(", ");

  const metaDetails = [
    ["Customer ID", customer.customer_code || String(customer.id)],
    ["Address", customer.address || "-"],
    ["Created", customer.created_at ? new Date(customer.created_at).toLocaleString() : "-"],
    ["Last login", customer.last_login_at ? new Date(customer.last_login_at).toLocaleString() : "-"],
    ["Login IP", customer.last_login_ip || "-"],
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-dash-border-soft bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
      <div className="h-2 bg-gradient-to-r from-dash-brand to-dash-brand-hover" />

      <div className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-dash-brand to-dash-brand-hover text-xl font-black text-white shadow-[0_4px_12px_rgb(67,169,246,0.35)]">
              {initials(customer.full_name)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-black tracking-tight text-dash-text">{customer.full_name}</h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass[customer.status]}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot[customer.status]}`} />
                  {customer.status}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-dash-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} className="text-dash-subtle" />
                  {customer.email}
                </span>
                {customer.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={14} className="text-dash-subtle" />
                    {customer.phone}
                  </span>
                )}
                {location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-dash-subtle" />
                    {location}
                  </span>
                )}
                {customer.created_at && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={14} className="text-dash-subtle" />
                    Joined {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {customer.blocked_reason && (
          <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 ring-1 ring-inset ring-red-100">
            Blocked reason: {customer.blocked_reason}
          </p>
        )}

        <div className="mt-6 grid gap-3 border-t border-[#F0F3F8] pt-6 sm:grid-cols-2 xl:grid-cols-5">
          {metaDetails.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-bold uppercase tracking-wide text-dash-subtle">{label}</p>
              <p className="mt-1 break-words text-sm font-bold text-dash-text">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



