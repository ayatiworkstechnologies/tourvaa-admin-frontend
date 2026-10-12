"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuBriefcaseBusiness as BriefcaseBusiness,
  LuBuilding2 as Building2,
  LuCalendarDays as CalendarDays,
  LuDownload as Download,
  LuEye as Eye,
  LuFileChartColumn as FileChartColumn,
  LuLoaderCircle as LoaderCircle,
  LuPrinter as Printer,
  LuSearch as Search,
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

function readable(value: string | null | undefined) {
  return (value || "Not provided").replaceAll("_", " ");
}

function StatusBadge({ value }: { value: string }) {
  const positive = ["active", "approved", "verified"].includes(value.toLowerCase());
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${positive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{readable(value)}</span>;
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
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | "csv" | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "bookings" | "amount">("amount");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let active = true;
    setEntityId("");
    setRows([]);
    setHasRun(false);
    setSearch("");
    setStatusFilter("");
    setPage(1);
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
      setPage(1);
    } catch {
      setRows([]);
      setHasRun(true);
      setError("Could not create this report. Please check the filters and try again.");
    } finally {
      setRunning(false);
    }
  }

  async function download(format: "xlsx" | "pdf" | "csv") {
    if (dateError || !hasRun) return;
    setExporting(format);
    try {
      await exportAudienceReport(audience, entityId ? Number(entityId) : undefined, startDate, endDate, format);
      toast.success(`${format.toUpperCase()} report downloaded.`);
    } catch {
      toast.error("Could not export this report.");
    } finally {
      setExporting(null);
    }
  }

  const totalBookings = rows.reduce((sum, row) => sum + Number(row.bookings || 0), 0);
  const totalValue = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalPending = rows.reduce((sum, row) => sum + Number("pending" in row ? row.pending : "commission_outstanding" in row ? row.commission_outstanding : 0), 0);
  const approvedRecords = rows.filter((row) => ["approved", "verified"].includes(row.approval_status?.toLowerCase())).length;
  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        const id = "supplier_id" in row ? row.supplier_id : "agent_id" in row ? row.agent_id : row.customer_id;
        const name = "supplier_name" in row ? row.supplier_name : "agent_name" in row ? row.agent_name : row.customer_name;
        const matchesSearch = !needle || [id, name, row.code, row.email, row.phone].some((value) => String(value || "").toLowerCase().includes(needle));
        const matchesStatus = !statusFilter || row.status === statusFilter || row.approval_status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((left, right) => {
        if (sortBy === "bookings") return Number(right.bookings) - Number(left.bookings);
        if (sortBy === "amount") return Number(right.amount) - Number(left.amount);
        const leftName = "supplier_name" in left ? left.supplier_name : "agent_name" in left ? left.agent_name : left.customer_name;
        const rightName = "supplier_name" in right ? right.supplier_name : "agent_name" in right ? right.agent_name : right.customer_name;
        return leftName.localeCompare(rightName);
      });
  }, [rows, search, statusFilter, sortBy]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const availableStatuses = useMemo(() => Array.from(new Set(rows.flatMap((row) => [row.status, row.approval_status]).filter(Boolean))).sort(), [rows]);

  useEffect(() => { setPage(1); }, [search, statusFilter, sortBy]);

  return (
    <ModuleWrapper title="Create Report" requiredPermission="reports.view">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-dash-brand">Report builder</p>
            <h1 className="mt-1 text-[28px] font-black tracking-tight text-dash-text">Create a focused report</h1>
            <p className="mt-1 max-w-2xl text-sm text-dash-muted">Select a date range and report group, then view everyone or narrow the result to one record.</p>
          </div>
          {hasRun && <div className="flex flex-wrap gap-2 print:hidden"><button type="button" onClick={() => window.print()} disabled={rows.length === 0} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-dash-border bg-white px-4 text-sm font-bold text-dash-text transition hover:border-dash-brand hover:text-dash-brand active:translate-y-px disabled:opacity-50"><Printer size={17} /> Print</button>{(["xlsx", "pdf", "csv"] as const).map((format) => <button key={format} type="button" onClick={() => void download(format)} disabled={Boolean(exporting) || rows.length === 0} className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition active:translate-y-px disabled:opacity-50 ${format === "xlsx" ? "bg-dash-brand text-white hover:bg-dash-brand-hover" : "border border-dash-border bg-white text-dash-text hover:border-dash-brand hover:text-dash-brand"}`}>{exporting === format ? <LoaderCircle className="animate-spin" size={17} /> : <Download size={17} />} {format === "xlsx" ? "Excel" : format.toUpperCase()}</button>)}</div>}
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
              <div className="mt-3 flex flex-wrap gap-2 print:hidden">
                {[7, 30, 90].map((days) => <button key={days} type="button" onClick={() => { const start = new Date(today); start.setDate(start.getDate() - days); setStartDate(inputDate(start)); setEndDate(inputDate(today)); }} className="rounded-lg border border-dash-border bg-white px-3 py-1.5 text-xs font-bold text-dash-muted transition hover:border-dash-brand hover:text-dash-brand">Last {days} days</button>)}
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
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[{ label: `${audience}s included`, value: rows.length }, { label: "Approved / verified", value: approvedRecords }, { label: "Total bookings", value: totalBookings }, { label: "Total booking value", value: money(totalValue) }, ...(audience !== "supplier" ? [{ label: audience === "agent" ? "Commission outstanding" : "Customer pending", value: money(totalPending) }] : [])].map((item) => <div key={item.label} className="rounded-xl border border-dash-border-soft bg-white px-5 py-4"><p className="text-xs font-bold text-dash-muted">{item.label}</p><p className="mt-1 text-2xl font-black text-dash-text">{item.value}</p></div>)}
            </div>
            <div className="overflow-hidden rounded-2xl border border-dash-border-soft bg-white">
              <div className="flex flex-col gap-1 border-b border-dash-border-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="font-black text-dash-text">{selectedName || `All ${audience}s`}</h2><p className="text-xs text-dash-muted">Reporting period: {startDate} to {endDate}</p></div>
                <p className="text-xs font-bold text-dash-muted">{filteredRows.length} of {rows.length} result{rows.length === 1 ? "" : "s"}</p>
              </div>
              {rows.length > 0 && <div className="grid gap-3 border-b border-dash-border-soft bg-dash-bg/40 p-4 sm:grid-cols-[minmax(220px,1fr)_180px_180px] print:hidden"><label className="relative"><span className="sr-only">Search report</span><Search size={16} className="pointer-events-none absolute left-3 top-3 text-dash-subtle" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, ID, email, phone…" className="h-10 w-full rounded-lg border border-dash-border bg-white pl-9 pr-3 text-sm text-dash-text outline-none focus:border-dash-brand focus:ring-2 focus:ring-blue-100" /></label><select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-dash-border bg-white px-3 text-sm font-semibold text-dash-body"><option value="">All statuses</option>{availableStatuses.map((status) => <option key={status} value={status}>{readable(status)}</option>)}</select><select aria-label="Sort report" value={sortBy} onChange={(event) => setSortBy(event.target.value as "name" | "bookings" | "amount")} className="h-10 rounded-lg border border-dash-border bg-white px-3 text-sm font-semibold text-dash-body"><option value="amount">Highest value</option><option value="bookings">Most bookings</option><option value="name">Name A to Z</option></select></div>}
              {rows.length === 0 ? <div className="px-5 py-14 text-center"><p className="font-bold text-dash-text">No report data found</p><p className="mt-1 text-sm text-dash-muted">Try a wider date range or choose All {audience}s.</p></div> : filteredRows.length === 0 ? <div className="px-5 py-12 text-center"><p className="font-bold text-dash-text">No matching rows</p><p className="mt-1 text-sm text-dash-muted">Clear the search or status filter to see the full report.</p></div> : (
                <div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-sm"><thead className="bg-dash-bg text-xs text-dash-muted"><tr><th className="px-4 py-3 font-bold">ID / Code</th><th className="px-4 py-3 font-bold">Name & contact</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 font-bold">Approval</th><th className="px-4 py-3 font-bold">Bookings</th><th className="px-4 py-3 font-bold">Booking value</th>{audience === "agent" && <><th className="px-4 py-3 font-bold">Commission earned</th><th className="px-4 py-3 font-bold">Paid</th><th className="px-4 py-3 font-bold">Outstanding</th></>}{audience === "customer" && <th className="px-4 py-3 font-bold">Pending</th>}<th className="px-4 py-3 text-right font-bold print:hidden">Action</th></tr></thead><tbody className="divide-y divide-dash-border-soft">{visibleRows.map((row) => {
                  const id = "supplier_id" in row ? row.supplier_id : "agent_id" in row ? row.agent_id : row.customer_id;
                  const name = "supplier_name" in row ? row.supplier_name : "agent_name" in row ? row.agent_name : row.customer_name;
                  const detailHref = `/admin/${audience}s/${id}`;
                  return <tr key={id} className="align-top hover:bg-dash-bg/60"><td className="px-4 py-4"><p className="font-black text-dash-text">#{id}</p><p className="mt-1 text-xs text-dash-muted">{row.code || "No code"}</p></td><td className="px-4 py-4"><p className="font-bold text-dash-text">{name}</p><p className="mt-1 text-xs text-dash-muted">{row.email || "No email"}</p><p className="mt-0.5 text-xs text-dash-subtle">{row.phone || "No phone"}</p></td><td className="px-4 py-4"><StatusBadge value={row.status || "unknown"} /></td><td className="px-4 py-4"><StatusBadge value={row.approval_status || "pending"} /></td><td className="px-4 py-4 font-semibold text-dash-body">{row.bookings}</td><td className="px-4 py-4 font-bold text-dash-text">{money(row.amount)}</td>{"agent_id" in row && <><td className="px-4 py-4 text-dash-body">{money(row.commission_earned)}</td><td className="px-4 py-4 font-semibold text-emerald-700">{money(row.commission_paid)}</td><td className="px-4 py-4 font-semibold text-amber-700">{money(row.commission_outstanding)}</td></>}{"customer_id" in row && <td className="px-4 py-4 font-semibold text-amber-700">{money(row.pending)}</td>}<td className="px-4 py-4 text-right print:hidden"><Link href={detailHref} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dash-border bg-white px-3 text-xs font-black text-dash-brand transition hover:border-dash-brand hover:bg-[#EDF5FF] active:translate-y-px"><Eye size={15} /> View</Link></td></tr>;
                })}</tbody></table></div>
              )}
              {filteredRows.length > pageSize && <div className="flex items-center justify-between border-t border-dash-border-soft px-4 py-3 print:hidden"><p className="text-xs font-semibold text-dash-muted">Page {page} of {totalPages}</p><div className="flex gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="h-9 rounded-lg border border-dash-border px-3 text-xs font-bold text-dash-body disabled:opacity-40">Previous</button><button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="h-9 rounded-lg border border-dash-border px-3 text-xs font-bold text-dash-body disabled:opacity-40">Next</button></div></div>}
            </div>
          </section>
        )}
      </div>
    </ModuleWrapper>
  );
}
