"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LuPlus as Plus, LuSearch as Search, LuUserPlus as UserPlus, LuX as X } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { useToast } from "@/hooks/useToast";

type Customer = {
  id: number;
  full_name?: string;
  email: string;
  phone?: string;
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
  if (!value) return "—";
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

const BLANK = { first_name: "", last_name: "", email: "", phone: "", phone_country_code: "" };

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
  const limit = 10;

  const debouncedSearch = useDebounce(search, 350);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    const params: Record<string, unknown> = { limit, page };
    if (debouncedSearch) params.search = debouncedSearch;

    api.get("/customers", { params, signal: ctrl.signal })
      .then((r) => {
        setCustomers(r.data?.items ?? r.data?.data ?? []);
        setTotal(r.data?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [page, debouncedSearch]);

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
      await api.post("/customers/", form);
      toast.success("Customer created");
      setShowModal(false);
      setForm(BLANK);
      setPage(1);
      // refresh list
      const r = await api.get("/customers", { params: { limit, page: 1 } });
      setCustomers(r.data?.items ?? r.data?.data ?? []);
      setTotal(r.data?.total ?? 0);
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
          <p className="font-bold text-dash-text">{c.full_name ?? "—"}</p>
          <p className="text-xs text-dash-muted">{c.email}</p>
        </>
      ),
    },
    { key: "phone", header: "Phone", className: "hidden text-dash-muted sm:table-cell", render: (c) => c.phone ?? "—" },
    {
      key: "bookings",
      header: "Bookings",
      className: "hidden text-center font-bold text-dash-text md:table-cell",
      render: (c) => c.total_bookings ?? c.booking_count ?? 0,
    },
    { key: "joined", header: "Joined", className: "hidden text-dash-muted lg:table-cell", render: (c) => dateText(c.created_at) },
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
    <div className="p-6 md:p-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 to-orange-700 p-7 text-white shadow-xl shadow-orange-200/60 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">My Customers</h1>
            <p className="mt-2 max-w-md text-sm font-medium text-orange-100">
              Customers linked to your bookings.{total > 0 && ` ${total} total.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setForm(BLANK); setShowModal(true); }}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-orange-700 shadow-sm transition hover:bg-orange-50 hover:-translate-y-0.5"
          >
            <UserPlus size={16} strokeWidth={2.5} /> New Customer
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mt-6 max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dash-subtle" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-2xl border border-dash-border/80 bg-white py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10 transition-all"
        />
      </div>

      {/* Table */}
      <div className="mt-6">
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
          actions={(c) => (
            <div className="flex justify-end gap-2">
              <Link
                href={`/agent/bookings/create?customer_id=${c.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dash-border/80 bg-white px-3 py-1.5 text-xs font-bold text-dash-body hover:bg-[#F3F8FC] hover:text-dash-brand transition-all"
              >
                <Plus size={12} /> Book
              </Link>
            </div>
          )}
        />
      </div>

      {/* New Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-dash-border bg-white shadow-2xl">
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
    </div>
  );
}
