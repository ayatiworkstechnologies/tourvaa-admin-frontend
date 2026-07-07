"use client";

import { LuBuilding2 as Building2, LuCalendar as Calendar, LuHash as Hash, LuMail as Mail, LuMapPin as MapPin, LuPhone as Phone } from "react-icons/lu";

import StatusBadge from "@/components/operations/StatusBadge";

type Props = {
  name: string;
  code?: string;
  entityType?: string;
  countryName?: string;
  cityName?: string;
  yearsInOperation?: number;
  status: string;
  approvalStatus: string;
  rejectionReason?: string | null;
  adminComments?: string | null;
  contactEmail?: string;
  contactPhone?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function ReviewProfileHero({
  name,
  code,
  entityType,
  countryName,
  cityName,
  yearsInOperation,
  status,
  approvalStatus,
  rejectionReason,
  adminComments,
  contactEmail,
  contactPhone,
}: Props) {
  const location = [cityName, countryName].filter(Boolean).join(", ");

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E9EDF3] bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
      <div className="h-2 bg-gradient-to-r from-[#43A9F6] to-[#2F9FE9]" />

      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-[#43A9F6] to-[#2F9FE9] text-xl font-black text-white shadow-[0_4px_12px_rgb(67,169,246,0.35)]">
            {initials(name)}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-black tracking-tight text-[#121826]">{name}</h2>
              <StatusBadge value={approvalStatus} />
              <StatusBadge value={status} />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-[#667085]">
              {code && (
                <span className="inline-flex items-center gap-1.5">
                  <Hash size={14} className="text-[#98A2B3]" />
                  {code}
                </span>
              )}
              {entityType && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 size={14} className="text-[#98A2B3]" />
                  {entityType}
                </span>
              )}
              {contactEmail && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} className="text-[#98A2B3]" />
                  {contactEmail}
                </span>
              )}
              {contactPhone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} className="text-[#98A2B3]" />
                  {contactPhone}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#98A2B3]" />
                  {location}
                </span>
              )}
              {Boolean(yearsInOperation) && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#98A2B3]" />
                  {yearsInOperation} yrs in operation
                </span>
              )}
            </div>
          </div>
        </div>

        {rejectionReason && (
          <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 ring-1 ring-inset ring-red-100">
            Rejection reason: {rejectionReason}
          </p>
        )}
        {!rejectionReason && adminComments && (
          <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 ring-1 ring-inset ring-amber-100">
            Admin comments: {adminComments}
          </p>
        )}
      </div>
    </section>
  );
}
