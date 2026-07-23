"use client";

import { useEffect, useRef, useState } from "react";
import { LuCircleAlert as AlertCircle, LuRefreshCw as RefreshCw, LuSearch as Search, LuUserPlus as UserPlus, LuX as X } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { useToast } from "@/hooks/useToast";
import { combinePhone } from "@/lib/utils/validators";
import { AgentPageHeader, AgentPageShell, AgentSection } from "@/components/agent/AgentPage";

type Customer = {
  id: number;
  full_name?: string;
  email: string;
  phone?: string;
  country?: string;
  country_name?: string;
  city?: string;
  city_name?: string;
  booking_count?: number;
  total_bookings?: number;
  status?: string;
  created_at?: string;
};

function statusClass(status?: string) {
  const v = (status || "active").toLowerCase();
  if (["active", "verified"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "inactive"].includes(v)) return "bg-amber-50 text-amber-700";
  if (["blocked", "suspended"].includes(v)) return "bg-rose-50 text-rose-700";
  return "bg-slate-50 text-slate-700";
}

function dateText(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const BLANK = {
  first_name: "", last_name: "", email: "", phone: "", phone_country_code: "+91",
  country: "", state: "", city: "", postal_code: "", address_line_1: "", address_line_2: "",
};

export default function AgentCustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const limit = 10;

  const debouncedSearch = useDebounce(search, 350);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError("");
    const params: Record<string, unknown> = { limit, page };
    if (debouncedSearch) params.search = debouncedSearch;

    api.get("/customers", { params, signal: ctrl.signal })
      .then((r) => {
        if (ctrl.signal.aborted) return;
        setCustomers(r.data?.items ?? r.data?.data ?? []);
        setTotal(r.data?.total ?? 0);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) {
          setCustomers([]);
          setTotal(0);
          setError("Customers could not be loaded. Please retry.");
        }
      })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });

    return () => ctrl.abort();
  }, [page, debouncedSearch, retryKey]);

  const totalPages = Math.ceil(total / limit) || 1;

  function field(key: keyof typeof BLANK) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function createCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      const fullName = `${form.first_name} ${form.last_name}`.trim();
      const phone = form.phone ? combinePhone(form.phone_country_code || "+91", form.phone) : "";
      await api.post("/customers/", {
        first_name: form.first_name,
        last_name: form.last_name,
        full_name: fullName,
        email: form.email,
        phone,
        country: form.country,
        state: form.state,
        city: form.city,
        postal_code: form.postal_code,
        address_line_1: form.address_line_1,
        address_line_2: form.address_line_2,
      });
      toast.success("Customer created successfully.");
      setShowModal(false);
      setForm(BLANK);
    } catch {
      toast.error("Could not create customer");
    } finally {
      setSaving(false);
    }
  }

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "customer",
      header: "Customer",
      render: (c) => (
        <>
          <p className="font-bold text-dash-text">{c.full_name ?? "-"}</p>
          <p className="text-xs text-dash-muted">{c.email}</p>
        </>
      ),
    },
    { key: "phone", header: "Phone", className: "hidden text-dash-muted sm:table-cell", render: (c) => c.phone ?? "-" },
    { key: "location", header: "Location", className: "hidden text-dash-muted lg:table-cell", render: (c) => [c.city_name ?? c.city, c.country_name ?? c.country].filter(Boolean).join(", ") || "-" },
    {
      key: "bookings",
      header: "Bookings",
      className: "hidden text-center font-bold text-dash-text md:table-cell",
      render: (c) => c.total_bookings ?? c.booking_count ?? 0,
    },
    { key: "joined", header: "Joined", className: "hidden text-dash-muted xl:table-cell", render: (c) => dateText(c.created_at) },
    {
      key: "status",
      header: "Status",
      render: (c) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClass(c.status)}`}>
          {c.status ?? "active"}
        </span>
      ),
    },
  ];

  return (
    <AgentPageShell>
      <AgentPageHeader title="My Customers" description="Manage traveller contacts used by bookings created from the public tour catalogue." icon={UserPlus} eyebrow="Customer Workspace">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-blue-50 px-3 py-2 text-[11px] font-black text-blue-700">{total} customer{total === 1 ? "" : "s"}</span>
          <button
            type="button"
            onClick={() => { setForm(BLANK); setShowModal(true); }}
            className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1D4ED8]"
          >
            <UserPlus size={16} strokeWidth={2.5} /> New Customer
          </button>
        </div>
      </AgentPageHeader>

      {/* Search */}
      <AgentSection className="mt-4">
      <div className="relative max-w-md p-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dash-subtle" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-2xl border border-dash-border/80 bg-white py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10 transition-all"
        />
      </div>

      {/* Table */}
      <div>
        {error && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            <span className="flex items-center gap-2"><AlertCircle size={16} />{error}</span>
            <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs shadow-sm"><RefreshCw size={13} />Retry</button>
          </div>
        )}
        <DataTable
          ariaLabel="My Customers"
          columns={columns}
          rows={customers}
          loading={loading}
          page={page}
          pageSize={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyTitle="No customers yet"
          emptyDescription={search ? "Try a different search term." : "Customers from your bookings will appear here. Create one to get started."}
        />
      </div>
      </AgentSection>

      {/* New Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-dash-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-dash-border px-6 py-4">
              <h2 className="text-base font-bold text-dash-text">New Customer</h2>
              <button type="button" title="Close" onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-[#F3F8FC]">
                <X size={18} className="text-dash-muted" />
              </button>
            </div>
            <form onSubmit={createCustomer} className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-dash-muted">First name *</label>
                  <input required value={form.first_name} onChange={field("first_name")} placeholder="Jane"
                    className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-dash-muted">Last name</label>
                  <input value={form.last_name} onChange={field("last_name")} placeholder="Smith"
                    className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-dash-muted">Email *</label>
                <input required type="email" value={form.email} onChange={field("email")} placeholder="jane@example.com"
                  className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand" />
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 w-24">
                  <label className="text-xs font-bold uppercase tracking-wide text-dash-muted">Code</label>
                  <input value={form.phone_country_code} onChange={field("phone_country_code")} placeholder="+1"
                    className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand" />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-dash-muted">Phone</label>
                  <input value={form.phone} onChange={field("phone")} placeholder="555 000 0000"
                    className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-dash-muted">Country</label>
                  <input value={form.country} onChange={field("country")} placeholder="Country" autoComplete="country-name" className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-dash-muted">State / Province</label>
                  <input value={form.state} onChange={field("state")} placeholder="State" autoComplete="address-level1" className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-dash-muted">City</label>
                  <input value={form.city} onChange={field("city")} placeholder="City" autoComplete="address-level2" className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-dash-muted">Address Line 1</label>
                <input value={form.address_line_1} onChange={field("address_line_1")} placeholder="Street address" autoComplete="address-line1" className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand" />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-dash-muted">Address Line 2</label>
                  <input value={form.address_line_2} onChange={field("address_line_2")} placeholder="Apartment, suite, landmark" autoComplete="address-line2" className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-dash-muted">Postal Code</label>
                  <input value={form.postal_code} onChange={field("postal_code")} placeholder="Postal code" autoComplete="postal-code" className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-dash-border py-2.5 text-sm font-bold text-dash-body hover:bg-[#F3F8FC] transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-xl bg-dash-brand py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60 transition-all">
                  {saving ? "Saving…" : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AgentPageShell>
  );
}
