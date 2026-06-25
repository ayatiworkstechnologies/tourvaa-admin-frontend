"use client";

import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type Payout = { id: number; payout_code: string; supplier_name?: string; total_amount: string; currency: string; payment_method: string; status: string; paid_at?: string; created_at?: string };

function statusCls(s: string) {
  const v = (s || "").toLowerCase();
  if (v === "paid") return "bg-emerald-50 text-emerald-700";
  if (v === "approved") return "bg-sky-50 text-sky-700";
  if (v === "pending") return "bg-amber-50 text-amber-700";
  if (v === "rejected") return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

export default function SupplierPayoutsAdminPage() {
  const toast = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [acting, setActing] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "50" };
      if (filter !== "all") params.status = filter;
      const res = await api.get("/supplier-payouts", { params });
      setPayouts(res.data?.items ?? res.data?.data ?? []);
      setPage(1);
    } catch {
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
    } catch {
      toast.error("Could not approve payout.");
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
    } catch {
      toast.error("Could not update payout.");
    } finally {
      setActing(null);
    }
  }

  const total = payouts.reduce((s, p) => s + Number(p.total_amount || 0), 0);
  const pending = payouts.filter(p => p.status === "pending").length;

  const paginatedPayouts = payouts.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(payouts.length / pageSize));

  const columns: DataTableColumn<Payout>[] = [
    {
      key: "payout_code",
      header: "Code",
      className: "font-mono text-xs",
      render: (p) => p.payout_code,
    },
    {
      key: "supplier",
      header: "Supplier",
      className: "text-xs",
      render: (p) => p.supplier_name || `#${p.id}`,
    },
    {
      key: "amount",
      header: "Amount",
      className: "font-bold",
      render: (p) => `${p.currency} ${Number(p.total_amount).toLocaleString()}`,
    },
    {
      key: "method",
      header: "Method",
      className: "text-xs capitalize text-[#667085]",
      render: (p) => p.payment_method,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusCls(p.status)}`}>
          {p.status}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      className: "text-xs text-[#667085]",
      render: (p) => (p.paid_at || p.created_at) ? new Date((p.paid_at || p.created_at)!).toLocaleDateString() : "—",
    },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#121826]">Supplier Payouts</h1>
        <p className="mt-1 text-sm text-[#667085]">Review and process supplier payout requests.</p>
      </div>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Payouts (filtered)", value: `AED ${total.toLocaleString()}` },
          { label: "Pending Requests", value: pending },
          { label: "Total Records", value: payouts.length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-[#667085]">{label}</p>
            <p className="mt-2 text-2xl font-black text-[#121826]">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[#E7EAF0] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7EAF0] px-5 py-4">
          <h2 className="font-bold text-[#121826]">Payout List</h2>
          <div className="flex items-center gap-2">
            {["all", "pending", "approved", "paid", "rejected"].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold ${filter === s ? "bg-[#121826] text-white" : "border border-[#E7EAF0] text-[#667085] hover:bg-[#F5F7FA]"}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5">
          <DataTable
            ariaLabel="Supplier Payouts"
            columns={columns}
            rows={paginatedPayouts}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={payouts.length}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyTitle="No payouts found"
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
  );
}
