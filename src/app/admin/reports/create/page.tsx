"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  LuBriefcaseBusiness as BriefcaseBusiness,
  LuBuilding2 as Building2,
  LuCalendarDays as CalendarDays,
  LuCircleDollarSign as CircleDollarSign,
  LuDownload as Download,
  LuEye as Eye,
  LuFileChartColumn as FileChartColumn,
  LuLoaderCircle as LoaderCircle,
  LuPrinter as Printer,
  LuReceiptText as ReceiptText,
  LuSearch as Search,
  LuUsers as Users,
  LuWalletCards as WalletCards,
  LuX as X,
} from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DatePicker from "@/components/ui/DatePicker";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/useToast";
import {
  AudienceOption,
  AudienceReportDetail,
  AudienceReportRow,
  exportAudienceReport,
  getAudienceOptions,
  getAudienceReport,
  getAudienceReportDetail,
  ReportAudience,
} from "@/lib/api/services/reportService";

const AUDIENCES: Array<{ value: ReportAudience; label: string; description: string; icon: typeof Building2 }> = [
  { value: "supplier", label: "Supplier", description: "Bookings and gross revenue", icon: Building2 },
  { value: "agent", label: "Agent", description: "Sales and commissions", icon: BriefcaseBusiness },
  { value: "customer", label: "Customer", description: "Bookings, spend and pending", icon: Users },
];

const AUDIENCE_DETAIL_COPY: Record<ReportAudience, { title: string; valueLabel: string; explanation: string; flow: string[] }> = {
  supplier: {
    title: "Supplier end-to-end report",
    valueLabel: "Supplier net earnings",
    explanation: "Trace every assigned booking from customer value and collection through to the supplier's net payable and Tourvaa revenue.",
    flow: ["Assigned bookings", "Customer collections", "Supplier net payable", "Tourvaa revenue"],
  },
  agent: {
    title: "Agent end-to-end report",
    valueLabel: "Agent commission earned",
    explanation: "Trace every agent booking from customer value and collection through to earned commission and Tourvaa revenue.",
    flow: ["Agent bookings", "Customer collections", "Agent commission", "Tourvaa revenue"],
  },
  customer: {
    title: "Customer end-to-end report",
    valueLabel: "Customer paid",
    explanation: "Trace the customer's complete booking history, travel volume, payments, outstanding balance and Tourvaa revenue.",
    flow: ["Bookings placed", "Travel and travellers", "Paid and outstanding", "Tourvaa revenue"],
  },
};

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
  const [detail, setDetail] = useState<AudienceReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const detailRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  useEffect(() => {
    let active = true;
    setEntityId("");
    setRows([]);
    setHasRun(false);
    setSearch("");
    setStatusFilter("");
    setDetail(null);
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
      setDetail(null);
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

  async function openDetail(row: AudienceReportRow) {
    const id = "supplier_id" in row ? row.supplier_id : "agent_id" in row ? row.agent_id : row.customer_id;
    setDetailLoading(true);
    setDetailError("");
    setBookingSearch("");
    setBookingStatus("");
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    try {
      setDetail(await getAudienceReportDetail(audience, id, startDate, endDate));
    } catch {
      setDetail(null);
      setDetailError("Could not load the booking-level report. Please try again.");
    } finally {
      setDetailLoading(false);
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
  const detailBookings = useMemo(() => {
    if (!detail) return [];
    const needle = bookingSearch.trim().toLowerCase();
    return detail.bookings.filter((booking) => {
      const matchesSearch = !needle || [booking.booking_code, booking.tour_name, booking.customer_name].some((value) => String(value || "").toLowerCase().includes(needle));
      return matchesSearch && (!bookingStatus || booking.booking_status === bookingStatus);
    });
  }, [detail, bookingSearch, bookingStatus]);
  const detailName = detail ? ("supplier_name" in detail.identity ? detail.identity.supplier_name : "agent_name" in detail.identity ? detail.identity.agent_name : detail.identity.customer_name) : "";
  const detailBookingStatuses = detail ? Array.from(new Set(detail.bookings.map((booking) => booking.booking_status))).sort() : [];
  const detailCopy = AUDIENCE_DETAIL_COPY[audience];
  const partnerEarningsLabel = detailCopy.valueLabel;

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
                  return <tr key={id} className="align-top hover:bg-dash-bg/60"><td className="px-4 py-4"><p className="font-black text-dash-text">#{id}</p><p className="mt-1 text-xs text-dash-muted">{row.code || "No code"}</p></td><td className="px-4 py-4"><p className="font-bold text-dash-text">{name}</p><p className="mt-1 text-xs text-dash-muted">{row.email || "No email"}</p><p className="mt-0.5 text-xs text-dash-subtle">{row.phone || "No phone"}</p></td><td className="px-4 py-4"><StatusBadge value={row.status || "unknown"} /></td><td className="px-4 py-4"><StatusBadge value={row.approval_status || "pending"} /></td><td className="px-4 py-4 font-semibold text-dash-body">{row.bookings}</td><td className="px-4 py-4 font-bold text-dash-text">{money(row.amount)}</td>{"agent_id" in row && <><td className="px-4 py-4 text-dash-body">{money(row.commission_earned)}</td><td className="px-4 py-4 font-semibold text-emerald-700">{money(row.commission_paid)}</td><td className="px-4 py-4 font-semibold text-amber-700">{money(row.commission_outstanding)}</td></>}{"customer_id" in row && <td className="px-4 py-4 font-semibold text-amber-700">{money(row.pending)}</td>}<td className="px-4 py-4 text-right print:hidden"><button type="button" onClick={() => void openDetail(row)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dash-border bg-white px-3 text-xs font-black text-dash-brand transition hover:border-dash-brand hover:bg-[#EDF5FF] active:translate-y-px"><Eye size={15} /> View report</button></td></tr>;
                })}</tbody></table></div>
              )}
              {filteredRows.length > pageSize && <div className="flex items-center justify-between border-t border-dash-border-soft px-4 py-3 print:hidden"><p className="text-xs font-semibold text-dash-muted">Page {page} of {totalPages}</p><div className="flex gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="h-9 rounded-lg border border-dash-border px-3 text-xs font-bold text-dash-body disabled:opacity-40">Previous</button><button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="h-9 rounded-lg border border-dash-border px-3 text-xs font-bold text-dash-body disabled:opacity-40">Next</button></div></div>}
            </div>

            <div ref={detailRef} className="scroll-mt-24">
              {detailLoading && <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dash-border-soft bg-white"><LoaderCircle className="animate-spin text-dash-brand" size={26} /><span className="ml-3 text-sm font-bold text-dash-muted">Building booking-level report...</span></div>}
              {detailError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{detailError}</div>}
              {detail && !detailLoading && (
                <div className="overflow-hidden rounded-2xl border border-dash-border-soft bg-white shadow-[0_16px_50px_-38px_rgba(23,92,211,.55)]">
                  <div className="flex flex-col gap-4 border-b border-dash-border-soft bg-[#F7FBFF] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-dash-brand">{detailCopy.title}</p>
                      <h2 className="mt-1 text-xl font-black text-dash-text">{detailName}</h2>
                      <p className="mt-1 max-w-3xl text-sm text-dash-muted">{detailCopy.explanation} Reporting period: {startDate} to {endDate}.</p>
                    </div>
                    <div className="flex items-center gap-2 print:hidden">
                      <Link href={`/admin/${audience}s/${"supplier_id" in detail.identity ? detail.identity.supplier_id : "agent_id" in detail.identity ? detail.identity.agent_id : detail.identity.customer_id}`} className="inline-flex h-10 items-center rounded-lg border border-dash-border bg-white px-3 text-xs font-black text-dash-brand hover:border-dash-brand">Open profile</Link>
                      <button type="button" onClick={() => setDetail(null)} aria-label="Close detailed report" className="grid h-10 w-10 place-items-center rounded-lg border border-dash-border bg-white text-dash-muted hover:border-dash-brand hover:text-dash-brand"><X size={17} /></button>
                    </div>
                  </div>

                  <div className="grid border-b border-dash-border-soft bg-white sm:grid-cols-2 xl:grid-cols-4">
                    {detailCopy.flow.map((step, index) => <div key={step} className="flex items-center gap-3 border-dash-border-soft px-5 py-3.5 sm:border-r last:border-r-0"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#EDF5FF] text-xs font-black text-dash-brand">{index + 1}</span><span className="text-xs font-bold text-dash-body">{step}</span></div>)}
                  </div>

                  <div className="grid gap-px bg-dash-border-soft sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      { label: "Bookings", value: detail.summary.bookings, icon: ReceiptText },
                      { label: "Travellers", value: detail.summary.travellers, icon: Users },
                      { label: "Gross booking value", value: money(detail.summary.booking_value), icon: CircleDollarSign },
                      { label: partnerEarningsLabel, value: money(detail.summary.partner_earnings), icon: WalletCards },
                      { label: "Collected", value: money(detail.summary.paid), icon: CircleDollarSign },
                      { label: "Outstanding", value: money(detail.summary.pending), icon: ReceiptText },
                      { label: "Tourvaa revenue", value: money(detail.summary.tourvaa_revenue), icon: FileChartColumn },
                      { label: "Collection rate", value: `${Number(detail.summary.booking_value) > 0 ? Math.round((Number(detail.summary.paid) / Number(detail.summary.booking_value)) * 100) : 0}%`, icon: FileChartColumn },
                    ].map((item) => { const Icon = item.icon; return <div key={item.label} className="bg-white p-5"><Icon size={18} className="text-dash-brand" /><p className="mt-3 text-xs font-bold text-dash-muted">{item.label}</p><p className="mt-1 text-xl font-black text-dash-text">{item.value}</p></div>; })}
                  </div>

                  <div className="grid border-t border-dash-border-soft lg:grid-cols-2">
                    <div className="p-5 sm:p-6 lg:border-r lg:border-dash-border-soft">
                      <h3 className="text-sm font-black text-dash-text">Booking status</h3>
                      <div className="mt-4 space-y-3">{detail.status_breakdown.length === 0 ? <p className="text-sm text-dash-muted">No bookings in this period.</p> : detail.status_breakdown.map((item) => <div key={item.status} className="flex items-center justify-between"><span className="text-sm font-semibold capitalize text-dash-body">{readable(item.status)}</span><span className="rounded-md bg-dash-bg px-2.5 py-1 text-xs font-black text-dash-text">{item.count}</span></div>)}</div>
                    </div>
                    <div className="p-5 sm:p-6">
                      <h3 className="text-sm font-black text-dash-text">Payment status</h3>
                      <div className="mt-4 space-y-3">{detail.payment_breakdown.length === 0 ? <p className="text-sm text-dash-muted">No payment activity in this period.</p> : detail.payment_breakdown.map((item) => <div key={item.status} className="flex items-center justify-between"><span className="text-sm font-semibold capitalize text-dash-body">{readable(item.status)}</span><span className="rounded-md bg-dash-bg px-2.5 py-1 text-xs font-black text-dash-text">{item.count}</span></div>)}</div>
                    </div>
                  </div>

                  <div className="border-t border-dash-border-soft">
                    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div><h3 className="font-black text-dash-text">Bookings included</h3><p className="text-xs text-dash-muted">{detailBookings.length} of {detail.bookings.length} bookings shown</p></div>
                      <div className="flex flex-col gap-2 sm:flex-row print:hidden"><label className="relative"><span className="sr-only">Search bookings</span><Search size={15} className="absolute left-3 top-3 text-dash-subtle" /><input value={bookingSearch} onChange={(event) => setBookingSearch(event.target.value)} placeholder="Booking, tour or customer" className="h-10 rounded-lg border border-dash-border bg-white pl-9 pr-3 text-sm outline-none focus:border-dash-brand" /></label><select value={bookingStatus} onChange={(event) => setBookingStatus(event.target.value)} className="h-10 rounded-lg border border-dash-border bg-white px-3 text-sm font-semibold text-dash-body"><option value="">All booking statuses</option>{detailBookingStatuses.map((status) => <option key={status} value={status}>{readable(status)}</option>)}</select></div>
                    </div>
                    {detailBookings.length === 0 ? <div className="border-t border-dash-border-soft px-5 py-10 text-center text-sm text-dash-muted">No bookings match the selected filters.</div> : <div className="overflow-x-auto border-t border-dash-border-soft"><table className="w-full min-w-[1260px] text-left text-sm"><thead className="bg-dash-bg text-xs text-dash-muted"><tr><th className="px-4 py-3">Booking</th><th className="px-4 py-3">Tour & customer</th><th className="px-4 py-3">Travel</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Paid / pending</th><th className="px-4 py-3">{partnerEarningsLabel}</th><th className="px-4 py-3">Tourvaa revenue</th><th className="px-4 py-3 text-right print:hidden">Action</th></tr></thead><tbody className="divide-y divide-dash-border-soft">{detailBookings.map((booking) => <tr key={booking.booking_id} className="hover:bg-dash-bg/50"><td className="px-4 py-4"><p className="font-black text-dash-text">{booking.booking_code}</p><p className="mt-1 text-xs text-dash-muted">{booking.booked_at ? new Date(booking.booked_at).toLocaleDateString() : "Date unavailable"}</p></td><td className="px-4 py-4"><p className="font-bold text-dash-text">{booking.tour_name || "Tour unavailable"}</p><p className="mt-1 text-xs text-dash-muted">{booking.customer_name || "Customer unavailable"}</p></td><td className="px-4 py-4"><p className="font-semibold text-dash-body">{booking.travel_date ? new Date(booking.travel_date).toLocaleDateString() : "Not scheduled"}</p><p className="mt-1 text-xs text-dash-muted">{booking.travellers} traveller{booking.travellers === 1 ? "" : "s"}</p></td><td className="px-4 py-4"><StatusBadge value={booking.booking_status} /></td><td className="px-4 py-4"><StatusBadge value={booking.payment_status} /></td><td className="px-4 py-4 font-black text-dash-text">{booking.currency} {Number(booking.booking_value).toLocaleString()}</td><td className="px-4 py-4"><p className="font-semibold text-emerald-700">{booking.currency} {Number(booking.paid).toLocaleString()}</p><p className="mt-1 text-xs font-semibold text-amber-700">Pending {booking.currency} {Number(booking.pending).toLocaleString()}</p></td><td className="px-4 py-4 font-bold text-dash-body">{booking.currency} {Number(booking.partner_earnings).toLocaleString()}</td><td className="px-4 py-4 font-bold text-dash-body">{booking.currency} {Number(booking.tourvaa_revenue).toLocaleString()}</td><td className="px-4 py-4 text-right print:hidden"><Link href={`/admin/bookings/${booking.booking_id}`} className="inline-flex h-9 items-center rounded-lg border border-dash-border px-3 text-xs font-black text-dash-brand hover:border-dash-brand">Open booking</Link></td></tr>)}</tbody></table></div>}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </ModuleWrapper>
  );
}
