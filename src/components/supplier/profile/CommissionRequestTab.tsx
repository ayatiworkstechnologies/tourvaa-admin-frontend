"use client";

import { useEffect, useState } from "react";
import { LuCircleCheckBig as CheckCircle2, LuLoaderCircle as Loader2, LuPercent as Percent } from "react-icons/lu";

import api from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";

type Form = {
  markup_type: string;
  markup_value: string;
};

type HistoryEntry = {
  id: number;
  markup_type: string;
  markup_value: number;
  status: string;
  requested_at?: string | null;
  reviewed_at?: string | null;
};

export default function CommissionRequestTab() {
  const toast = useToast();
  const [form, setForm] = useState<Form>({ markup_type: "percentage", markup_value: "" });
  const [floorType, setFloorType] = useState("");
  const [floorValue, setFloorValue] = useState(0);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [requestedAt, setRequestedAt] = useState<string | null>(null);
  const [reviewedAt, setReviewedAt] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [saving, setSaving] = useState(false);

  function applySupplierData(data: Record<string, unknown>) {
    setForm({
      markup_type: (data.markup_type as string) || "percentage",
      markup_value: data.markup_value !== undefined && data.markup_value !== null ? String(data.markup_value) : "",
    });
    setFloorType((data.markup_type as string) || "");
    setFloorValue(Number(data.markup_value) || 0);
    setStatus((data.commission_request_status as string) || "");
    setNote((data.admin_comments as string) || (data.pending_requirements as string) || "");
    setRequestedAt((data.commission_requested_at as string) || null);
    setReviewedAt((data.commission_reviewed_at as string) || null);
    setHistory((data.commission_request_history as HistoryEntry[]) || []);
  }

  useEffect(() => {
    api.get("/suppliers/me")
      .then((res) => applySupplierData(res.data?.data ?? res.data ?? {}))
      .catch(() => toast.error("Failed to load commission details."));
  }, [toast]);

  const isFloorEnforced = Boolean(floorType) && form.markup_type === floorType;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const value = Number(form.markup_value);
      if (!Number.isFinite(value) || value < 0) {
        toast.error("Enter a valid commission value.");
        return;
      }
      if (isFloorEnforced && value < floorValue) {
        toast.error(`Commission value cannot be lower than the ${floorValue}% fixed by admin.`);
        return;
      }
      const res = await api.post("/suppliers/me/commission-request", {
        markup_type: form.markup_type,
        markup_value: value,
      });
      applySupplierData(res.data?.data ?? res.data ?? {});
      toast.success(
        isFloorEnforced && value >= floorValue
          ? "Commission updated."
          : "Commission request sent for admin approval."
      );
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(message || "Could not submit commission request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-dash-border bg-white p-6 shadow-sm max-w-2xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-dash-text">Commission Request</h2>
          <p className="mt-1 text-sm text-dash-muted">Request your preferred commission / markup. Admin will review and approve it.</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
          Submit Request
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase text-dash-muted">Commission Type</span>
          <select
            value={form.markup_type}
            onChange={(event) => setForm((current) => ({ ...current, markup_type: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase text-dash-muted">Commission Value</span>
          <div className="relative mt-1">
            <Percent className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dash-subtle" />
            <input
              type="number"
              min={isFloorEnforced ? floorValue : 0}
              step="0.01"
              value={form.markup_value}
              onChange={(event) => setForm((current) => ({ ...current, markup_value: event.target.value }))}
              className="w-full rounded-xl border border-dash-border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="E.g. 10"
            />
          </div>
          {isFloorEnforced && (
            <p className="mt-1 text-xs text-dash-subtle">
              Fixed by admin at {floorValue}%. You can increase this and save directly — no approval needed to go higher.
            </p>
          )}
        </label>
      </div>

      <div className="mt-5 rounded-xl bg-dash-bg p-4 text-sm">
        <p className="font-bold text-dash-text">Current admin status: <span className="text-emerald-700">{status || "not submitted"}</span></p>
        {note && <p className="mt-1 text-dash-muted">{note}</p>}
        {(requestedAt || reviewedAt) && (
          <div className="mt-2 flex flex-col gap-1 text-xs text-dash-subtle">
            {requestedAt && <span>Submitted: {new Date(requestedAt).toLocaleString()}</span>}
            {reviewedAt && <span>Reviewed: {new Date(reviewedAt).toLocaleString()}</span>}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase text-dash-muted">Request History</p>
          <div className="space-y-2">
            {history.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-dash-bg p-3 text-xs">
                <span className="font-semibold text-dash-text">{entry.markup_type}: {entry.markup_value}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${entry.status === "approved" ? "bg-emerald-50 text-emerald-700" : entry.status === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                  {entry.status}
                </span>
                <span className="text-dash-subtle">{entry.requested_at ? new Date(entry.requested_at).toLocaleDateString() : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
