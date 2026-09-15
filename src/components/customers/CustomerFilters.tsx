"use client";

import { LuSearch as Search } from "react-icons/lu";
import { useGeoCountries } from "@/hooks/useGeo";
import DatePicker from "@/components/ui/DatePicker";

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

const STATUS_VIEWS = ["all", "active", "inactive", "blocked"] as const;

export default function CustomerFilters({ filters, onChange }: Props) {
  const { countries } = useGeoCountries();
  const currentStatusView = filters.status || "all";

  return (
    <div className="space-y-3">
      {/* Status tab strip - matches Agent Management's status filter pattern
          (see ReviewListPage.tsx) for UI consistency between the two modules.
          No card styling of its own - the caller (customers/page.tsx) wraps
          this whole component in one bordered filter panel, same as Agent's
          combined status-tabs + filter-grid section. */}
      <nav className="flex flex-wrap gap-2" aria-label="Customer status filters">
        {STATUS_VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => onChange("status", view === "all" ? "" : view)}
            className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${currentStatusView === view ? "bg-dash-brand text-white" : "text-dash-muted hover:bg-dash-bg"}`}
          >
            {view}
          </button>
        ))}
      </nav>

      <div className="overflow-x-auto border-t border-dash-border-soft pt-3 pb-2">
        <div className="grid gap-3 grid-cols-[minmax(240px,1.4fr)_repeat(6,minmax(130px,1fr))]">
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

          <DatePicker value={filters.start_date} maxDate={filters.end_date || undefined} onChange={(date) => onChange("start_date", date)} placeholder="Start date" />
          <DatePicker value={filters.end_date} minDate={filters.start_date || undefined} onChange={(date) => onChange("end_date", date)} placeholder="End date" align="right" />

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
    </div>
  );
}
