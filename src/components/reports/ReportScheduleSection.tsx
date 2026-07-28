"use client";

import { useEffect, useState } from "react";
import { LuCircleAlert as AlertCircle, LuLoaderCircle as Loader2, LuPlus as Plus, LuTrash2 as Trash2 } from "react-icons/lu";
import { REPORT_TYPES } from "@/lib/api/services/reportService";
import { ReportSchedule, createReportSchedule, deleteReportSchedule, getReportSchedules } from "@/lib/api/services/reportService";
import { useToast } from "@/hooks/useToast";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

const CADENCES = ["daily", "weekly", "monthly"];

export default function ReportScheduleSection() {
  const toast = useToast();
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<string>(REPORT_TYPES[0]?.value ?? "summary");
  const [cadence, setCadence] = useState("weekly");
  const [emails, setEmails] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      setSchedules(await getReportSchedules());
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!emails.trim()) return;
    setSaving(true);
    try {
      await createReportSchedule({ report_type: reportType, cadence, recipient_emails: emails.trim() });
      toast.success("Schedule saved.");
      setEmails("");
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setDeletingId(id);
    try {
      await deleteReportSchedule(id);
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-dash-border bg-white p-6">
      <h3 className="mb-1 text-lg font-bold text-dash-text">Report Scheduling</h3>
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <AlertCircle size={15} className="mt-0.5 shrink-0" />
        Schedules are saved here but not yet delivered automatically -- automated sending is a follow-up feature. This lets you set up the configuration in advance.
      </div>

      <form onSubmit={submit} className="mb-5 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Report</span>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="rounded-xl border border-dash-border px-3 py-2 text-sm">
            {REPORT_TYPES.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Cadence</span>
          <select value={cadence} onChange={(e) => setCadence(e.target.value)} className="rounded-xl border border-dash-border px-3 py-2 text-sm capitalize">
            {CADENCES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="block flex-1 min-w-[220px]">
          <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Recipient emails (comma separated)</span>
          <input value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="ops@tourvaa.com, finance@tourvaa.com" className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm" />
        </label>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60">
          {saving ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
          Add Schedule
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-dash-muted">Loading schedules...</p>
      ) : schedules.length === 0 ? (
        <p className="text-sm text-dash-muted">No report schedules configured.</p>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-dash-bg p-3 text-sm">
              <div>
                <span className="font-bold text-dash-text">{REPORT_TYPES.find((rt) => rt.value === s.report_type)?.label || s.report_type}</span>
                <span className="ml-2 text-xs capitalize text-dash-muted">{s.cadence}</span>
                <p className="text-xs text-dash-subtle">{s.recipient_emails}</p>
              </div>
              <button type="button" disabled={deletingId === s.id} onClick={() => void remove(s.id)} className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 disabled:opacity-50">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
