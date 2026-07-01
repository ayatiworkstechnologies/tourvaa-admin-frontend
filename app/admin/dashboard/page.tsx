"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CircleDollarSign,
  PackageCheck,
  Users,
  Warehouse,
  Mail,
  Headset,
  Filter,
  BarChart3,
  CreditCard,
  TrendingUp,
  UserPlus,
  Shield,
  Activity,
  AlertTriangle,
  Clock,
  ChevronRight,
  Home,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDashboard } from "@/hooks/useDashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/api";
import { useCurrency } from "@/hooks/useCurrency";
import { ReportSnapshot } from "@/lib/services/reportService";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

// ─── types ──────────────────────────────────────────────────────────────────

type Summary = {
  total_bookings?: number;
  total_customers?: number;
  total_suppliers?: number;
  total_agents?: number;
  total_tours?: number;
  total_revenue?: number;
  pending_suppliers?: number;
  pending_agents?: number;
  pending_payments?: number;
};

type PendingSupplier = { id: number; supplier_name: string; email?: string; approval_status?: string; status?: string };
type PendingAgent   = { id: number; agent_name: string; email?: string; approval_status?: string; status?: string };
type Country        = { id: number; country_name: string };
type ChartRow        = { status: string; count: number };
type Charts           = { booking_status_chart?: ChartRow[]; payment_status_chart?: ChartRow[] };
type ActivityLog      = { action: string; entity_type: string; entity_id: number };

// ─── helpers ────────────────────────────────────────────────────────────────

function formatRevenue(raw: number): string {
  if (raw >= 10_000_000) return `₹${(raw / 10_000_000).toFixed(1)}Cr`;
  if (raw >= 100_000)    return `₹${(raw / 100_000).toFixed(1)}L`;
  if (raw >= 1_000)      return `₹${(raw / 1_000).toFixed(1)}K`;
  return `₹${raw.toFixed(0)}`;
}

function changeBadge(pct: number) {
  if (pct === 0) return <span className="text-[#667085]">No change</span>;
  const up = pct > 0;
  return (
    <span className={up ? "text-emerald-600" : "text-red-500"}>
      {up ? "+" : ""}{pct}%
    </span>
  );
}

// ─── main content ───────────────────────────────────────────────────────────

function AdminDashboardContent({ user }: { user: { name: string; role: { name: string } } }) {
  const { formatCompact } = useCurrency();

  // data state
  const [summary,          setSummary]          = useState<Summary>({});
  const [pendingSuppliers, setPendingSuppliers] = useState<PendingSupplier[]>([]);
  const [pendingAgents,    setPendingAgents]    = useState<PendingAgent[]>([]);
  const [charts,           setCharts]           = useState<Charts>({});
  const [activities,       setActivities]       = useState<ActivityLog[]>([]);
  const [snapshot,         setSnapshot]         = useState<ReportSnapshot | null>(null);
  const [countries,        setCountries]        = useState<Country[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [savingId,         setSavingId]         = useState<string | null>(null);
  const [msg,              setMsg]              = useState("");

  // filter form state (only applied when user clicks "Apply")
  const [fStart,   setFStart]   = useState("");
  const [fEnd,     setFEnd]     = useState("");
  const [fCountry, setFCountry] = useState("");
  // active filters — what the load() actually uses
  const [activeFilters, setActiveFilters] = useState({ start: "", end: "", country: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const p: Record<string, string> = {};
    if (activeFilters.start)   p.start_date  = activeFilters.start;
    if (activeFilters.end)     p.end_date    = activeFilters.end;
    if (activeFilters.country) p.country_id  = activeFilters.country;

    try {
      const [sumRes, suppRes, agentRes, chartRes, actRes, snapRes, countryRes] =
        await Promise.allSettled([
          api.get("/dashboard/summary"),
          api.get("/suppliers",  { params: { limit: 1000 } }),
          api.get("/agents",     { params: { limit: 1000 } }),
          api.get("/dashboard/charts",           { params: p }),
          api.get("/dashboard/recent-activities"),
          api.get("/reports/snapshot"),
          api.get("/countries", { params: { limit: 200 } }),
        ]);

      if (sumRes.status     === "fulfilled") setSummary(sumRes.value.data?.data ?? {});
      const pendingStatuses = new Set(["pending", "email_verification_pending", "profile_incomplete", "documents_pending", "admin_review_pending", "partial_approved", "partially_approved"]);
      if (suppRes.status    === "fulfilled") {
        const items = suppRes.value.data?.items ?? suppRes.value.data?.data ?? [];
        setPendingSuppliers(items.filter((item: PendingSupplier) => pendingStatuses.has(String(item.approval_status || "").toLowerCase())));
      }
      if (agentRes.status   === "fulfilled") {
        const items = agentRes.value.data?.items ?? agentRes.value.data?.data ?? [];
        setPendingAgents(items.filter((item: PendingAgent) => pendingStatuses.has(String(item.approval_status || "").toLowerCase())));
      }
      if (chartRes.status   === "fulfilled") setCharts(chartRes.value.data?.data ?? {});
      if (actRes.status     === "fulfilled") setActivities(actRes.value.data?.data?.recent_admin_actions ?? []);
      if (snapRes.status    === "fulfilled") setSnapshot(snapRes.value.data?.data ?? null);
      if (countryRes.status === "fulfilled") setCountries(countryRes.value.data?.items ?? countryRes.value.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => { void load(); }, [load]);

  // flash message auto-clear
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 3000);
    return () => clearTimeout(t);
  }, [msg]);

  // ── approval actions ──
  const approveSupplier = async (id: number) => {
    setSavingId(`s-${id}`);
    try {
      await api.patch(`/suppliers/${id}/approve`);
      setPendingSuppliers((p) => p.filter((s) => s.id !== id));
      setMsg("Supplier approved.");
    } catch { setMsg("Could not approve supplier."); }
    finally { setSavingId(null); }
  };

  const rejectSupplier = async (id: number) => {
    const reason = window.prompt("Rejection reason:", "Does not meet requirements");
    if (!reason) return;
    setSavingId(`s-${id}`);
    try {
      await api.patch(`/suppliers/${id}/reject`, { rejection_reason: reason });
      setPendingSuppliers((p) => p.filter((s) => s.id !== id));
      setMsg("Supplier rejected.");
    } catch { setMsg("Could not reject supplier."); }
    finally { setSavingId(null); }
  };

  const approveAgent = async (id: number) => {
    setSavingId(`a-${id}`);
    try {
      await api.patch(`/agents/${id}/approve`);
      setPendingAgents((p) => p.filter((a) => a.id !== id));
      setMsg("Agent approved.");
    } catch { setMsg("Could not approve agent."); }
    finally { setSavingId(null); }
  };

  const rejectAgent = async (id: number) => {
    const reason = window.prompt("Rejection reason:", "Does not meet requirements");
    if (!reason) return;
    setSavingId(`a-${id}`);
    try {
      await api.patch(`/agents/${id}/reject`, { rejection_reason: reason });
      setPendingAgents((p) => p.filter((a) => a.id !== id));
      setMsg("Agent rejected.");
    } catch { setMsg("Could not reject agent."); }
    finally { setSavingId(null); }
  };

  // ── stat cards ──
  const stats = [
    { label: "Total Bookings",   value: summary.total_bookings  ?? 0,                        icon: CalendarCheck,    sub: "All bookings" },
    { label: "Total Customers",  value: summary.total_customers ?? 0,                        icon: Users,            sub: "Platform" },
    { label: "Pending Payments", value: summary.pending_payments ?? 0,                       icon: Mail,             sub: "Awaiting payment" },
    { label: "Total Revenue",    value: formatCompact(summary.total_revenue),                icon: CircleDollarSign, sub: "Captured" },
    { label: "Suppliers",        value: summary.total_suppliers ?? 0,                        icon: PackageCheck,     sub: `${summary.pending_suppliers ?? 0} pending` },
    { label: "Agents",           value: summary.total_agents    ?? 0,                        icon: Headset,          sub: `${summary.pending_agents ?? 0} pending` },
  ];

  // ── chart colours ──
  const PIE_COLORS = ["#43A9F6", "#1D3E64", "#F59E0B", "#EF4444", "#10B981"];

  return (
    <div className="space-y-6 pb-10 font-sans">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-[13px] font-semibold text-[#667085]">
        <Link href="/admin/dashboard" className="flex items-center gap-1 hover:text-[#43A9F6] transition-colors">
          <Home size={14} /> Home
        </Link>
        <ChevronRight size={13} className="text-[#D0D5DD]" />
        <span className="text-[#121826]">Dashboard</span>
      </nav>

      {/* ── Flash message ── */}
      {msg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700">
          {msg}
        </div>
      )}

      {/* ── 1. Hero card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0B1120] via-[#1D3E64] to-[#43A9F6] p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="relative z-10">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#43A9F6] backdrop-blur-md">
            Admin Control Center
          </span>
          <h2 className="mt-4 text-[28px] font-black leading-tight tracking-tight text-white">
            Platform operations at a glance
          </h2>
          <p className="mt-2 max-w-lg text-sm text-white/80">
            Manage approvals, users, roles, and system activity from one workspace.
          </p>
        </div>
        <div className="relative z-10 shrink-0 flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-8 py-5 shadow-xl backdrop-blur-md">
          <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Signed in as</span>
          <span className="text-xl font-black leading-none text-white">{user.name}</span>
          <span className="mt-1 text-xs text-white/70">{user.role.name}</span>
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* ── 2. Stat cards ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="group flex cursor-pointer items-center gap-5 rounded-3xl border border-[#E7EAF0]/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-[#43A9F6]/30 hover:shadow-xl">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F0F7FF] text-[#43A9F6] shadow-sm transition-colors duration-300 group-hover:bg-[#43A9F6] group-hover:text-white">
              <stat.icon size={24} strokeWidth={2} />
            </div>
            <div className="flex flex-1 flex-col justify-between self-stretch">
              <span className="text-xs font-bold uppercase tracking-wider text-[#667085]">{stat.label}</span>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-2xl font-black text-[#121826]">{stat.value}</span>
                <span className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-[#667085]">
                  {stat.sub}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Filters ── */}
      <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <div className="mb-5">
          <h2 className="text-base font-black text-[#121826]">Dashboard Filters</h2>
          <p className="mt-0.5 text-xs font-semibold text-[#667085]">Filter analytics by date range or country, then press Apply.</p>
        </div>
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Start date */}
          <div>
            <label htmlFor="filter-start" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#667085]">Start Date</label>
            <input
              id="filter-start"
              type="date"
              value={fStart}
              onChange={(e) => setFStart(e.target.value)}
              title="Filter start date"
              className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-semibold text-[#121826] outline-none focus:border-[#43A9F6] focus:ring-1 focus:ring-[#43A9F6]"
            />
          </div>
          {/* End date */}
          <div>
            <label htmlFor="filter-end" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#667085]">End Date</label>
            <input
              id="filter-end"
              type="date"
              value={fEnd}
              onChange={(e) => setFEnd(e.target.value)}
              title="Filter end date"
              className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-semibold text-[#121826] outline-none focus:border-[#43A9F6] focus:ring-1 focus:ring-[#43A9F6]"
            />
          </div>
          {/* Country */}
          <div>
            <label htmlFor="filter-country" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#667085]">Country</label>
            <select
              id="filter-country"
              value={fCountry}
              onChange={(e) => setFCountry(e.target.value)}
              title="Filter by country"
              className="w-full appearance-none rounded-xl border border-[#E7EAF0] bg-white px-4 py-2.5 text-sm font-semibold text-[#121826] outline-none focus:border-[#43A9F6] focus:ring-1 focus:ring-[#43A9F6]"
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.country_name}</option>
              ))}
            </select>
          </div>
          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveFilters({ start: fStart, end: fEnd, country: fCountry })}
              className="flex h-10.5 flex-1 items-center justify-center gap-2 rounded-xl bg-[#43A9F6] px-4 text-sm font-bold text-white hover:bg-[#2196e0] transition-colors"
            >
              <Filter size={14} /> Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setFStart(""); setFEnd(""); setFCountry("");
                setActiveFilters({ start: "", end: "", country: "" });
              }}
              className="flex h-10.5 items-center justify-center gap-1.5 rounded-xl border border-[#E7EAF0] bg-white px-4 text-sm font-bold text-[#344054] hover:bg-[#F3F8FC] transition-colors"
            >
              <RefreshCw size={13} /> Reset
            </button>
          </div>
        </div>
        {(activeFilters.start || activeFilters.end || activeFilters.country) && (
          <p className="mt-3 text-[11px] font-semibold text-[#43A9F6]">
            Active filter: {[activeFilters.start, activeFilters.end && `→ ${activeFilters.end}`, countries.find(c => String(c.id) === activeFilters.country)?.country_name].filter(Boolean).join(" ")}
          </p>
        )}
      </div>

      {/* ── 4. Charts ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="mb-4 flex items-center gap-2 text-[#121826]">
            <BarChart3 size={18} className="text-[#43A9F6]" />
            <h2 className="text-base font-black">Booking Analytics</h2>
          </div>
          {loading ? (
            <div className="flex h-55 items-center justify-center text-sm text-[#667085]">Loading...</div>
          ) : (!charts.booking_status_chart || charts.booking_status_chart.length === 0) ? (
            <div className="flex h-55 items-center justify-center text-sm text-[#667085]">No booking data yet.</div>
          ) : (
            <div className="h-55 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.booking_status_chart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7EAF0" />
                  <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#667085" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#667085" }} />
                  <Tooltip cursor={{ fill: "#F7F9FC" }} contentStyle={{ borderRadius: "10px", border: "1px solid #E7EAF0" }} />
                  <Bar dataKey="count" fill="#43A9F6" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="mb-4 flex items-center gap-2 text-[#121826]">
            <CreditCard size={18} className="text-[#43A9F6]" />
            <h2 className="text-base font-black">Payment Status</h2>
          </div>
          {loading ? (
            <div className="flex h-55 items-center justify-center text-sm text-[#667085]">Loading...</div>
          ) : (!charts.payment_status_chart || charts.payment_status_chart.length === 0) ? (
            <div className="flex h-55 items-center justify-center text-sm text-[#667085]">No payment data yet.</div>
          ) : (
            <div className="flex h-55 w-full items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.payment_status_chart} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={4} dataKey="count" nameKey="status">
                    {charts.payment_status_chart.map((_: ChartRow, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #E7EAF0" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Reports Snapshot (dynamic) ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-[#E7EAF0]/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#121826]">
              <TrendingUp size={18} className="text-[#43A9F6]" />
              <h2 className="text-base font-black">Reports Snapshot</h2>
            </div>
            <Link href="/admin/reports" className="flex items-center gap-1 text-xs font-bold text-[#43A9F6] hover:underline">
              View all <ChevronRight size={12} />
            </Link>
          </div>

          {loading || !snapshot ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-22.5 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  label: "Booking Performance",
                  value: snapshot.booking_performance.total,
                  sub: changeBadge(snapshot.booking_performance.change_pct),
                  status: "ready" as const,
                },
                {
                  label: "Revenue Summary",
                  value: formatRevenue(snapshot.revenue_summary.total_raw),
                  sub: changeBadge(snapshot.revenue_summary.change_pct),
                  status: "ready" as const,
                },
                {
                  label: "Supplier Approval",
                  value: snapshot.supplier_approval.total,
                  sub: snapshot.supplier_approval.pending > 0
                    ? <span className="text-amber-600">{snapshot.supplier_approval.pending} pending</span>
                    : <span className="text-emerald-600">All approved</span>,
                  status: snapshot.supplier_approval.pending > 0 ? "review" as const : "ready" as const,
                },
                {
                  label: "Agent Sales",
                  value: snapshot.agent_sales.total,
                  sub: changeBadge(snapshot.agent_sales.change_pct),
                  status: "ready" as const,
                },
                {
                  label: "Payment Collection",
                  value: `${snapshot.payment_collection.collected_pct}%`,
                  sub: snapshot.payment_collection.pending_pct > 0
                    ? <span className="text-amber-600">{snapshot.payment_collection.pending_pct}% pending</span>
                    : <span className="text-emerald-600">Fully collected</span>,
                  status: snapshot.payment_collection.pending_pct > 5 ? "review" as const : "ready" as const,
                },
                {
                  label: "Country-wise Bookings",
                  value: snapshot.country_wise.country_count,
                  sub: <span className="text-[#667085]">countries active</span>,
                  status: "ready" as const,
                },
              ].map((card) => (
                <div key={card.label} className="flex flex-col justify-between rounded-xl border border-[#E7EAF0] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold leading-tight text-[#121826]">{card.label}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wider ${card.status === "ready" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                      {card.status}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-[#43A9F6]">{card.value}</p>
                  <p className="mt-1 text-[11px] font-semibold">{card.sub}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats strip + recent exports */}
        <div className="flex flex-col gap-4">
          <div className="flex divide-x divide-[#E7EAF0] rounded-2xl border border-[#E7EAF0] bg-white">
            {[
              { num: snapshot?.meta.report_types ?? "—", label: "Reports" },
              { num: snapshot?.meta.scheduled     ?? "—", label: "Scheduled" },
              { num: snapshot?.meta.total_exports ?? "—", label: "Exports" },
            ].map(({ num, label }) => (
              <div key={label} className="flex flex-1 flex-col items-center py-4">
                <span className="text-xl font-black text-[#121826]">{num}</span>
                <span className="mt-0.5 text-[10px] font-semibold text-[#667085]">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex-1 rounded-3xl border border-[#E7EAF0]/60 bg-white p-5 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
            <h2 className="mb-4 text-sm font-black text-[#121826]">Recent Exports</h2>
            {!snapshot || snapshot.recent_exports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-[#667085]">No exports yet.</p>
                <p className="mt-1 text-xs text-[#98A2B3]">Run a report export and it appears here.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {snapshot.recent_exports.map((ex) => (
                  <li key={ex.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#E7EAF0] p-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#121826]">{ex.label}</p>
                      <p className="text-[10px] text-[#98A2B3]">{ex.exported_at}</p>
                    </div>
                    <span className="rounded bg-[#F0F7FF] px-2 py-0.5 text-[10px] font-bold text-[#43A9F6]">{ex.format}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── 6. Approval Queues ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Supplier approvals */}
        <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Warehouse size={20} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-black text-[#121826]">Pending Supplier Approvals</h2>
              <p className="text-xs font-semibold text-[#667085]">{pendingSuppliers.length} waiting for review</p>
            </div>
          </div>
          {loading ? (
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ) : pendingSuppliers.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-[#F7F9FC] p-4 text-sm font-semibold text-[#667085]">
              <CheckCircle2 size={16} className="text-emerald-500" /> All clear — no pending approvals.
            </div>
          ) : (
            <ul className="space-y-2">
              {pendingSuppliers.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl border border-[#E7EAF0] bg-white p-3">
                  <div>
                    <p className="text-sm font-bold text-[#121826]">{s.supplier_name}</p>
                    <p className="text-xs text-[#667085]">{s.email || s.approval_status || "Pending registration"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => approveSupplier(s.id)} disabled={savingId === `s-${s.id}`} className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-100 disabled:opacity-50">
                      <CheckCircle2 size={12} /> Approve
                    </button>
                    <button type="button" onClick={() => rejectSupplier(s.id)}  disabled={savingId === `s-${s.id}`} className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50">
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Agent approvals */}
        <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F7FF] text-[#43A9F6]">
              <Users size={20} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-black text-[#121826]">Pending Agent Approvals</h2>
              <p className="text-xs font-semibold text-[#667085]">{pendingAgents.length} waiting for review</p>
            </div>
          </div>
          {loading ? (
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ) : pendingAgents.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-[#F7F9FC] p-4 text-sm font-semibold text-[#667085]">
              <CheckCircle2 size={16} className="text-emerald-500" /> All clear — no pending approvals.
            </div>
          ) : (
            <ul className="space-y-2">
              {pendingAgents.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-xl border border-[#E7EAF0] bg-white p-3">
                  <div>
                    <p className="text-sm font-bold text-[#121826]">{a.agent_name}</p>
                    <p className="text-xs text-[#667085]">{a.email || a.approval_status || "Pending registration"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => approveAgent(a.id)} disabled={savingId === `a-${a.id}`} className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-100 disabled:opacity-50">
                      <CheckCircle2 size={12} /> Approve
                    </button>
                    <button type="button" onClick={() => rejectAgent(a.id)}  disabled={savingId === `a-${a.id}`} className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50">
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── 7. Bottom row ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Quick actions */}
        <div className="lg:col-span-2 rounded-3xl border border-[#E7EAF0]/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="mb-4">
            <h2 className="text-base font-black text-[#121826]">Quick Actions</h2>
            <p className="mt-0.5 text-xs font-semibold text-[#667085]">Jump to common admin tasks</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: UserPlus, title: "Users",          desc: "Create users, assign roles, approve accounts.",     href: "/admin/users" },
              { icon: Shield,   title: "Roles",          desc: "Manage role access and module permissions.",         href: "/admin/roles" },
              { icon: Warehouse,title: "Suppliers",      desc: "Review and manage supplier accounts.",               href: "/admin/suppliers" },
              { icon: Users,    title: "Agents",         desc: "Review and manage agent registrations.",             href: "/admin/agents" },
              { icon: Headset,  title: "Email Templates",desc: "Update system email communication.",                href: "/admin/email" },
              { icon: TrendingUp,title:"Reports",        desc: "View analytics, exports, and data insights.",        href: "/admin/reports" },
            ].map((act) => (
              <Link
                key={act.title}
                href={act.href}
                className="group flex flex-col rounded-xl border border-[#E7EAF0] p-4 transition-all duration-200 hover:border-[#43A9F6]/40 hover:bg-[#F0F7FF] hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F7FF] text-[#43A9F6] transition-colors group-hover:bg-[#43A9F6] group-hover:text-white">
                  <act.icon size={18} />
                </div>
                <h3 className="text-sm font-bold text-[#121826]">{act.title}</h3>
                <p className="mt-1 text-[11px] font-semibold leading-snug text-[#667085]">{act.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity + alerts */}
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-5 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
            <div className="mb-3 flex items-center gap-2 text-[#121826]">
              <Activity size={16} className="text-[#43A9F6]" />
              <h2 className="text-sm font-black">Recent Activity</h2>
            </div>
            {activities.length === 0 ? (
              <p className="text-xs font-semibold text-[#667085]">No recent activities yet.</p>
            ) : (
              <ul className="space-y-2">
                {activities.slice(0, 6).map((log: ActivityLog, i: number) => (
                  <li key={i} className="rounded-lg bg-[#F7F9FC] p-2.5">
                    <p className="text-xs font-bold text-[#121826]">{log.action}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-[#667085]">
                      {log.entity_type} #{log.entity_id}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl border border-amber-200 bg-[#FFFCF5] p-5 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
            <div className="mb-2 flex items-center gap-2 text-amber-700">
              <AlertTriangle size={15} strokeWidth={2.5} />
              <h2 className="text-sm font-black">Alerts</h2>
            </div>
            <ul className="space-y-1.5 text-xs font-semibold text-amber-800">
              <li className="flex items-center gap-1.5">
                <Clock size={11} /> {pendingSuppliers.length} supplier approval{pendingSuppliers.length !== 1 ? "s" : ""} pending
              </li>
              <li className="flex items-center gap-1.5">
                <Clock size={11} /> {pendingAgents.length} agent approval{pendingAgents.length !== 1 ? "s" : ""} pending
              </li>
              {snapshot && snapshot.supplier_approval.pending > 0 && (
                <li className="flex items-center gap-1.5">
                  <Clock size={11} /> {snapshot.payment_collection.pending_pct}% payments still outstanding
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── shell ───────────────────────────────────────────────────────────────────

function AdminDashboardShell() {
  const { dashboard, loading, error, refetch } = useDashboard();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <p className="text-sm text-red-500">{error || "Could not load dashboard."}</p>
        <button type="button" onClick={() => void refetch()} className="ml-3 text-sm font-bold text-[#43A9F6]">
          Retry
        </button>
      </div>
    );
  }

  return (
    <DashboardLayout title="Dashboard" menus={dashboard.menus} user={dashboard.user}>
      <AdminDashboardContent user={dashboard.user} />
    </DashboardLayout>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminDashboardShell />
    </ProtectedRoute>
  );
}
