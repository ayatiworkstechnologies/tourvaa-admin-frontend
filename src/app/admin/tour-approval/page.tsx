"use client";

import { useCallback, useEffect, useState } from "react";
import { LuCheck as Check, LuCircleCheckBig as CheckCircle2, LuClock as Clock, LuX as X } from "react-icons/lu";
import api from "@/lib/api/client";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import { useToast } from "@/hooks/useToast";

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

export default function TourApprovalPage() {
  const toast = useToast();
  const [versions, setVersions] = useState<TourVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

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

  return (
    <ModuleWrapper title="Tour Approval" requiredPermission="tours.approve">
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
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">v{v.version_number} — Pending</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-dash-muted">
                      {v.snapshot?.category_name && <span>Category: {v.snapshot.category_name}</span>}
                      {v.snapshot?.country_name && (
                        <span>Location: {[v.snapshot.city_name, v.snapshot.country_name].filter(Boolean).join(", ")}</span>
                      )}
                      {v.snapshot?.number_of_days && <span>Duration: {v.snapshot.number_of_days} days</span>}
                      {v.snapshot?.price_start_per_person && (
                        <span>From: {v.snapshot.currency} {Number(v.snapshot.price_start_per_person).toLocaleString()}</span>
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
    </ModuleWrapper>
  );
}
