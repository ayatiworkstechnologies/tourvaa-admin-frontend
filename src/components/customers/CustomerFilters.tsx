"use client";

import { LuSearch as Search } from "react-icons/lu";
import { useGeoCountries } from "@/hooks/useGeo";

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
  const { countries } = useGeoCountries();

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid gap-3 grid-cols-[minmax(240px,1.4fr)_repeat(7,minmax(130px,1fr))]">
        <label className="flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm focus-within:border-dash-brand">
          <Search size={16} className="text-dash-subtle" />
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
          className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand"
        >
          <option value="">All countries</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(event) => onChange("status", event.target.value)}
          className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
        </select>

        <select
          value={filters.booking_status}
          onChange={(event) => onChange("booking_status", event.target.value)}
          className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand"
        >
          <option value="">Booking status</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filters.payment_status}
          onChange={(event) => onChange("payment_status", event.target.value)}
          className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand"
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
          className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand"
        />

        <input
          type="date"
          value={filters.end_date}
          onChange={(event) => onChange("end_date", event.target.value)}
          className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand"
        />

        <select
          value={filters.sort_by}
          onChange={(event) => onChange("sort_by", event.target.value)}
          className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name_az">Name A to Z</option>
          <option value="highest_amount_paid">Highest paid</option>
          <option value="highest_pending_amount">Highest pending</option>
        </select>
      </div>
    </div>
  );
}
