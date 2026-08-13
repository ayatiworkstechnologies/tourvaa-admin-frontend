"use client";

import { useCallback, useEffect, useState } from "react";
import { LuCircleAlert as AlertCircle, LuPlus as Plus, LuTrash2 as Trash2 } from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/hooks/useToast";
import {
  createCommissionRule,
  deleteCommissionRule,
  getCommissionRules,
  updateCommissionRule,
  type AffiliateCommissionRule,
} from "@/lib/api/services/affiliateService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

const inputCls = "w-full rounded-xl border border-dash-border bg-white px-3 py-2 text-sm outline-none focus:border-dash-brand";
const labelCls = "mb-1 block text-xs font-bold uppercase tracking-wide text-dash-muted";

function scopeLabel(r: AffiliateCommissionRule) {
  if (r.affiliate_link_id) return "Link Override";
  if (r.affiliate_id && r.tour_id) return "Affiliate + Tour";
  if (r.affiliate_id) return "Affiliate";
  if (r.tour_id) return "Tour";
  if (r.category_id) return "Category";
  return "Global Default";
}

export default function AdminAffiliateCommissionRulesPage() {
  const toast = useToast();
  const pagination = usePagination(15);
  const [rules, setRules] = useState<AffiliateCommissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", affiliate_id: "", tour_id: "", category_id: "",
    commission_type: "percentage", percentage: "", fixed_amount: "", priority: "0",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCommissionRules({ page: pagination.page, limit: pagination.limit });
      setRules(res.items ?? []);
      pagination.setTotal(res.total ?? 0);
      pagination.setTotalPages(res.total_pages ?? 1);
    } catch (e) {
      setError(getApiErrorMessage(e) || "Could not load commission rules.");
      setRules([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  useEffect(() => { void load(); }, [load]);

  async function submitRule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createCommissionRule({
        name: form.name || null,
        affiliate_id: form.affiliate_id ? Number(form.affiliate_id) : null,
        tour_id: form.tour_id ? Number(form.tour_id) : null,
        category_id: form.category_id ? Number(form.category_id) : null,
        commission_type: form.commission_type,
        percentage: form.commission_type === "percentage" ? form.percentage || "0" : "0",
        fixed_amount: form.commission_type === "fixed" ? form.fixed_amount || "0" : "0",
        priority: Number(form.priority) || 0,
      });
      toast.success("Commission rule created.");
      setShowForm(false);
      setForm({ name: "", affiliate_id: "", tour_id: "", category_id: "", commission_type: "percentage", percentage: "", fixed_amount: "", priority: "0" });
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not create commission rule.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(rule: AffiliateCommissionRule) {
    try {
      await updateCommissionRule(rule.id, { is_active: !rule.is_active });
      toast.success(rule.is_active ? "Rule deactivated." : "Rule activated.");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not update rule.");
    }
  }

  async function removeRule(rule: AffiliateCommissionRule) {
    if (!window.confirm("Remove this commission rule?")) return;
    try {
      const result = await deleteCommissionRule(rule.id);
      toast.success(result?.deactivated ? "Rule was in use, so it was deactivated instead of deleted." : "Rule deleted.");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not remove rule.");
    }
  }

  const columns: DataTableColumn<AffiliateCommissionRule>[] = [
    { key: "name", header: "Rule", className: "text-sm font-bold text-dash-text", render: (r) => r.name || `Rule #${r.id}` },
    { key: "scope", header: "Scope", className: "text-xs font-bold text-dash-muted", render: (r) => scopeLabel(r) },
    { key: "target", header: "Affiliate / Tour / Category", className: "text-xs text-dash-muted", render: (r) => [r.affiliate_id && `Aff #${r.affiliate_id}`, r.tour_id && `Tour #${r.tour_id}`, r.category_id && `Cat #${r.category_id}`].filter(Boolean).join(", ") || "-" },
    { key: "type", header: "Type", className: "text-xs capitalize text-dash-muted", render: (r) => r.commission_type },
    { key: "value", header: "Value", className: "text-sm font-bold text-dash-text", render: (r) => (r.commission_type === "percentage" ? `${r.percentage}%` : r.fixed_amount) },
    { key: "priority", header: "Priority", className: "text-sm text-dash-muted", render: (r) => r.priority },
    {
      key: "status", header: "Status",
      render: (r) => (
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${r.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
          {r.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <ModuleWrapper title="Affiliate Commission Rules" requiredPermission="affiliate_commission_rules.view">
      <div>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-dash-brand">Affiliates</p>
            <h1 className="mt-1 text-2xl font-black text-dash-text">Commission Rules</h1>
            <p className="mt-1 text-sm text-dash-muted">Configure commission by affiliate, tour, category, or link. Resolved link → affiliate+tour → affiliate → tour → category → global default.</p>
          </div>
          <button type="button" onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover">
            <Plus size={15} /> New Rule
          </button>
        </div>

        {showForm && (
          <form onSubmit={submitRule} className="mb-6 rounded-xl border border-dash-border bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label className={labelCls}>Rule Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Sri Lanka tours - higher rate" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Affiliate ID (optional)</label>
                <input value={form.affiliate_id} onChange={(e) => setForm((f) => ({ ...f, affiliate_id: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tour ID (optional)</label>
                <input value={form.tour_id} onChange={(e) => setForm((f) => ({ ...f, tour_id: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Category ID (optional)</label>
                <input value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Commission Type</label>
                <select value={form.commission_type} onChange={(e) => setForm((f) => ({ ...f, commission_type: e.target.value }))} className={inputCls}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              {form.commission_type === "percentage" ? (
                <div>
                  <label className={labelCls}>Percentage</label>
                  <input value={form.percentage} onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))} placeholder="8" className={inputCls} />
                </div>
              ) : (
                <div>
                  <label className={labelCls}>Fixed Amount</label>
                  <input value={form.fixed_amount} onChange={(e) => setForm((f) => ({ ...f, fixed_amount: e.target.value }))} placeholder="40" className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>Priority</label>
                <input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-dash-border bg-white px-4 py-2 text-sm font-bold text-dash-body hover:bg-dash-bg-muted">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60">
                {saving ? "Saving…" : "Create Rule"}
              </button>
            </div>
          </form>
        )}

        <div className="rounded-xl border border-dash-border bg-white shadow-sm">
          <div className="p-5">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <DataTable
              ariaLabel="Affiliate Commission Rules"
              columns={columns}
              rows={rules}
              loading={loading}
              error={error}
              page={pagination.page}
              pageSize={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setPage}
              emptyTitle="No commission rules configured"
              emptyDescription="Affiliates use their default flat commission rate until a rule is created."
              actions={(r) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button onClick={() => toggleActive(r)} className="rounded-lg border border-dash-border px-2.5 py-1.5 text-xs font-bold text-dash-body hover:bg-dash-bg-muted">
                    {r.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => removeRule(r)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100">
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </ModuleWrapper>
  );
}
