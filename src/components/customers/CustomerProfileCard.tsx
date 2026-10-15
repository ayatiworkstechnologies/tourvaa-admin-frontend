"use client";

import { useState } from "react";
import {
  LuCalendar as Calendar,
  LuCircleCheckBig as CheckCircle2,
  LuCircleX as XCircle,
  LuCopy as Copy,
  LuHash as Hash,
  LuMail as Mail,
  LuMapPin as MapPin,
  LuPhone as Phone,
  LuUsers as Users,
} from "react-icons/lu";

import StatusBadge from "@/components/operations/StatusBadge";
import { Customer } from "@/lib/api/services/customerService";
import { useToast } from "@/hooks/useToast";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatDate(iso?: string | null) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso?: string | null) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function CustomerProfileCard({ customer }: { customer: Customer }) {
  const toast = useToast();
  const [, setCopiedKey] = useState<string | null>(null);

  const copyValue = (value: string, label: string) => {
    if (!value) return;
    void navigator.clipboard.writeText(value);
    setCopiedKey(label);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const location = [
    customer.city_name || customer.city,
    customer.state_name || customer.state,
    customer.country_name || customer.country,
  ]
    .filter(Boolean)
    .join(", ");

  const rawCode = customer.customer_code || String(customer.id);
  const displayCode = rawCode.startsWith("CUST-") ? rawCode : `CUST-${rawCode}`;

  const fullAddress = [
    customer.address_line_1 || customer.address,
    customer.address_line_2,
    customer.city_name || customer.city,
    customer.state_name || customer.state,
    customer.postal_code || customer.pincode,
    customer.country_name || customer.country,
  ]
    .filter(Boolean)
    .join(", ");

  const formattedDob = formatDate(customer.date_of_birth);
  const formattedJoined = formatDate(customer.created_at);
  const formattedLastLogin = formatDateTime(customer.last_login_at);

  return (
    <section className="overflow-hidden rounded-2xl border border-dash-border-soft bg-white shadow-xs">
      <div className="h-2 bg-gradient-to-r from-dash-brand via-sky-400 to-indigo-500" />

      <div className="p-6">
        {/* Top Profile Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-dash-brand to-dash-brand-hover text-xl font-black text-white shadow-[0_4px_12px_rgb(67,169,246,0.35)]">
            {customer.profile_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customer.profile_image}
                alt={`${customer.full_name} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              initials(customer.full_name)
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-black tracking-tight text-dash-text">
                {customer.full_name}
              </h2>
              <StatusBadge value={customer.status} />

              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-700 capitalize">
                {customer.customer_type ? customer.customer_type.replace(/_/g, " ") : "Direct Traveler"}
              </span>

              {customer.agent_id && (
                <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                  <Users size={12} /> Agent Client #{customer.agent_id}
                </span>
              )}

              {customer.email_verified ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={12} /> Email Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Email Unverified
                </span>
              )}

              {customer.phone_verified && (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={12} /> Phone Verified
                </span>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-dash-muted">
              <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-dash-text bg-slate-100 rounded-lg px-2.5 py-1">
                <Hash size={13} className="text-dash-subtle" />
                {displayCode}
                <button
                  type="button"
                  onClick={() => copyValue(displayCode, "Customer ID")}
                  className="ml-1 text-dash-subtle hover:text-dash-brand transition-colors"
                  title="Copy Customer ID"
                >
                  <Copy size={11} />
                </button>
              </div>

              {customer.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} className="text-dash-subtle shrink-0" />
                  <a href={`mailto:${customer.email}`} className="hover:text-dash-brand hover:underline font-medium text-dash-text">
                    {customer.email}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyValue(customer.email, "Email")}
                    className="text-dash-subtle hover:text-dash-brand transition-colors"
                    title="Copy Email"
                  >
                    <Copy size={11} />
                  </button>
                </span>
              )}

              {customer.phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} className="text-dash-subtle shrink-0" />
                  <a href={`tel:${customer.phone}`} className="hover:text-dash-brand font-medium text-dash-text">
                    {customer.phone}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyValue(customer.phone, "Phone")}
                    className="text-dash-subtle hover:text-dash-brand transition-colors"
                    title="Copy Phone"
                  >
                    <Copy size={11} />
                  </button>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs italic text-dash-subtle">
                  <Phone size={13} className="text-dash-subtle shrink-0" />
                  No phone on file
                </span>
              )}

              {location ? (
                <span className="inline-flex items-center gap-1.5 text-dash-text font-medium">
                  <MapPin size={14} className="text-dash-subtle shrink-0" />
                  {location}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs italic text-dash-subtle">
                  <MapPin size={13} className="text-dash-subtle shrink-0" />
                  Location unassigned
                </span>
              )}

              {formattedJoined && (
                <span className="inline-flex items-center gap-1.5 text-xs text-dash-subtle">
                  <Calendar size={13} className="text-dash-subtle shrink-0" />
                  Joined {formattedJoined}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Blocked Reason Alert */}
        {(customer.is_blocked || customer.status === "blocked" || customer.blocked_reason) && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800">
            <XCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
            <div>
              <p className="font-bold text-rose-900">
                Account Blocked {customer.blocked_at ? `on ${formatDateTime(customer.blocked_at)}` : ""}
              </p>
              <p className="mt-0.5 text-rose-700">
                <strong>Reason:</strong> {customer.blocked_reason || "Administrative block applied."}
              </p>
            </div>
          </div>
        )}

        {/* Detailed Demographics & Credentials Grid */}
        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-dash-bg p-3.5">
            <p className="text-[11px] font-bold uppercase text-dash-subtle">Date of Birth</p>
            {formattedDob ? (
              <p className="mt-1 text-sm font-bold text-dash-text">{formattedDob}</p>
            ) : (
              <p className="mt-1 text-xs font-medium italic text-dash-muted">Not provided</p>
            )}
          </div>

          <div className="rounded-xl bg-dash-bg p-3.5">
            <p className="text-[11px] font-bold uppercase text-dash-subtle">Gender</p>
            {customer.gender ? (
              <p className="mt-1 text-sm font-bold text-dash-text capitalize">{customer.gender}</p>
            ) : (
              <p className="mt-1 text-xs font-medium italic text-dash-muted">Not specified</p>
            )}
          </div>

          <div className="rounded-xl bg-dash-bg p-3.5">
            <p className="text-[11px] font-bold uppercase text-dash-subtle">Last Login</p>
            {formattedLastLogin ? (
              <p className="mt-1 text-sm font-bold text-dash-text">{formattedLastLogin}</p>
            ) : (
              <p className="mt-1 text-xs font-medium italic text-dash-muted">Never logged in</p>
            )}
          </div>

          <div className="rounded-xl bg-dash-bg p-3.5">
            <p className="text-[11px] font-bold uppercase text-dash-subtle">Login IP Address</p>
            {customer.last_login_ip ? (
              <div className="mt-1 flex items-center gap-1.5 font-mono text-sm font-bold text-dash-text">
                <span>{customer.last_login_ip}</span>
                <button
                  type="button"
                  onClick={() => copyValue(customer.last_login_ip!, "IP Address")}
                  className="text-dash-subtle hover:text-dash-brand transition-colors"
                  title="Copy IP"
                >
                  <Copy size={11} />
                </button>
              </div>
            ) : (
              <p className="mt-1 text-xs font-medium italic text-dash-muted">No IP recorded</p>
            )}
          </div>

          <div className="sm:col-span-2 lg:col-span-4 rounded-xl bg-dash-bg p-3.5">
            <p className="text-[11px] font-bold uppercase text-dash-subtle">Registered Address</p>
            {fullAddress ? (
              <p className="mt-1 text-sm font-semibold text-dash-text">{fullAddress}</p>
            ) : (
              <p className="mt-1 text-xs font-medium italic text-dash-muted">
                No registered physical address provided on file.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
