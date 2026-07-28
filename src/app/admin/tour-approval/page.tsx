"use client";

import { useCallback, useEffect, useState } from "react";
import { LuCheck as Check, LuCircleCheckBig as CheckCircle2, LuClock as Clock, LuGitCompare as GitCompare, LuLoaderCircle as Loader2, LuX as X } from "react-icons/lu";
import api from "@/lib/api/client";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import { useToast } from "@/hooks/useToast";
import { useCurrency } from "@/hooks/useCurrency";

type TourVersion = {
  id: number;
  tour_id: number;
  version_number: number;
  status: string;
  snapshot: {
    title?: string;
    short_description?: string;
    number_of_days?: number;
    price_start_per_person?: number;
    currency?: string;
    country_name?: string;
    city_name?: string;
    category_name?: string;
  };
  submitted_by_name?: string;
  submitted_at?: string;
};

type DiffRow = { field: string; oldValue: string; newValue: string };

function diffSnapshots(previous: Record<string, unknown> | undefined, next: Record<string, unknown> | undefined): DiffRow[] {
  const keys = new Set([...Object.keys(previous || {}), ...Object.keys(next || {})]);
  const rows: DiffRow[] = [];
  for (const key of keys) {
    const oldVal = previous?.[key];
    const newVal = next?.[key];
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;
    rows.push({
      field: key,
      oldValue: oldVal === undefined || oldVal === null || oldVal === "" ? "(empty)" : typeof oldVal === "object" ? JSON.stringify(oldVal) : String(oldVal),
      newValue: newVal === undefined || newVal === null || newVal === "" ? "(empty)" : typeof newVal === "object" ? JSON.stringify(newVal) : String(newVal),
    });
  }
  return rows.sort((a, b) => a.field.localeCompare(b.field));
}

export default function TourApprovalPage() {
  const toast = useToast();
  const { format } = useCurrency();
  const [versions, setVersions] = useState<TourVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [comparingVersion, setComparingVersion] = useState<TourVersion | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareDiff, setCompareDiff] = useState<DiffRow[] | null>(null);
  const [comparePrevLabel, setComparePrevLabel] = useState("");

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/tours/pending-approval");
      setVersions(res.data?.data ?? res.data ?? []);
    } catch {
      toast.error("Could not load pending tour approvals.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void fetchVersions(); }, [fetchVersions]);

  const approve = async (v: TourVersion) => {
    setProcessingId(v.id);
    try {
      await api.patch(`/tours/${v.tour_id}/versions/${v.id}/approve`);
      toast.success("Tour version approved and published.");
      setVersions(prev => prev.filter(x => x.id !== v.id));
    } catch {
      toast.error("Could not approve tour version.");
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (v: TourVersion) => {
    if (!rejectionReason.trim()) return;
    setProcessingId(v.id);
    try {
      await api.patch(`/tours/${v.tour_id}/versions/${v.id}/reject`, { rejection_reason: rejectionReason });
      toast.success("Tour version rejected.");
      setVersions(prev => prev.filter(x => x.id !== v.id));
      setRejectingId(null);
      setRejectionReason("");
    } catch {
      toast.error("Could not reject tour version.");
    } finally {
      setProcessingId(null);
    }
  };

  const openCompare = async (v: TourVersion) => {
    setComparingVersion(v);
    setCompareLoading(true);
    setCompareDiff(null);
    try {
      const res = await api.get(`/tours/${v.tour_id}/versions`, { params: { page: 1, limit: 50 } });
      const allVersions: TourVersion[] = res.data?.items ?? res.data?.data ?? [];
      const previous = allVersions
        .filter((other) => other.id !== v.id && other.version_number < v.version_number)
        .sort((a, b) => b.version_number - a.version_number)[0];
      setComparePrevLabel(previous ? `v${previous.version_number}` : "no earlier version");
      setCompareDiff(diffSnapshots(previous?.snapshot as Record<string, unknown> | undefined, v.snapshot as unknown as Record<string, unknown>));
    } catch {
      toast.error("Could not load version comparison.");
      setComparingVersion(null);
    } finally {
      setCompareLoading(false);
    }
  };

  return (
    <ModuleWrapper title="Tour Approval" requiredPermission="tours.publish">
      <div className="space-y-5">
        <section className="flex items-center justify-between rounded-xl border border-dash-border bg-white p-6">
          <div>
            <h2 className="text-2xl font-bold text-dash-text">Tour Approval Queue</h2>
            <p className="mt-1 text-sm text-dash-muted">Review and approve/reject supplier tour submissions.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
            <Clock size={16} className="text-amber-600" />
            <span className="text-sm font-bold text-amber-700">{versions.length} pending</span>
          </div>
        </section>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-dash-border bg-white p-6 h-32" />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dash-border bg-white py-20 text-center">
            <CheckCircle2 size={40} className="text-emerald-400" />
            <p className="mt-4 text-lg font-bold text-dash-text">All caught up!</p>
            <p className="mt-1 text-sm text-dash-muted">No tours are waiting for approval.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {versions.map(v => (
              <div key={v.id} className="rounded-xl border border-dash-border bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-dash-text">{v.snapshot?.title || `Tour #${v.tour_id}`}</h3>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">v{v.version_number} - Pending</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-dash-muted">
                      {v.snapshot?.category_name && <span>Category: {v.snapshot.category_name}</span>}
                      {v.snapshot?.country_name && (
                        <span>Location: {[v.snapshot.city_name, v.snapshot.country_name].filter(Boolean).join(", ")}</span>
                      )}
                      {v.snapshot?.number_of_days && <span>Duration: {v.snapshot.number_of_days} days</span>}
                      {v.snapshot?.price_start_per_person && (
                        <span>From: {format(v.snapshot.price_start_per_person, v.snapshot.currency)}</span>
                      )}
                    </div>
                    {v.snapshot?.short_description && (
                      <p className="mt-2 line-clamp-2 text-sm text-dash-body">{v.snapshot.short_description}</p>
                    )}
                    <div className="mt-2 text-xs text-dash-subtle">
                      {v.submitted_by_name && <>Submitted by {v.submitted_by_name}</>}
                      {v.submitted_at && <> · {new Date(v.submitted_at).toLocaleString()}</>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void openCompare(v)}
                      className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"
                    >
                      <GitCompare size={15} /> Compare
                    </button>
                    <button
                      type="button"
                      onClick={() => void approve(v)}
                      disabled={processingId === v.id}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <Check size={15} /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRejectingId(v.id); setRejectionReason(""); }}
                      disabled={processingId === v.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-60"
                    >
                      <X size={15} /> Reject
                    </button>
                  </div>
                </div>
                {rejectingId === v.id && (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
                    <p className="mb-2 text-sm font-bold text-red-700">Rejection reason (required):</p>
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      rows={2}
                      placeholder="Explain why this tour version is being rejected..."
                      className="w-full resize-none rounded-xl border border-red-200 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void reject(v)}
                        disabled={!rejectionReason.trim() || processingId === v.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(null)}
                        className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold text-dash-muted hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {comparingVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-dash-border px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-dash-text">Comparing v{comparingVersion.version_number} vs {comparePrevLabel}</h3>
                <p className="text-xs text-dash-muted">{comparingVersion.snapshot?.title || `Tour #${comparingVersion.tour_id}`}</p>
              </div>
              <button type="button" onClick={() => setComparingVersion(null)} className="rounded-lg p-2 text-dash-muted hover:bg-dash-bg">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {compareLoading ? (
                <div className="flex items-center gap-2 text-sm text-dash-muted"><Loader2 className="animate-spin" size={16} /> Loading comparison...</div>
              ) : !compareDiff || compareDiff.length === 0 ? (
                <p className="text-sm text-dash-muted">No field changes detected against {comparePrevLabel}.</p>
              ) : (
                <div className="space-y-3">
                  {compareDiff.map((row) => (
                    <div key={row.field} className="rounded-xl border border-dash-border p-3">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-dash-subtle">{row.field.replaceAll("_", " ")}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700">
                          <p className="mb-1 font-bold uppercase">Before</p>
                          <p className="break-words">{row.oldValue}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700">
                          <p className="mb-1 font-bold uppercase">After</p>
                          <p className="break-words">{row.newValue}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ModuleWrapper>
  );
}
