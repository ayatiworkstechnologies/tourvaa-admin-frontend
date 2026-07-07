"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuRefreshCcw as RefreshCcw, LuTrash2 as Trash2, LuCircleX as XCircle, LuCircleCheckBig as CheckCircle2, LuInbox as InboxIcon } from "react-icons/lu";
import api from "@/lib/api";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import StatusBadge from "@/components/operations/StatusBadge";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { useToast } from "@/hooks/useToast";

type CancellationRequest = {
  id: number;
  booking_id: number;
  booking_code?: string;
  customer_name?: string;
  reason: string;
  status: string;
  refund_percentage?: number;
  refund_amount?: string;
  currency?: string;
  admin_notes?: string;
  gateway_refund_id?: string;
  created_at?: string;
};

type RefundRule = {
  id: number;
  tour_id?: number | null;
  tour_title?: string;
  days_before_departure_min?: number;
  days_before_departure_max?: number;
  refund_percentage: number;
  description?: string;
};

type ApproveFormState = {
  refund_percentage: string;
  refund_amount: string;
  admin_notes: string;
};

const TABS = ["Cancellation Requests", "Refund Rules"] as const;
type Tab = (typeof TABS)[number];

export default function RefundsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("Cancellation Requests");

  // Cancellation requests state
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqPage, setReqPage] = useState(1);
  const [reqHasMore, setReqHasMore] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approveForm, setApproveForm] = useState<ApproveFormState>({ refund_percentage: "", refund_amount: "", admin_notes: "" });
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Refund rules state
  const [rules, setRules] = useState<RefundRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleForm, setRuleForm] = useState({ tour_id: "", days_before_departure_min: "", days_before_departure_max: "", refund_percentage: "", description: "" });
  const [savingRule, setSavingRule] = useState(false);

  const fetchRequests = useCallback(async (page = 1) => {
    setReqLoading(true);
    try {
      const res = await api.get(`/cancellations?limit=10&page=${page}`);
      const data = res.data?.data ?? res.data ?? [];
      const items: CancellationRequest[] = Array.isArray(data) ? data : data.items ?? [];
      setRequests(items);
      setReqHasMore(items.length === 10);
    } catch {
      toast.error("Could not load cancellation requests.");
    } finally {
      setReqLoading(false);
    }
  }, [toast]);

  const fetchRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      const res = await api.get("/refund-rules");
      setRules(res.data?.data ?? res.data ?? []);
    } catch {
      toast.error("Could not load refund rules.");
    } finally {
      setRulesLoading(false);
    }
  }, [toast]);

  useEffect(() => { void fetchRequests(1); }, [fetchRequests]);
  useEffect(() => { void fetchRules(); }, [fetchRules]);

  const approveRequest = async (req: CancellationRequest) => {
    setProcessingId(req.id);
    try {
      const body: Record<string, unknown> = {};
      if (approveForm.refund_percentage) body.refund_percentage = Number(approveForm.refund_percentage);
      if (approveForm.refund_amount) body.refund_amount = approveForm.refund_amount;
      if (approveForm.admin_notes) body.admin_notes = approveForm.admin_notes;
      await api.patch(`/cancellations/${req.id}/approve`, body);
      toast.success("Cancellation request approved.");
      setApprovingId(null);
      void fetchRequests(reqPage);
    } catch {
      toast.error("Could not approve cancellation request.");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async (req: CancellationRequest) => {
    if (!rejectNotes.trim()) return;
    setProcessingId(req.id);
    try {
      await api.patch(`/cancellations/${req.id}/reject`, { admin_notes: rejectNotes });
      toast.success("Cancellation request rejected.");
      setRejectingId(null);
      setRejectNotes("");
      void fetchRequests(reqPage);
    } catch {
      toast.error("Could not reject cancellation request.");
    } finally {
      setProcessingId(null);
    }
  };

  const processRefund = async (req: CancellationRequest) => {
    const gateway = window.prompt("Payment gateway (e.g. stripe, paypal):", "stripe");
    if (!gateway) return;
    setProcessingId(req.id);
    try {
      await api.post(`/cancellations/${req.id}/process-refund`, { gateway });
      toast.success("Refund processed successfully.");
      void fetchRequests(reqPage);
    } catch {
      toast.error("Could not process refund.");
    } finally {
      setProcessingId(null);
    }
  };

  const deleteRule = async (id: number) => {
    if (!window.confirm("Delete this refund rule?")) return;
    try {
      await api.delete(`/refund-rules/${id}`);
      toast.success("Refund rule deleted.");
      setRules(prev => prev.filter(r => r.id !== id));
    } catch {
      toast.error("Could not delete refund rule.");
    }
  };

  const saveRule = async () => {
    if (!ruleForm.refund_percentage) return;
    setSavingRule(true);
    try {
      const body: Record<string, unknown> = {
        refund_percentage: Number(ruleForm.refund_percentage),
      };
      if (ruleForm.tour_id) body.tour_id = Number(ruleForm.tour_id);
      if (ruleForm.days_before_departure_min) body.days_before_departure_min = Number(ruleForm.days_before_departure_min);
      if (ruleForm.days_before_departure_max) body.days_before_departure_max = Number(ruleForm.days_before_departure_max);
      if (ruleForm.description) body.description = ruleForm.description;
      await api.post("/refund-rules", body);
      toast.success("Refund rule created.");
      setShowRuleForm(false);
      setRuleForm({ tour_id: "", days_before_departure_min: "", days_before_departure_max: "", refund_percentage: "", description: "" });
      void fetchRules();
    } catch {
      toast.error("Could not create refund rule.");
    } finally {
      setSavingRule(false);
    }
  };

  const reqColumns: DataTableColumn<CancellationRequest>[] = [
    {
      key: "booking",
      header: "Booking",
      className: "font-semibold text-[#121826]",
      render: (req) => req.booking_code || `#${req.booking_id}`,
    },
    {
      key: "customer",
      header: "Customer",
      className: "text-[#344054]",
      render: (req) => req.customer_name || "—",
    },
    {
      key: "reason",
      header: "Reason",
      className: "max-w-xs text-[#344054]",
      render: (req) => <span className="line-clamp-2">{req.reason}</span>,
    },
    {
      key: "refund",
      header: "Refund %",
      className: "text-[#344054]",
      render: (req) => (req.refund_percentage != null ? `${req.refund_percentage}%` : "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (req) => <StatusBadge value={req.status} />,
    },
  ];

  const ruleColumns: DataTableColumn<RefundRule>[] = [
    {
      key: "scope",
      header: "Scope",
      className: "font-semibold text-[#121826]",
      render: (rule) => rule.tour_id ? `Tour #${rule.tour_id}${rule.tour_title ? ` — ${rule.tour_title}` : ""}` : "Global",
    },
    {
      key: "days",
      header: "Days Range",
      className: "text-[#344054]",
      render: (rule) => (rule.days_before_departure_min != null || rule.days_before_departure_max != null)
        ? `${rule.days_before_departure_min ?? 0} – ${rule.days_before_departure_max ?? "∞"} days`
        : "Any",
    },
    {
      key: "refund",
      header: "Refund %",
      className: "font-bold text-[#0284C7]",
      render: (rule) => `${rule.refund_percentage}%`,
    },
    {
      key: "desc",
      header: "Description",
      className: "text-[#344054]",
      render: (rule) => rule.description || "—",
    },
  ];

  return (
    <ModuleWrapper title="Refunds" requiredPermission="bookings.manage">
      <div className="space-y-5">
        {/* Header */}
        <section className="flex items-center justify-between rounded-xl border border-[#E7EAF0] bg-white p-6">
          <div>
            <h2 className="text-2xl font-bold text-[#121826]">Refund Management</h2>
            <p className="mt-1 text-sm text-[#667085]">Handle cancellation requests and configure refund rules.</p>
          </div>
          <RefreshCcw size={20} className="text-[#0284C7]" />
        </section>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-[#E7EAF0] bg-white p-1.5">
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                activeTab === tab
                  ? "bg-[#0284C7] text-white shadow-sm"
                  : "text-[#667085] hover:bg-[#F3F8FC] hover:text-[#0284C7]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Cancellation Requests Tab */}
        {activeTab === "Cancellation Requests" && (
          <div className="rounded-xl border border-[#E7EAF0] bg-white">
            <div className="p-0">
              <DataTable
                ariaLabel="Cancellation Requests"
                columns={reqColumns}
                rows={requests}
                loading={reqLoading}
                emptyTitle="No cancellation requests"
                emptyDescription="All requests have been processed."
                actions={(req) => (
                  <div className="flex items-center justify-end gap-2">
                    {req.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setApprovingId(req.id); setApproveForm({ refund_percentage: "", refund_amount: "", admin_notes: "" }); }}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRejectingId(req.id); setRejectNotes(""); }}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </>
                    )}
                    {req.status === "approved" && (
                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => void processRefund(req)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#0284C7] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0369A1] disabled:opacity-60"
                      >
                        <RefreshCcw size={13} /> Process Refund
                      </button>
                    )}
                    {req.gateway_refund_id && (
                      <span className="text-xs text-[#98A2B3]">Ref: {req.gateway_refund_id}</span>
                    )}
                  </div>
                )}
                renderExpandedRow={(req) => {
                  if (approvingId === req.id) {
                    return (
                      <tr key={`approve-${req.id}`} className="border-b border-[#E7EAF0] bg-emerald-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-3">
                            <p className="text-sm font-bold text-emerald-700">Approve with refund details (optional):</p>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-[#667085]">Refund %</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={approveForm.refund_percentage}
                                  onChange={e => setApproveForm(f => ({ ...f, refund_percentage: e.target.value }))}
                                  placeholder="e.g. 80"
                                  className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#0284C7]"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-[#667085]">Refund Amount (override)</label>
                                <input
                                  type="text"
                                  value={approveForm.refund_amount}
                                  onChange={e => setApproveForm(f => ({ ...f, refund_amount: e.target.value }))}
                                  placeholder="e.g. 250.00"
                                  className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#0284C7]"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-[#667085]">Admin Notes</label>
                                <input
                                  type="text"
                                  value={approveForm.admin_notes}
                                  onChange={e => setApproveForm(f => ({ ...f, admin_notes: e.target.value }))}
                                  placeholder="Optional notes"
                                  className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#0284C7]"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={processingId === req.id}
                                onClick={() => void approveRequest(req)}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                              >
                                Confirm Approval
                              </button>
                              <button
                                type="button"
                                onClick={() => setApprovingId(null)}
                                className="rounded-xl border border-[#E7EAF0] px-4 py-2 text-sm font-semibold text-[#667085] hover:bg-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  if (rejectingId === req.id) {
                    return (
                      <tr key={`reject-${req.id}`} className="border-b border-[#E7EAF0] bg-red-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-3">
                            <p className="text-sm font-bold text-red-700">Rejection notes (required):</p>
                            <textarea
                              value={rejectNotes}
                              onChange={e => setRejectNotes(e.target.value)}
                              rows={2}
                              placeholder="Reason for rejection..."
                              className="w-full resize-none rounded-xl border border-red-200 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={!rejectNotes.trim() || processingId === req.id}
                                onClick={() => void rejectRequest(req)}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                              >
                                Confirm Rejection
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectingId(null)}
                                className="rounded-xl border border-[#E7EAF0] px-4 py-2 text-sm font-semibold text-[#667085] hover:bg-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return null;
                }}
              />
            </div>
            {/* Pagination */}
            {!reqLoading && (reqPage > 1 || reqHasMore) && (
              <div className="flex items-center justify-end gap-3 border-t border-[#E7EAF0] p-4">
                <button
                  type="button"
                  disabled={reqPage === 1}
                  onClick={() => { setReqPage(p => p - 1); void fetchRequests(reqPage - 1); }}
                  className="rounded-lg border border-[#E7EAF0] px-3 py-1.5 text-sm font-semibold text-[#667085] hover:bg-[#F7F9FC] disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-sm text-[#667085]">Page {reqPage}</span>
                <button
                  type="button"
                  disabled={!reqHasMore}
                  onClick={() => { setReqPage(p => p + 1); void fetchRequests(reqPage + 1); }}
                  className="rounded-lg border border-[#E7EAF0] px-3 py-1.5 text-sm font-semibold text-[#667085] hover:bg-[#F7F9FC] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Refund Rules Tab */}
        {activeTab === "Refund Rules" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowRuleForm(v => !v)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0369A1]"
              >
                <Plus size={15} /> Add Rule
              </button>
            </div>

            {showRuleForm && (
              <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
                <h3 className="mb-4 text-base font-bold text-[#121826]">New Refund Rule</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-[#667085]">Tour ID (leave blank for global)</label>
                    <input
                      type="number"
                      value={ruleForm.tour_id}
                      onChange={e => setRuleForm(f => ({ ...f, tour_id: e.target.value }))}
                      placeholder="Global rule if empty"
                      className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#0284C7]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-[#667085]">Min Days Before Departure</label>
                    <input
                      type="number"
                      value={ruleForm.days_before_departure_min}
                      onChange={e => setRuleForm(f => ({ ...f, days_before_departure_min: e.target.value }))}
                      placeholder="e.g. 7"
                      className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#0284C7]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-[#667085]">Max Days Before Departure</label>
                    <input
                      type="number"
                      value={ruleForm.days_before_departure_max}
                      onChange={e => setRuleForm(f => ({ ...f, days_before_departure_max: e.target.value }))}
                      placeholder="e.g. 30"
                      className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#0284C7]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-[#667085]">Refund % *</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={ruleForm.refund_percentage}
                      onChange={e => setRuleForm(f => ({ ...f, refund_percentage: e.target.value }))}
                      placeholder="e.g. 75"
                      className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#0284C7]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold uppercase text-[#667085]">Description</label>
                    <input
                      type="text"
                      value={ruleForm.description}
                      onChange={e => setRuleForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="e.g. 75% refund if cancelled 7–30 days before departure"
                      className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#0284C7]"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={!ruleForm.refund_percentage || savingRule}
                    onClick={saveRule}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0369A1] disabled:opacity-60"
                  >
                    Save Rule
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRuleForm(false)}
                    className="rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-semibold text-[#667085] hover:bg-[#F7F9FC]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[#E7EAF0] bg-white">
              <div className="p-0">
                <DataTable
                  ariaLabel="Refund Rules"
                  columns={ruleColumns}
                  rows={rules}
                  loading={rulesLoading}
                  emptyTitle="No refund rules configured"
                  emptyDescription="Add rules to automate refund calculations."
                  actions={(rule) => (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => void deleteRule(rule.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleWrapper>
  );
}
