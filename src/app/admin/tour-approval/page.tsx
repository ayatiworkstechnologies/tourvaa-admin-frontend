"use client";

import { diffTourSnapshots, summarizeChanges, type SectionChange } from "@/lib/tours/tourDiff";
import { useCallback, useEffect, useRef, useState } from "react";
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

type VersionSummary = { previousLabel: string; sections: SectionChange[]; first: boolean };

const REVIEW_SECTIONS = [
  { key: "basic", label: "Basic Details" },
  { key: "location", label: "Location & Category" },
  { key: "overview", label: "Overview & Highlights" },
  { key: "itinerary", label: "Itinerary" },
  { key: "pricing", label: "Supplier Pricing" },
  { key: "accommodation", label: "Accommodation" },
  { key: "activities", label: "Activities & Add-ons" },
  { key: "policies", label: "Inclusions & Policies" },
  { key: "media", label: "Media & SEO" },
  { key: "availability", label: "Availability" },
];
const SEVERITIES = ["info", "minor", "required", "critical"] as const;

export default function TourApprovalPage() {
  const toast = useToast();
  const { format } = useCurrency();
  const [versions, setVersions] = useState<TourVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [commentSection, setCommentSection] = useState("basic");
  const [commentSeverity, setCommentSeverity] = useState<typeof SEVERITIES[number]>("required");
  const [commentText, setCommentText] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [comparingVersion, setComparingVersion] = useState<TourVersion | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareDiff, setCompareDiff] = useState<SectionChange[] | null>(null);
  const [comparePrevLabel, setComparePrevLabel] = useState("");
  // What each pending version changed vs the tour's previous version, shown on the
  // card so an admin sees the kind of change before opening the full comparison.
  const [summaries, setSummaries] = useState<Record<number, VersionSummary>>({});
  const closeCompareRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!comparingVersion) return;
    closeCompareRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setComparingVersion(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [comparingVersion]);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/tours/pending-approval");
      setVersions(res.data?.items ?? res.data?.data ?? []);
    } catch {
      toast.error("Could not load pending tour approvals.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void fetchVersions(); }, [fetchVersions]);

  useEffect(() => {
    let active = true;
    versions.forEach(async (v) => {
      if (summaries[v.id]) return;
      try {
        const res = await api.get(`/tours/${v.tour_id}/versions`, { params: { page: 1, limit: 50 } });
        const all: TourVersion[] = res.data?.items ?? res.data?.data ?? [];
        const previous = all.filter((o) => o.id !== v.id && o.version_number < v.version_number).sort((a, b) => b.version_number - a.version_number)[0];
        const sections = diffTourSnapshots(previous?.snapshot as Record<string, unknown> | undefined, v.snapshot as unknown as Record<string, unknown>);
        if (active) setSummaries((prev) => ({ ...prev, [v.id]: { previousLabel: previous ? `v${previous.version_number}` : "no earlier version", sections, first: !previous } }));
      } catch {
        /* the Compare button still loads it on demand */
      }
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versions]);

  const approve = async (v: TourVersion) => {
    setProcessingId(v.id);
    try {
      await api.patch(`/tours/${v.tour_id}/versions/${v.id}/approve`);
      toast.success("Tour version approved. Publish it separately from the tour's status control to make it live.");
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
      const comments = commentText.trim()
        ? [{ section: commentSection, severity: commentSeverity, comment: commentText.trim() }]
        : [];
      await api.patch(`/tours/${v.tour_id}/versions/${v.id}/reject`, { rejection_reason: rejectionReason, comments });
      toast.success("Tour version rejected.");
      setVersions(prev => prev.filter(x => x.id !== v.id));
      setRejectingId(null);
      setRejectionReason("");
      setCommentText("");
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
      const cached = summaries[v.id];
      if (cached) {
        setComparePrevLabel(cached.previousLabel);
        setCompareDiff(cached.sections);
        return;
      }
      const res = await api.get(`/tours/${v.tour_id}/versions`, { params: { page: 1, limit: 50 } });
      const allVersions: TourVersion[] = res.data?.items ?? res.data?.data ?? [];
      const previous = allVersions
        .filter((other) => other.id !== v.id && other.version_number < v.version_number)
        .sort((a, b) => b.version_number - a.version_number)[0];
      setComparePrevLabel(previous ? `v${previous.version_number}` : "no earlier version");
      setCompareDiff(diffTourSnapshots(previous?.snapshot as Record<string, unknown> | undefined, v.snapshot as unknown as Record<string, unknown>));
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
                    {summaries[v.id] && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-dash-subtle">
                          {summaries[v.id].first ? "New tour - all sections:" : `Changed since ${summaries[v.id].previousLabel}:`}
                        </span>
                        {summaries[v.id].sections.length === 0 ? (
                          <span className="text-xs text-dash-muted">no data changes</span>
                        ) : (
                          summaries[v.id].sections.map((sec) => (
                            <span key={sec.key} className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700">
                              {sec.label} ({sec.items.length})
                            </span>
                          ))
                        )}
                      </div>
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
                      onClick={() => { setRejectingId(v.id); setRejectionReason(""); setCommentSection("basic"); setCommentSeverity("required"); setCommentText(""); }}
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
                    <p className="mb-2 mt-3 text-sm font-bold text-red-700">Section feedback (optional, shown to the supplier in that editor step):</p>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={commentSection}
                        onChange={(e) => setCommentSection(e.target.value)}
                        className="rounded-lg border border-red-200 px-2 py-1.5 text-xs font-semibold outline-none focus:border-red-400"
                      >
                        {REVIEW_SECTIONS.map((s) => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>
                      <select
                        value={commentSeverity}
                        onChange={(e) => setCommentSeverity(e.target.value as typeof SEVERITIES[number])}
                        className="rounded-lg border border-red-200 px-2 py-1.5 text-xs font-semibold capitalize outline-none focus:border-red-400"
                      >
                        {SEVERITIES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="e.g. Add at least one itinerary day"
                        className="min-w-[220px] flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs outline-none focus:border-red-400"
                      />
                    </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-label={`Comparing v${comparingVersion.version_number} vs ${comparePrevLabel}`}>
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-dash-border px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-dash-text">Comparing v{comparingVersion.version_number} vs {comparePrevLabel}</h3>
                <p className="text-xs text-dash-muted">{comparingVersion.snapshot?.title || `Tour #${comparingVersion.tour_id}`}</p>
              </div>
              <button ref={closeCompareRef} type="button" onClick={() => setComparingVersion(null)} className="rounded-lg p-2 text-dash-muted hover:bg-dash-bg">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {compareLoading ? (
                <div className="flex items-center gap-2 text-sm text-dash-muted"><Loader2 className="animate-spin" size={16} /> Loading comparison...</div>
              ) : !compareDiff || compareDiff.length === 0 ? (
                <p className="text-sm text-dash-muted">No data changes detected against {comparePrevLabel}.</p>
              ) : (
                <div className="space-y-5">
                  <p className="text-xs font-semibold text-dash-muted">{summarizeChanges(compareDiff)} compared with {comparePrevLabel}.</p>
                  {compareDiff.map((section) => (
                    <section key={section.key}>
                      <h4 className="mb-2 text-sm font-black text-dash-text">{section.label}</h4>
                      <div className="space-y-2">
                        {section.items.map((item, idx) => (
                          <div key={`${item.label}-${idx}`} className="rounded-xl border border-dash-border p-3">
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${item.kind === "added" ? "bg-emerald-100 text-emerald-700" : item.kind === "removed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                {item.kind}
                              </span>
                              <span className="text-sm font-bold text-dash-text">{item.label}</span>
                            </div>
                            {item.fields.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {item.fields.map((f) => (
                                  <div key={f.field}>
                                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-dash-subtle">{f.field}</p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      <p className="break-words rounded-lg bg-red-50 p-2 text-xs text-red-700"><span className="font-bold">Before: </span>{f.before}</p>
                                      <p className="break-words rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700"><span className="font-bold">After: </span>{f.after}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-dash-border px-6 py-3">
              <button type="button" onClick={() => setComparingVersion(null)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-bold text-dash-body hover:bg-dash-bg">
                Close
              </button>
              <button
                type="button"
                disabled={processingId === comparingVersion.id}
                onClick={async () => { const v = comparingVersion; setComparingVersion(null); await approve(v); }}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <Check size={15} /> Approve these changes
              </button>
            </div>
          </div>
        </div>
      )}
    </ModuleWrapper>
  );
}
