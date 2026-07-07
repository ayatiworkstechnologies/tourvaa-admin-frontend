"use client";

import { useEffect, useMemo, useState } from "react";
import { LuCircleAlert as AlertCircle, LuBanknote as Banknote, LuCircleCheckBig as CheckCircle2, LuClock3 as Clock3, LuLoaderCircle as Loader2, LuReceiptText as ReceiptText, LuRefreshCw as RefreshCw, LuSearch as Search, LuShieldCheck as ShieldCheck, LuWalletCards as WalletCards } from "react-icons/lu";
import api from "@/lib/api";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import { useToast } from "@/hooks/useToast";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type Payout = {
  id: number;
  payout_code: string;
  supplier_id?: number;
  supplier_name?: string;
  total_amount: string;
  currency: string;
  payment_method: string;
  status: string;
  reference_number?: string | null;
  notes?: string | null;
  initiated_by?: number | null;
  initiator_name?: string | null;
  approved_by?: number | null;
  approver_name?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  items?: { ledger_id: number; amount: string }[];
};

const FILTERS = ["all", "pending", "approved", "paid", "rejected"];

function statusCls(status: string) {
  const v = (status || "").toLowerCase();
  if (v === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (v === "approved") return "border-sky-200 bg-sky-50 text-sky-700";
  if (v === "pending") return "border-amber-200 bg-amber-50 text-amber-700";
  if (["rejected", "cancelled", "failed"].includes(v)) return "border-red-200 bg-red-50 text-red-600";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function money(amount: string | number | undefined, currency = "AED") {
  return `${currency} ${Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateText(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SupplierPayoutsAdminPage() {
  const toast = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { limit: "100" };
      if (filter !== "all") params.status = filter;
      const res = await api.get("/supplier-payouts", { params });
      setPayouts(res.data?.items ?? res.data?.data ?? []);
      setPage(1);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail ??
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not load supplier payouts.";
      setError(typeof msg === "string" ? msg : "Could not load supplier payouts.");
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [filter]);

  async function approvePayout(id: number) {
    setActing(id);
    try {
      await api.post(`/supplier-payouts/${id}/approve`);
      toast.success("Payout approved.");
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.message ?? "Could not approve payout.";
      toast.error(msg);
    } finally {
      setActing(null);
    }
  }

  async function markPaid(id: number) {
    setActing(id);
    try {
      await api.post(`/supplier-payouts/${id}/mark-paid`);
      toast.success("Payout marked as paid.");
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.message ?? "Could not update payout.";
      toast.error(msg);
    } finally {
      setActing(null);
    }
  }

  const visiblePayouts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payouts;
    return payouts.filter((p) => [p.payout_code, p.supplier_name, p.payment_method, p.status, p.reference_number]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q)));
  }, [payouts, search]);

  const summary = useMemo(() => {
    const pendingRows = payouts.filter((p) => p.status === "pending");
    const approvedRows = payouts.filter((p) => p.status === "approved");
    const paidRows = payouts.filter((p) => p.status === "paid");
    const currency = payouts[0]?.currency || "AED";
    return {
      currency,
      totalAmount: payouts.reduce((sum, p) => sum + Number(p.total_amount || 0), 0),
      pendingAmount: pendingRows.reduce((sum, p) => sum + Number(p.total_amount || 0), 0),
      approvedAmount: approvedRows.reduce((sum, p) => sum + Number(p.total_amount || 0), 0),
      paidAmount: paidRows.reduce((sum, p) => sum + Number(p.total_amount || 0), 0),
      pendingCount: pendingRows.length,
      approvedCount: approvedRows.length,
      paidCount: paidRows.length,
    };
  }, [payouts]);

  const latestPending = payouts.find((p) => p.status === "pending") ?? null;
  const paginatedPayouts = visiblePayouts.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(visiblePayouts.length / pageSize));

  const columns: DataTableColumn<Payout>[] = [
    {
      key: "payout",
      header: "Payout",
      render: (p) => (
        <div>
          <p className="font-mono text-xs font-bold text-[#121826]">{p.payout_code}</p>
          <p className="mt-0.5 text-xs text-[#98A2B3]">{dateText(p.created_at)}</p>
        </div>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      render: (p) => (
        <div>
          <p className="text-sm font-bold text-[#121826]">{p.supplier_name || `Supplier #${p.supplier_id ?? p.id}`}</p>
          <p className="mt-0.5 text-xs text-[#98A2B3]">Requested by {p.initiator_name || "supplier"}</p>
        </div>
      ),
    },
    { key: "amount", header: "Amount", className: "font-bold", render: (p) => money(p.total_amount, p.currency) },
    { key: "method", header: "Method", className: "text-xs capitalize text-[#667085]", render: (p) => p.payment_method.replaceAll("_", " ") },
    { key: "items", header: "Ledger Items", className: "text-xs text-[#667085]", render: (p) => `${p.items?.length ?? 0} entries` },
    {
      key: "status",
      header: "Status",
      render: (p) => <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusCls(p.status)}`}>{p.status}</span>,
    },
  ];

  return (
    <ModuleWrapper title="Supplier Payouts" requiredPermission="supplier_ledger.view">
      <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#43A9F6]">Finance Operations</p>
          <h1 className="mt-1 text-2xl font-black text-[#121826]">Supplier Payouts</h1>
          <p className="mt-1 text-sm text-[#667085]">Approve supplier payout requests and mark released payments as paid.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E7EAF0] bg-white px-4 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#F5F7FA] disabled:opacity-50 sm:w-auto">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Filtered Total", value: money(summary.totalAmount, summary.currency), icon: WalletCards, tone: "text-[#43A9F6] bg-[#E7F5FF]" },
          { label: "Pending", value: `${summary.pendingCount} / ${money(summary.pendingAmount, summary.currency)}`, icon: Clock3, tone: "text-amber-700 bg-amber-50" },
          { label: "Approved", value: `${summary.approvedCount} / ${money(summary.approvedAmount, summary.currency)}`, icon: ShieldCheck, tone: "text-sky-700 bg-sky-50" },
          { label: "Paid", value: `${summary.paidCount} / ${money(summary.paidAmount, summary.currency)}`, icon: ReceiptText, tone: "text-emerald-700 bg-emerald-50" },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-[#667085]">{label}</p>
                <p className="mt-2 text-xl font-black text-[#121826]">{value}</p>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={18} /></span>
            </div>
          </div>
        ))}
      </div>

      {latestPending && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-amber-700">Latest pending request</p>
              <p className="mt-1 text-sm font-bold text-[#121826]">
                {latestPending.payout_code} - {latestPending.supplier_name || "Supplier"} - {money(latestPending.total_amount, latestPending.currency)}
              </p>
            </div>
            <button type="button" onClick={() => approvePayout(latestPending.id)} disabled={acting === latestPending.id}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
              {acting === latestPending.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Approve Now
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#E7EAF0] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#E7EAF0] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-bold text-[#121826]">Payout Requests</h2>
            <p className="mt-0.5 text-xs text-[#98A2B3]">Showing {visiblePayouts.length} matching records</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative block sm:w-64">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search payouts"
                className="w-full rounded-xl border border-[#E7EAF0] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#43A9F6]" />
            </label>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold capitalize ${filter === s ? "bg-[#121826] text-white" : "border border-[#E7EAF0] text-[#667085] hover:bg-[#F5F7FA]"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <DataTable
            ariaLabel="Supplier Payouts"
            columns={columns}
            rows={paginatedPayouts}
            loading={loading}
            error={error}
            page={page}
            pageSize={pageSize}
            total={visiblePayouts.length}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyTitle="No payout requests found"
            emptyDescription="Supplier payout requests will appear here after suppliers submit them."
            actions={(p) => (
              <div className="flex justify-end gap-1.5">
                {p.status === "pending" && (
                  <button onClick={() => approvePayout(p.id)} disabled={acting === p.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                    {acting === p.id ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle2 size={12} />} Approve
                  </button>
                )}
                {p.status === "approved" && (
                  <button onClick={() => markPaid(p.id)} disabled={acting === p.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 disabled:opacity-50">
                    {acting === p.id ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle2 size={12} />} Mark Paid
                  </button>
                )}
              </div>
            )}
          />
        </div>
      </div>
      </div>
    </ModuleWrapper>
  );
}
