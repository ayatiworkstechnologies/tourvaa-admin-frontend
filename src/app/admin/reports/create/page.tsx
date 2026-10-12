"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LuBriefcaseBusiness as BriefcaseBusiness,
  LuBuilding2 as Building2,
  LuCalendarDays as CalendarDays,
  LuDownload as Download,
  LuFileChartColumn as FileChartColumn,
  LuLoaderCircle as LoaderCircle,
  LuUsers as Users,
} from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DatePicker from "@/components/ui/DatePicker";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/useToast";
import {
  AudienceOption,
  AudienceReportRow,
  exportAudienceReport,
  getAudienceOptions,
  getAudienceReport,
  ReportAudience,
} from "@/lib/api/services/reportService";

const AUDIENCES: Array<{ value: ReportAudience; label: string; description: string; icon: typeof Building2 }> = [
  { value: "supplier", label: "Supplier", description: "Bookings and gross revenue", icon: Building2 },
  { value: "agent", label: "Agent", description: "Sales and commissions", icon: BriefcaseBusiness },
  { value: "customer", label: "Customer", description: "Bookings, spend and pending", icon: Users },
];

function inputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function CreateReportPage() {
  const today = useMemo(() => new Date(), []);
  const initialStart = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 30);
    return inputDate(date);
  }, [today]);
  const { format: money } = useCurrency();
  const toast = useToast();
  const [audience, setAudience] = useState<ReportAudience>("supplier");
  const [entityId, setEntityId] = useState("");
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(inputDate(today));
  const [options, setOptions] = useState<AudienceOption[]>([]);
  const [rows, setRows] = useState<AudienceReportRow[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setEntityId("");
    setRows([]);
    setHasRun(false);
    setOptionsLoading(true);
    getAudienceOptions(audience)
      .then((items) => { if (active) setOptions(items); })
      .catch(() => { if (active) setError(`Could not load ${audience} list.`); })
      .finally(() => { if (active) setOptionsLoading(false); });
    return () => { active = false; };
  }, [audience]);

  const selectedName = options.find((item) => String(item.id) === entityId)?.name;
  const dateError = !startDate || !endDate ? "Choose both start and end dates." : startDate > endDate ? "Start date must be before the end date." : "";

  async function runReport() {
    if (dateError) { setError(dateError); return; }
    setRunning(true);
    setError("");
    try {
      setRows(await getAudienceReport(audience, entityId ? Number(entityId) : undefined, startDate, endDate));
      setHasRun(true);
    } catch {
      setRows([]);
      setHasRun(true);
      setError("Could not create this report. Please check the filters and try again.");
    } finally {
      setRunning(false);
    }
  }

  async function download() {
    if (dateError || !hasRun) return;
    setExporting(true);
    try {
      await exportAudienceReport(audience, entityId ? Number(entityId) : undefined, startDate, endDate);
      toast.success("Report downloaded.");
    } catch {
      toast.error("Could not export this report.");
    } finally {
      setExporting(false);
    }
  }

  const totalBookings = rows.reduce((sum, row) => sum + Number(row.bookings || 0), 0);
  const totalValue = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  return (
    <ModuleWrapper title="Create Report" requiredPermission="reports.view">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-dash-brand">Report builder</p>
            <h1 className="mt-1 text-[28px] font-black tracking-tight text-dash-text">Create a focused report</h1>
            <p className="mt-1 max-w-2xl text-sm text-dash-muted">Select a date range and report group, then view everyone or narrow the result to one record.</p>
          </div>
          {hasRun && (
            <button type="button" onClick={() => void download()} disabled={exporting || rows.length === 0} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-dash-border bg-white px-4 text-sm font-bold text-dash-text transition hover:border-dash-brand hover:text-dash-brand active:translate-y-px disabled:opacity-50">
              {exporting ? <LoaderCircle className="animate-spin" size={17} /> : <Download size={17} />} Export CSV
            </button>
          )}
        </div>

        <section className="overflow-hidden rounded-2xl border border-dash-border-soft bg-white shadow-[0_8px_30px_-24px_rgba(23,92,211,.35)]">
          <div className="grid border-b border-dash-border-soft lg:grid-cols-[1.15fr_1fr]">
            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-black text-dash-text"><FileChartColumn size={18} className="text-dash-brand" /> Report group</div>
              <div className="grid gap-2 sm:grid-cols-3">
                {AUDIENCES.map((item) => {
                  const Icon = item.icon;
                  const selected = audience === item.value;
                  return (
                    <button key={item.value} type="button" onClick={() => setAudience(item.value)} aria-pressed={selected} className={`rounded-xl border p-4 text-left transition active:translate-y-px ${selected ? "border-dash-brand bg-[#EDF5FF] shadow-[inset_0_0_0_1px_#43A9F6]" : "border-dash-border bg-white hover:border-[#A9CFF0] hover:bg-dash-bg"}`}>
                      <Icon size={19} className={selected ? "text-dash-brand" : "text-dash-muted"} />
                      <p className="mt-3 text-sm font-black text-dash-text">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-dash-muted">{item.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-dash-border-soft bg-dash-bg/60 p-5 sm:p-6 lg:border-l lg:border-t-0">
              <div className="mb-4 flex items-center gap-2 text-sm font-black text-dash-text"><CalendarDays size={18} className="text-dash-brand" /> Date range</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-xs font-bold text-dash-body">Start date</label><DatePicker value={startDate} maxDate={endDate || undefined} onChange={setStartDate} placeholder="Start date" className="w-full" /></div>
                <div><label className="mb-1.5 block text-xs font-bold text-dash-body">End date</label><DatePicker value={endDate} minDate={startDate || undefined} maxDate={inputDate(today)} onChange={setEndDate} placeholder="End date" className="w-full" align="right" /></div>
              </div>
              {dateError && <p className="mt-2 text-xs font-semibold text-red-600">{dateError}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label htmlFor="report-entity" className="mb-1.5 block text-xs font-bold text-dash-body">{AUDIENCES.find((item) => item.value === audience)?.label}</label>
              <select id="report-entity" value={entityId} onChange={(event) => setEntityId(event.target.value)} disabled={optionsLoading} className="h-11 w-full rounded-xl border border-dash-border bg-white px-3.5 text-sm font-semibold text-dash-text outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-100 disabled:opacity-60">
                <option value="">All {audience}s</option>
                {options.map((item) => <option key={item.id} value={item.id}>{item.name} (ID {item.id})</option>)}
              </select>
              <p className="mt-1.5 text-xs text-dash-subtle">Choose All for a complete list, or select one {audience} for an ID-based report.</p>
            </div>
            <button type="button" onClick={() => void runReport()} disabled={running || optionsLoading || Boolean(dateError)} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-dash-brand px-6 text-sm font-black text-white shadow-[0_8px_18px_-10px_rgba(23,92,211,.8)] transition hover:bg-dash-brand-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 lg:w-auto">
              {running ? <LoaderCircle className="animate-spin" size={18} /> : <FileChartColumn size={18} />} Generate report
            </button>
          </div>
        </section>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        {hasRun && !error && (
          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {[{ label: `${audience}s included`, value: rows.length }, { label: "Total bookings", value: totalBookings }, { label: "Total value", value: money(totalValue) }].map((item) => <div key={item.label} className="rounded-xl border border-dash-border-soft bg-white px-5 py-4"><p className="text-xs font-bold text-dash-muted">{item.label}</p><p className="mt-1 text-2xl font-black text-dash-text">{item.value}</p></div>)}
            </div>
            <div className="overflow-hidden rounded-2xl border border-dash-border-soft bg-white">
              <div className="flex flex-col gap-1 border-b border-dash-border-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="font-black text-dash-text">{selectedName || `All ${audience}s`}</h2><p className="text-xs text-dash-muted">{startDate} to {endDate}</p></div>
                <p className="text-xs font-bold text-dash-muted">{rows.length} result{rows.length === 1 ? "" : "s"}</p>
              </div>
              {rows.length === 0 ? <div className="px-5 py-14 text-center"><p className="font-bold text-dash-text">No report data found</p><p className="mt-1 text-sm text-dash-muted">Try a wider date range or choose All {audience}s.</p></div> : (
                <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-dash-bg text-xs text-dash-muted"><tr><th className="px-5 py-3 font-bold">ID</th><th className="px-5 py-3 font-bold">Name</th><th className="px-5 py-3 font-bold">Bookings</th><th className="px-5 py-3 font-bold">Booking value</th>{audience === "agent" && <><th className="px-5 py-3 font-bold">Commission paid</th><th className="px-5 py-3 font-bold">Outstanding</th></>}{audience === "customer" && <th className="px-5 py-3 font-bold">Pending</th>}</tr></thead><tbody className="divide-y divide-dash-border-soft">{rows.map((row) => {
                  const id = "supplier_id" in row ? row.supplier_id : "agent_id" in row ? row.agent_id : row.customer_id;
                  const name = "supplier_name" in row ? row.supplier_name : "agent_name" in row ? row.agent_name : row.customer_name;
                  return <tr key={id} className="hover:bg-dash-bg/60"><td className="px-5 py-3 font-semibold text-dash-muted">#{id}</td><td className="px-5 py-3 font-bold text-dash-text">{name}</td><td className="px-5 py-3 text-dash-body">{row.bookings}</td><td className="px-5 py-3 font-semibold text-dash-text">{money(row.amount)}</td>{"agent_id" in row && <><td className="px-5 py-3 text-emerald-700">{money(row.commission_paid)}</td><td className="px-5 py-3 text-amber-700">{money(row.commission_outstanding)}</td></>}{"customer_id" in row && <td className="px-5 py-3 text-amber-700">{money(row.pending)}</td>}</tr>;
                })}</tbody></table></div>
              )}
            </div>
          </section>
        )}
      </div>
    </ModuleWrapper>
  );
}
