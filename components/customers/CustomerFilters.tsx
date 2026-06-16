"use client";

import { Search } from "lucide-react";
import { countries } from "@/lib/location-options";

export type CustomerFilterState = {
  search: string;
  country: string;
  status: string;
  booking_status: string;
  payment_status: string;
  start_date: string;
  end_date: string;
  sort_by: string;
};

type Props = {
  filters: CustomerFilterState;
  onChange: (key: keyof CustomerFilterState, value: string) => void;
};

export default function CustomerFilters({ filters, onChange }: Props) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.4fr)_repeat(7,minmax(130px,1fr))]">
      <label className="flex items-center gap-2 rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm focus-within:border-[#43A9F6]">
        <Search size={16} className="text-[#98A2B3]" />
        <input
          value={filters.search}
          onChange={(event) => onChange("search", event.target.value)}
          placeholder="Search name, email, phone, ID"
          className="min-w-0 flex-1 border-0 bg-transparent outline-none"
        />
      </label>

      <select
        value={filters.country}
        onChange={(event) => onChange("country", event.target.value)}
        className="rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
      >
        <option value="">All countries</option>
        {countries.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(event) => onChange("status", event.target.value)}
        className="rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
      >
        <option value="">All status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="blocked">Blocked</option>
      </select>

      <select
        value={filters.booking_status}
        onChange={(event) => onChange("booking_status", event.target.value)}
        className="rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
      >
        <option value="">Booking status</option>
        <option value="upcoming">Upcoming</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <select
        value={filters.payment_status}
        onChange={(event) => onChange("payment_status", event.target.value)}
        className="rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
      >
        <option value="">Payment status</option>
        <option value="paid">Paid</option>
        <option value="partial">Partial</option>
        <option value="refunded">Refunded</option>
      </select>

      <input
        type="date"
        value={filters.start_date}
        onChange={(event) => onChange("start_date", event.target.value)}
        className="rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
      />

      <input
        type="date"
        value={filters.end_date}
        onChange={(event) => onChange("end_date", event.target.value)}
        className="rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
      />

      <select
        value={filters.sort_by}
        onChange={(event) => onChange("sort_by", event.target.value)}
        className="rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="name_az">Name A to Z</option>
        <option value="highest_amount_paid">Highest paid</option>
        <option value="highest_pending_amount">Highest pending</option>
      </select>
    </div>
  );
}
