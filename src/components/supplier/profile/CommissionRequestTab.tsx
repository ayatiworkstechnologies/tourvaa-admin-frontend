"use client";

import { useEffect, useState } from "react";
import { LuCircleCheckBig as CheckCircle2, LuLoaderCircle as Loader2, LuPercent as Percent } from "react-icons/lu";

import api from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";

type Form = {
  markup_type: string;
  markup_value: string;
};

export default function CommissionRequestTab() {
  const toast = useToast();
  const [form, setForm] = useState<Form>({ markup_type: "percentage", markup_value: "" });
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/suppliers/me")
      .then((res) => {
        const data = res.data?.data ?? res.data ?? {};
        setForm({
          markup_type: data.markup_type || "percentage",
          markup_value: data.markup_value !== undefined && data.markup_value !== null ? String(data.markup_value) : "",
        });
        setStatus(data.approval_status || "");
        setNote(data.pending_requirements || data.admin_comments || "");
      })
      .catch(() => {});
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const value = Number(form.markup_value);
      if (!Number.isFinite(value) || value < 0) {
        toast.error("Enter a valid commission value.");
        return;
      }
      await api.post("/suppliers/me/commission-request", {
        markup_type: form.markup_type,
        markup_value: value,
      });
      setStatus("admin_review_pending");
      setNote("Commission request pending admin approval");
      toast.success("Commission request sent for admin approval.");
    } catch {
      toast.error("Could not submit commission request.");
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
              min="0"
              step="0.01"
              value={form.markup_value}
              onChange={(event) => setForm((current) => ({ ...current, markup_value: event.target.value }))}
              className="w-full rounded-xl border border-dash-border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="E.g. 10"
            />
          </div>
        </label>
      </div>

      <div className="mt-5 rounded-xl bg-dash-bg p-4 text-sm">
        <p className="font-bold text-dash-text">Current admin status: <span className="text-emerald-700">{status || "not submitted"}</span></p>
        {note && <p className="mt-1 text-dash-muted">{note}</p>}
      </div>
    </form>
  );
}
