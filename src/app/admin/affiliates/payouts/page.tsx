"use client";

import { useCallback, useEffect, useState } from "react";
import { LuCircleAlert as AlertCircle, LuCircleCheckBig as CheckCircle2, LuCircleX as XCircle, LuLoaderCircle as Loader2, LuRefreshCw as RefreshCw } from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { useToast } from "@/hooks/useToast";
import { useCurrency } from "@/hooks/useCurrency";
import {
  approveAffiliatePayout,
  getAdminAffiliatePayouts,
  markAffiliatePayoutPaid,
  markAffiliatePayoutProcessing,
  rejectAffiliatePayout,
  type AffiliatePayout,
} from "@/lib/api/services/affiliateService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

const FILTERS = ["all", "requested", "approved", "processing", "paid", "rejected"];

function statusCls(status: string) {
  const v = (status || "").toLowerCase();
  if (v === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (v === "processing") return "border-sky-200 bg-sky-50 text-sky-700";
  if (v === "approved") return "border-indigo-200 bg-indigo-50 text-indigo-700";
  if (v === "requested" || v === "pending") return "border-amber-200 bg-amber-50 text-amber-700";
  if (["rejected", "cancelled"].includes(v)) return "border-red-200 bg-red-50 text-red-600";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function dateText(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminAffiliatePayoutsPage() {
  const toast = useToast();
  const { formatExact: money } = useCurrency();
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [acting, setActing] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [payReference, setPayReference] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminAffiliatePayouts({ page, limit: 15, status: filter === "all" ? undefined : filter });
      setPayouts(res.items ?? []);
      setTotal(res.total ?? 0);
      setTotalPages(res.total_pages ?? 1);
    } catch (e) {
      setError(getApiErrorMessage(e) || "Could not load affiliate payouts.");
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { void load(); }, [load]);

  async function approve(id: number) {
    setActing(id);
    try {
      await approveAffiliatePayout(id);
      toast.success("Payout approved.");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not approve payout.");
    } finally {
      setActing(null);
    }
  }

  async function reject(id: number) {
    const reason = window.prompt("Rejection reason:");
    if (!reason) return;
    setActing(id);
    try {
      await rejectAffiliatePayout(id, reason);
      toast.success("Payout rejected.");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not reject payout.");
    } finally {
      setActing(null);
    }
  }

  async function processing(id: number) {
    setActing(id);
    try {
      await markAffiliatePayoutProcessing(id);
      toast.success("Payout marked processing.");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not update payout.");
    } finally {
      setActing(null);
    }
  }

  async function markPaid(id: number) {
    const reference = (payReference[id] || "").trim();
    if (!reference) {
      toast.error("Enter a payment reference before marking this payout paid.");
      return;
    }
    setActing(id);
    try {
      await markAffiliatePayoutPaid(id, { payment_reference: reference });
      toast.success("Payout marked paid.");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not update payout.");
    } finally {
      setActing(null);
    }
  }

  const columns: DataTableColumn<AffiliatePayout>[] = [
    {
      key: "payout",
      header: "Payout",
      render: (p) => (
        <div>
          <p className="font-mono text-xs font-bold text-dash-text">{p.payout_code}</p>
          <p className="mt-0.5 text-xs text-dash-subtle">{dateText(p.created_at)}</p>
        </div>
      ),
    },
    { key: "affiliate", header: "Affiliate", className: "text-sm font-bold text-dash-text", render: (p) => `#${p.affiliate_id}` },
    { key: "amount", header: "Amount", className: "font-bold", render: (p) => money(p.total_amount, p.currency) },
    { key: "method", header: "Method", className: "text-xs capitalize text-dash-muted", render: (p) => (p.payment_method || "").replaceAll("_", " ") },
    { key: "reference", header: "Reference", className: "text-xs text-dash-muted", render: (p) => p.reference_number || "-" },
    {
      key: "status",
      header: "Status",
      render: (p) => <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusCls(p.status)}`}>{p.status}</span>,
    },
  ];

  return (
    <ModuleWrapper title="Affiliate Payouts" requiredPermission="affiliate_payouts.approve">
      <div>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-dash-brand">Finance Operations</p>
            <h1 className="mt-1 text-2xl font-black text-dash-text">Affiliate Payouts</h1>
            <p className="mt-1 text-sm text-dash-muted">Review affiliate payout requests, approve, process, and mark them paid.</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-dash-border bg-white px-4 py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg-muted disabled:opacity-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="rounded-xl border border-dash-border bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-dash-border px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="font-bold text-dash-text">Payout Requests</h2>
              <p className="mt-0.5 text-xs text-dash-subtle">{total} matching records</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((s) => (
                <button key={s} type="button" onClick={() => { setFilter(s); setPage(1); }}
                  className={`rounded-xl px-3 py-2 text-xs font-bold capitalize ${filter === s ? "bg-dash-text text-white" : "border border-dash-border text-dash-muted hover:bg-dash-bg-muted"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <DataTable
              ariaLabel="Affiliate Payouts"
              columns={columns}
              rows={payouts}
              loading={loading}
              error={error}
              page={page}
              pageSize={15}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
              emptyTitle="No payout requests found"
              emptyDescription="Affiliate payout requests will appear here after affiliates submit them."
              actions={(p) => (
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {p.status === "requested" && (
                    <>
                      <button onClick={() => approve(p.id)} disabled={acting === p.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                        {acting === p.id ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle2 size={12} />} Approve
                      </button>
                      <button onClick={() => reject(p.id)} disabled={acting === p.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50">
                        <XCircle size={12} /> Reject
                      </button>
                    </>
                  )}
                  {p.status === "approved" && (
                    <>
                      <button onClick={() => processing(p.id)} disabled={acting === p.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 disabled:opacity-50">
                        {acting === p.id ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle2 size={12} />} Mark Processing
                      </button>
                      <button onClick={() => reject(p.id)} disabled={acting === p.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50">
                        <XCircle size={12} /> Reject
                      </button>
                    </>
                  )}
                  {p.status === "processing" && (
                    <div className="flex items-center gap-1.5">
                      <input
                        value={payReference[p.id] ?? ""}
                        onChange={(e) => setPayReference((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="Payment reference"
                        className="w-32 rounded-lg border border-dash-border px-2 py-1.5 text-xs outline-none focus:border-dash-brand"
                      />
                      <button onClick={() => markPaid(p.id)} disabled={acting === p.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                        {acting === p.id ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle2 size={12} />} Mark Paid
                      </button>
                    </div>
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
